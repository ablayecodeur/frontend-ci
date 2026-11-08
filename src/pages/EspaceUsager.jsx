import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Ticket,
  Search,
  Landmark,
  Info,
  FolderOpen,
  FileText,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import {
  creerTicket,
} from "../data/ticketStore";

import {
  listerTickets,
  obtenirTicket,
  obtenirPosition,
} from "../api/tickets";
import { listerGuichets } from "../api/counters";

import {
  useServices,
  peutAttribuerTicket,
  serviceEstOuvert,
} from "../data/serviceStore";

import PageHeader from "../components/PageHeader";
import TicketStub from "../components/TicketStub";

const ICONES_SERVICES = [Landmark, Info, FolderOpen, FileText];

function normaliserTicket(ticket, serviceNom = "") {
  return {
    id: ticket.id,
    numero: ticket.ticket_number,
    serviceId: ticket.service_id,
    counterId: ticket.counter_id ?? null,
    serviceNom: serviceNom || `Service ${ticket.service_id}`,
    statut: ticket.status,
    createdAt: ticket.created_at,
    position: ticket.position ?? null,
    peopleAhead: ticket.people_ahead ?? null,
    notification: ticket.notification ?? null,
    message: ticket.message ?? null,
  };
}

function EspaceUsager() {
  const services = useServices();
  const { hash, key } = useLocation();

  const [serviceId, setServiceId] = useState("");
  const [numeroRecherche, setNumeroRecherche] = useState("");
  const [ticketRecherche, setTicketRecherche] = useState(null);
  const [positionTicket, setPositionTicket] = useState(null);
  const [message, setMessage] = useState(null);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [onglet, setOnglet] = useState(
    hash === "#suivi" ? "suivre" : "prendre"
  );
  const [actionEnCours, setActionEnCours] = useState(false);
  const [guichets, setGuichets] = useState([]);

  useEffect(() => {
    const intervalle = setInterval(() => {
      setMaintenant(new Date());
    }, 15000);

    return () => clearInterval(intervalle);
  }, []);

  useEffect(() => {
    if (hash === "#suivi") setOnglet("suivre");
    if (hash === "#ticket") setOnglet("prendre");
  }, [hash, key]);

  useEffect(() => {
    let actif = true;

    listerGuichets()
      .then((resultat) => {
        if (actif) {
          setGuichets(Array.isArray(resultat) ? resultat : []);
        }
      })
      .catch((erreur) => {
        console.error("Impossible de charger les guichets :", erreur);
      });

    return () => {
      actif = false;
    };
  }, []);
  const serviceSelectionne = services.find(
    (service) => service.id === Number(serviceId)
  );

  const disponibilite = (service) => {
    if (!service.actif) {
      return {
        label: "Désactivé",
        tone: "off",
        disponible: false,
      };
    }

    if (!serviceEstOuvert(service, maintenant)) {
      return {
        label: "Fermé",
        tone: "closed",
        disponible: false,
      };
    }

    if (!peutAttribuerTicket(service, maintenant)) {
      return {
        label: "Distribution terminée",
        tone: "limited",
        disponible: false,
      };
    }

    return {
      label: "Disponible",
      tone: "open",
      disponible: true,
    };
  };

  const changerOnglet = (nouvelOnglet) => {
    setOnglet(nouvelOnglet);
    setMessage(null);
  };

  const selectionnerService = (service) => {
    setServiceId(String(service.id));
    setOnglet("prendre");
    setMessage(null);

    if (window.matchMedia("(max-width: 959px)").matches) {
      document.getElementById("ticket")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  async function prendreTicket(e) {
    e?.preventDefault();

    if (!serviceSelectionne) {
      setMessage({
        texte: "Veuillez sélectionner un service.",
        ton: "error",
      });
      return;
    }

    if (!peutAttribuerTicket(serviceSelectionne, maintenant)) {
      setMessage({
        texte: "La distribution des tickets est fermée pour ce service.",
        ton: "error",
      });
      return;
    }

    setActionEnCours(true);
    setMessage(null);

    try {
      const nouveauTicket = await creerTicket(serviceSelectionne);

      setTicketRecherche(nouveauTicket);
      setPositionTicket(nouveauTicket.position);
      setNumeroRecherche(nouveauTicket.numero);
      setOnglet("suivre");

      setMessage({
        texte: `Votre ticket ${nouveauTicket.numero} a été créé avec succès.`,
        ton: "success",
      });
    } catch (erreur) {
      setMessage({
        texte: erreur.message || "Impossible de créer votre ticket.",
        ton: "error",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  async function rechercherTicket(e) {
    e.preventDefault();

    const numero = numeroRecherche.trim().toUpperCase();

    if (!numero) {
      setMessage({
        texte: "Veuillez saisir un numéro de ticket.",
        ton: "error",
      });
      setTicketRecherche(null);
      setPositionTicket(null);
      return;
    }

    setActionEnCours(true);
    setMessage(null);
    setTicketRecherche(null);
    setPositionTicket(null);

    try {
      let ticketTrouve = null;
      let offset = 0;
      let total = 0;

      do {
        const resultat = await listerTickets({
          limit: 200,
          offset,
        });

        total = resultat.total || 0;

        ticketTrouve = (resultat.items || []).find(
          (ticket) =>
            ticket.ticket_number?.toUpperCase() === numero
        );

        if (ticketTrouve) break;

        offset += 200;
      } while (offset < total);

      if (!ticketTrouve) {
        setMessage({
          texte: "Aucun ticket trouvé avec ce numéro.",
          ton: "error",
        });
        return;
      }

      const details = await obtenirTicket(ticketTrouve.id);

      const service = services.find(
        (item) => item.id === details.service_id
      );

      const ticketNormalise = normaliserTicket(
        details,
        service?.nom
      );

      setTicketRecherche(ticketNormalise);
      setNumeroRecherche(numero);

      if (details.status === "WAITING") {
        const position = await obtenirPosition(details.id);
        setPositionTicket(position.position ?? null);
      }

      setMessage(null);
    } catch (erreur) {
      setMessage({
        texte: erreur.message || "Impossible de rechercher ce ticket.",
        ton: "error",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  // Actualisation automatique du ticket et de sa position.
  useEffect(() => {
    if (!ticketRecherche?.id) return;

    let actif = true;

    async function actualiserSuivi() {
      try {
        const details = await obtenirTicket(ticketRecherche.id);

        if (!actif) return;

        const service = services.find(
          (item) => item.id === details.service_id
        );

        const ticketActualise = normaliserTicket(
          details,
          service?.nom
        );

        setTicketRecherche(ticketActualise);

        if (details.status === "WAITING") {
          const position = await obtenirPosition(details.id);

          if (actif) {
            setPositionTicket(position.position ?? null);
          }
        } else if (actif) {
          setPositionTicket(null);
        }
      } catch {
        // Une erreur ponctuelle de suivi ne supprime pas le ticket affiché.
      }
    }

    actualiserSuivi();

    const intervalle = setInterval(actualiserSuivi, 5000);

    return () => {
      actif = false;
      clearInterval(intervalle);
    };
  }, [ticketRecherche?.id, services]);

  const ticketActuel = ticketRecherche;

  const serviceDuTicket = ticketActuel
    ? services.find(
        (service) => service.id === ticketActuel.serviceId
      )
    : null;

  const guichetDuTicket = guichets.find(
    (guichet) => guichet.id === ticketActuel?.counterId
  )?.name || null;
  const dateTicket = ticketActuel?.createdAt
    ? new Date(ticketActuel.createdAt).toLocaleString("fr-FR")
    : "Non renseignée";

  const peutPrendre =
    serviceSelectionne &&
    peutAttribuerTicket(serviceSelectionne, maintenant);

  return (
    <main className="page shell">
      <PageHeader
        icon={Ticket}
        label="Espace usager"
        title="Prenez votre ticket, suivez votre tour"
        description="Choisissez un service, obtenez votre numéro et suivez votre position dans la file d'attente."
      />

      <div className="usager-layout">
        <section id="services" aria-labelledby="titre-services">
          <div className="section-head">
            <div>
              <h2 id="titre-services">Services</h2>
              <p className="muted">
                Consultez les horaires et choisissez le service souhaité.
              </p>
            </div>

            <span className="count-pill">
              {services.length} service{services.length > 1 ? "s" : ""}
            </span>
          </div>

          {services.length === 0 ? (
            <div className="empty-state panel">
              <p>
                <strong>Aucun service disponible</strong>
              </p>
              <p>
                La liste des services est vide. Veuillez réessayer plus tard.
              </p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service, index) => {
                const etat = disponibilite(service);
                const selectionne = String(service.id) === serviceId;
                const Icone = ICONES_SERVICES[
                  index % ICONES_SERVICES.length
                ];

                return (
                  <article
                    key={service.id}
                    className={`service-card ${
                      selectionne ? "is-selected" : ""
                    }`}
                  >
                    <div className="service-top">
                      <span className="service-icon">
                        <Icone size={22} aria-hidden="true" />
                      </span>

                      <span className={`pill pill-${etat.tone}`}>
                        {etat.label}
                      </span>
                    </div>

                    <h3>{service.nom}</h3>

                    <p className="service-description">
                      {service.description ||
                        "Aucune description disponible."}
                    </p>

                    <dl className="service-hours">
                      <div>
                        <dt>Ouverture</dt>
                        <dd>{service.heureOuverture}</dd>
                      </div>

                      <div>
                        <dt>Fermeture</dt>
                        <dd>{service.heureFermeture}</dd>
                      </div>

                      <div>
                        <dt>Fin de distribution</dt>
                        <dd>{service.heureLimiteTickets}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className={`btn ${
                        selectionne ? "btn-selected" : "btn-outline"
                      } btn-block`}
                      disabled={!etat.disponible}
                      aria-pressed={selectionne}
                      onClick={() => selectionnerService(service)}
                    >
                      {selectionne && (
                        <CheckCircle2 size={18} aria-hidden="true" />
                      )}

                      {selectionne
                        ? "Service sélectionné"
                        : etat.disponible
                          ? "Choisir ce service"
                          : "Indisponible"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside id="ticket" className="panel usager-aside">
          <span
            id="suivi"
            className="anchor-point"
            aria-hidden="true"
          ></span>

          <div
            className="tabs"
            role="tablist"
            aria-label="Actions sur le ticket"
          >
            <button
              type="button"
              role="tab"
              id="onglet-prendre"
              aria-selected={onglet === "prendre"}
              aria-controls="panneau-prendre"
              onClick={() => changerOnglet("prendre")}
            >
              <Ticket size={17} aria-hidden="true" />
              Prendre un ticket
            </button>

            <button
              type="button"
              role="tab"
              id="onglet-suivre"
              aria-selected={onglet === "suivre"}
              aria-controls="panneau-suivre"
              onClick={() => changerOnglet("suivre")}
            >
              <Search size={17} aria-hidden="true" />
              Suivre mon ticket
            </button>
          </div>

          {onglet === "prendre" ? (
            <form
              id="panneau-prendre"
              role="tabpanel"
              aria-labelledby="onglet-prendre"
              onSubmit={prendreTicket}
              className="aside-form"
            >
              <p className="muted">
                Sélectionnez un service disponible pour obtenir votre ticket.
              </p>

              <label htmlFor="service">Service souhaité</label>

              <select
                id="service"
                value={serviceId}
                disabled={actionEnCours}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setMessage(null);
                }}
              >
                <option value="">Choisir un service</option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                    disabled={!disponibilite(service).disponible}
                  >
                    {service.nom} — {disponibilite(service).label}
                  </option>
                ))}
              </select>

              {serviceSelectionne && (
                <div className="service-recap">
                  <p className="service-recap-title">
                    <Clock3 size={16} aria-hidden="true" />

                    {serviceSelectionne.nom}

                    <span
                      className={`pill pill-${
                        disponibilite(serviceSelectionne).tone
                      }`}
                    >
                      {disponibilite(serviceSelectionne).label}
                    </span>
                  </p>

                  <dl>
                    <div>
                      <dt>Ouverture</dt>
                      <dd>{serviceSelectionne.heureOuverture}</dd>
                    </div>

                    <div>
                      <dt>Fermeture</dt>
                      <dd>{serviceSelectionne.heureFermeture}</dd>
                    </div>

                    <div>
                      <dt>Fin de distribution</dt>
                      <dd>{serviceSelectionne.heureLimiteTickets}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={!peutPrendre || actionEnCours}
              >
                <Ticket size={18} aria-hidden="true" />
                {actionEnCours ? "Création en cours..." : "Prendre un ticket"}
              </button>
            </form>
          ) : (
            <form
              id="panneau-suivre"
              role="tabpanel"
              aria-labelledby="onglet-suivre"
              onSubmit={rechercherTicket}
              className="aside-form"
            >
              <p className="muted">
                Saisissez le numéro du ticket reçu pour consulter son état.
              </p>

              <label htmlFor="numeroTicket">Numéro du ticket</label>

              <input
                id="numeroTicket"
                type="text"
                placeholder="Exemple : A001"
                autoComplete="off"
                value={numeroRecherche}
                disabled={actionEnCours}
                onChange={(e) => setNumeroRecherche(e.target.value)}
              />

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={actionEnCours}
              >
                <Search size={18} aria-hidden="true" />
                {actionEnCours ? "Recherche en cours..." : "Rechercher"}
              </button>
            </form>
          )}

          {message && (
            <p
              className={`notice notice-${message.ton}`}
              role="status"
            >
              {message.texte}
            </p>
          )}

          {ticketActuel && (
            <TicketStub
              className="stub-panel"
              numero={ticketActuel.numero}
              guichetNom={guichetDuTicket}
              serviceNom={
                ticketActuel.serviceNom ||
                serviceDuTicket?.nom ||
                "Service non renseigné"
              }
              date={dateTicket}
              statut={ticketActuel.statut}
              position={positionTicket}
            >
              {ticketActuel.statut === "CALLED" && (
                <p className="stub-callout">
                  C'est votre tour. Veuillez vous présenter au guichet.
                </p>
              )}

              {ticketActuel.statut === "IN_PROGRESS" && (
                <p className="stub-callout">
                  Votre passage est en cours de traitement.
                </p>
              )}

              {ticketActuel.statut === "WAITING" &&
                positionTicket != null && (
                  <p className="muted">
                    {positionTicket === 1
                      ? "Vous êtes le prochain dans la file."
                      : `${positionTicket - 1} personne(s) avant vous.`}
                  </p>
                )}

              {ticketActuel.statut === "COMPLETED" && (
                <p className="muted">
                  Votre passage est terminé. Merci de votre visite.
                </p>
              )}
            </TicketStub>
          )}
        </aside>
      </div>
    </main>
  );
}

export default EspaceUsager;
