import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Hourglass,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Check,
  Ban,
  Inbox,
} from "lucide-react";

import {
  appelerProchain,
  demarrerTicket,
  terminerTicket,
  annulerTicket,
  declarerAbsent,
  reactiverTicket,
  useTicketsState,
} from "../data/ticketStore";

import { listerGuichets } from "../api/counters";
import { useAuth } from "../context/AuthContext";
import { useServices } from "../data/serviceStore";
import PageHeader from "../components/PageHeader";
import TicketStub from "../components/TicketStub";
import StatusBadge from "../components/StatusBadge";

function heureTicket(iso) {
  return iso
    ? new Date(iso).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function EspaceAgent() {
  const { tickets, loading: chargementTickets, error: erreurChargementTickets } = useTicketsState();
  const services = useServices();
  const { user } = useAuth();

  const [serviceId, setServiceId] = useState("");
  const [counterId, setCounterId] = useState("");
  const [guichets, setGuichets] = useState([]);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargementGuichets, setChargementGuichets] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);

  useEffect(() => {
    if (
      user?.role !== "AGENT" &&
      !serviceId &&
      services.length > 0
    ) {
      setServiceId(String(services[0].id));
    }
  }, [services, serviceId, user?.role]);

  useEffect(() => {
    let actif = true;

    async function chargerGuichets() {
      if (user?.role === "AGENT" && !user.counter_id) {
        setGuichets([]);
        setCounterId("");
        setErreur("Aucun guichet n'est affecté à votre compte.");
        setChargementGuichets(false);
        return;
      }

      if (user?.role !== "AGENT" && !serviceId) {
        setGuichets([]);
        setCounterId("");
        return;
      }

      setChargementGuichets(true);
      setErreur("");

      if (user?.role !== "AGENT") {
        setCounterId("");
      }

      try {
        const resultat = await listerGuichets(
          user?.role === "AGENT" ? undefined : Number(serviceId)
        );

        if (!actif) return;

        if (user?.role === "AGENT") {
          const guichetAffecte = resultat.find(
            (guichet) => Number(guichet.id) === Number(user.counter_id)
          );

          if (!guichetAffecte) {
            setGuichets([]);
            setCounterId("");
            setErreur("Votre guichet affecté est introuvable.");
            return;
          }

          setGuichets([guichetAffecte]);
          setCounterId(String(guichetAffecte.id));
          setServiceId(String(guichetAffecte.service_id));
        } else {
          const disponibles = resultat.filter(
            (guichet) => guichet.is_active
          );

          setGuichets(disponibles);

          if (disponibles.length > 0) {
            setCounterId(String(disponibles[0].id));
          }
        }
      } catch (error) {
        if (actif) {
          setGuichets([]);
          setErreur(
            error.message || "Impossible de charger les guichets."
          );
        }
      } finally {
        if (actif) setChargementGuichets(false);
      }
    }

    chargerGuichets();

    return () => {
      actif = false;
    };
  }, [serviceId, user?.role, user?.counter_id]);

  const serviceSelectionne = services.find(
    (service) => service.id === Number(serviceId)
  );

  const guichetSelectionne = guichets.find(
    (guichet) => guichet.id === Number(counterId)
  );

  const ticketsDuService = tickets
    .filter((ticket) => ticket.serviceId === Number(serviceId))
    .map((ticket) => ({
      ...ticket,
      serviceNom:
        services.find((service) => service.id === ticket.serviceId)?.nom ||
        ticket.serviceNom,
    }));

  const ticketEnCours = ticketsDuService.find(
    (ticket) =>
      ticket.counterId === Number(counterId) &&
      ["CALLED", "IN_PROGRESS"].includes(ticket.statut)
  );

  const absencesEnCours = useRef(new Set());

  useEffect(() => {
    if (
      !ticketEnCours ||
      ticketEnCours.statut !== "CALLED" ||
      !ticketEnCours.calledAt ||
      actionEnCours
    ) {
      return;
    }

    const ticketId = ticketEnCours.id;
    const numeroTicket = ticketEnCours.numero;
    const timeoutSecondes =
      serviceSelectionne?.noShowTimeoutSeconds || 120;

    const valeurDate = ticketEnCours.calledAt;
    const dateAppel = new Date(
      /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valeurDate)
        ? valeurDate
        : `${valeurDate}Z`
    );

    if (!Number.isFinite(dateAppel.getTime())) {
      console.error("Date d'appel invalide :", valeurDate);
      return;
    }

    const intervalle = setInterval(async () => {
      const tempsEcoule = Date.now() - dateAppel.getTime();
      const delaiEcoule = timeoutSecondes * 1000;

      if (
        tempsEcoule < delaiEcoule ||
        absencesEnCours.current.has(ticketId)
      ) {
        return;
      }

      absencesEnCours.current.add(ticketId);

      try {
        await declarerAbsent(ticketId);
        setMessage(
          `Le ticket ${numeroTicket} a été déclaré absent automatiquement.`
        );
        setErreur("");
      } catch (error) {
        absencesEnCours.current.delete(ticketId);

        if (
          !String(error.message || "").includes("NO_SHOW_TOO_EARLY")
        ) {
          setErreur(
            error.message || "Impossible de déclarer le ticket absent."
          );
        }
      }
    }, 1000);

    return () => clearInterval(intervalle);
  }, [
    ticketEnCours?.id,
    ticketEnCours?.statut,
    ticketEnCours?.calledAt,
    ticketEnCours?.numero,
    serviceSelectionne?.noShowTimeoutSeconds,
    actionEnCours,
  ]);

  const enAttente = ticketsDuService.filter(
    (ticket) => ticket.statut === "WAITING"
  );

  const termines = ticketsDuService.filter(
    (ticket) => ticket.statut === "COMPLETED"
  );

  const annules = ticketsDuService.filter(
    (ticket) => ticket.statut === "CANCELLED"
  );

  function changerService(e) {
    setServiceId(e.target.value);
    setMessage("");
    setErreur("");
  }

  function changerGuichet(e) {
    setCounterId(e.target.value);
    setMessage("");
    setErreur("");
  }

  async function appeler() {
    if (!guichetSelectionne) {
      setErreur("Veuillez sélectionner un guichet.");
      return;
    }

    setActionEnCours(true);
    setMessage("");
    setErreur("");

    try {
      const resultat = await appelerProchain(guichetSelectionne.id);

      setMessage(
        resultat.message ||
        `Ticket ${resultat.numero} appelé avec succès.`
      );
    } catch (error) {
      setErreur(error.message || "Impossible d'appeler le prochain ticket.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function demarrer() {
    if (!ticketEnCours) return;

    setActionEnCours(true);
    setMessage("");
    setErreur("");

    try {
      await demarrerTicket(ticketEnCours.id);
      setMessage(`Traitement du ticket ${ticketEnCours.numero} démarré.`);
    } catch (error) {
      setErreur(error.message || "Impossible de démarrer le traitement.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function terminer() {
    if (!ticketEnCours) return;

    setActionEnCours(true);
    setMessage("");
    setErreur("");

    try {
      await terminerTicket(ticketEnCours.id);
      setMessage(`Ticket ${ticketEnCours.numero} terminé.`);
    } catch (error) {
      setErreur(error.message || "Impossible de terminer le ticket.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function annuler() {
    if (!ticketEnCours) return;

    setActionEnCours(true);
    setMessage("");
    setErreur("");

    try {
      await annulerTicket(ticketEnCours.id);
      setMessage(`Ticket ${ticketEnCours.numero} annulé.`);
    } catch (error) {
      setErreur(error.message || "Impossible d'annuler le ticket.");
    } finally {
      setActionEnCours(false);
    }
  }

  const absents = ticketsDuService.filter(
    (ticket) => ticket.statut === "NO_SHOW"
  );

  async function reactiver(id, numero) {
    setActionEnCours(true);
    setMessage("");
    setErreur("");

    try {
      await reactiverTicket(id);
      setMessage(`Le ticket ${numero} a été réactivé.`);
    } catch (error) {
      setErreur(error.message || "Impossible de réactiver le ticket.");
    } finally {
      setActionEnCours(false);
    }
  }
  const compteurs = [
    {
      label: "En attente",
      valeur: enAttente.length,
      icone: Hourglass,
      tone: "waiting",
    },
    {
      label: "Terminés",
      valeur: termines.length,
      icone: CheckCircle2,
      tone: "done",
    },
    {
      label: "Annulés",
      valeur: annules.length,
      icone: XCircle,
      tone: "cancelled",
    },
  ];

  return (
    <main className="page shell">
      <PageHeader
        icon={LayoutDashboard}
        label="Espace agent"
        title="Tableau de bord du guichet"
        description="Gérez les tickets du service auquel vous êtes affecté."
      />

      <section className="panel" style={{ marginBottom: "24px" }}>
        <label
          htmlFor="agent-service"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          Service géré par l'agent
        </label>

        <select
          id="agent-service"
          value={serviceId}
          onChange={changerService}
          disabled={user?.role === "AGENT" || services.length === 0 || actionEnCours}
          style={{
            width: "100%",
            maxWidth: "450px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: "15px",
          }}
        >
          {services.length === 0 && (
            <option value="">Aucun service disponible</option>
          )}

          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nom}
            </option>
          ))}
        </select>

        <label
          htmlFor="agent-guichet"
          style={{
            display: "block",
            fontWeight: 600,
            marginTop: "18px",
            marginBottom: "10px",
          }}
        >
          Guichet utilisé
        </label>

        <select
          id="agent-guichet"
          value={counterId}
          onChange={changerGuichet}
          disabled={user?.role === "AGENT" || chargementGuichets || guichets.length === 0 || actionEnCours}
          style={{
            width: "100%",
            maxWidth: "450px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: "15px",
          }}
        >
          {chargementGuichets && (
            <option value="">Chargement des guichets...</option>
          )}

          {!chargementGuichets && guichets.length === 0 && (
            <option value="">Aucun guichet disponible</option>
          )}

          {guichets.map((guichet) => (
            <option key={guichet.id} value={guichet.id}>
              {guichet.name}
            </option>
          ))}
        </select>
      </section>

      {serviceSelectionne && (
        <p className="muted" style={{ marginBottom: "20px" }}>
          File d'attente du service :{" "}
          <strong>{serviceSelectionne.nom}</strong>
          {guichetSelectionne && (
            <> — Guichet : <strong>{guichetSelectionne.name}</strong></>
          )}
        </p>
      )}

      <section className="kpis" aria-label="Compteurs de la file">
        {compteurs.map(({ label, valeur, icone: Icone, tone }) => (
          <div className="kpi" key={label}>
            <span className={`kpi-icon kpi-${tone}`}>
              <Icone size={22} aria-hidden="true" />
            </span>
            <div>
              <strong>{valeur}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {chargementTickets && tickets.length === 0 && (
        <p className="notice" role="status">
          Chargement des tickets...
        </p>
      )}

      {erreurChargementTickets && (
        <p className="notice notice-error" role="alert">
          Impossible d'actualiser les tickets : {erreurChargementTickets}
        </p>
      )}

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      {erreur && (
        <p className="notice" role="alert">
          {erreur}
        </p>
      )}

      <div className="agent-layout">
        <section
          className="panel agent-current"
          aria-labelledby="titre-en-cours"
        >
          <h2 id="titre-en-cours">Passage en cours</h2>

          {ticketEnCours ? (
            <>
              <TicketStub
                className="stub-panel"
                numero={ticketEnCours.numero}
                serviceNom={ticketEnCours.serviceNom}
                date={heureTicket(ticketEnCours.createdAt)}
                statut={ticketEnCours.statut}
              />

              <div className="action-row">
                {ticketEnCours.statut === "CALLED" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={demarrer}
                    disabled={actionEnCours}
                  >
                    <PhoneCall size={18} aria-hidden="true" />
                    Démarrer le traitement
                  </button>
                )}

                {ticketEnCours.statut === "IN_PROGRESS" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={terminer}
                    disabled={actionEnCours}
                  >
                    <Check size={18} aria-hidden="true" />
                    Terminer le passage
                  </button>
                )}

                {ticketEnCours.statut === "CALLED" && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={annuler}
                    disabled={actionEnCours}
                  >
                    <Ban size={18} aria-hidden="true" />
                    Annuler le ticket
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="agent-idle">
              <span className="idle-icon">
                <PhoneCall size={26} aria-hidden="true" />
              </span>

              <p>Aucun passage en cours sur ce guichet.</p>

              {enAttente.length > 0 && (
                <p className="muted">
                  Prochain ticket : <strong>{enAttente[0].numero}</strong>
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={appeler}
                disabled={
                  !guichetSelectionne ||
                  enAttente.length === 0 ||
                  actionEnCours
                }
              >
                <PhoneCall size={18} aria-hidden="true" />
                Appeler le prochain ticket
              </button>
            </div>
          )}
        </section>

        <section
          className="panel agent-queue"
          aria-labelledby="titre-file"
        >
          <div className="section-head">
            <h2 id="titre-file">File d'attente</h2>
            <span className="count-pill">
              {enAttente.length} en attente
            </span>
          </div>

          {enAttente.length === 0 ? (
            <div className="empty-state">
              <Inbox size={28} aria-hidden="true" />
              <p>Aucun ticket en attente pour ce service.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Ordre</th>
                    <th scope="col">Numéro</th>
                    <th scope="col">Service</th>
                    <th scope="col">Arrivée</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {enAttente.map((ticket, index) => (
                    <tr key={ticket.id}>
                      <td>{index + 1}</td>
                      <td><strong>{ticket.numero}</strong></td>
                      <td>{ticket.serviceNom}</td>
                      <td>{heureTicket(ticket.createdAt)}</td>
                      <td><StatusBadge statut="WAITING" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <section className="panel" style={{ marginTop: "24px" }}>
        <div className="section-head">
          <h2>Tickets déclarés absents</h2>
          <span className="count-pill">
            {absents.length} absent(s)
          </span>
        </div>

        {absents.length === 0 ? (
          <p className="muted">Aucun ticket absent.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Service</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {absents.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><strong>{ticket.numero}</strong></td>
                    <td>{ticket.serviceNom}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={actionEnCours}
                        onClick={() => reactiver(ticket.id, ticket.numero)}
                      >
                        Réactiver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default EspaceAgent;
