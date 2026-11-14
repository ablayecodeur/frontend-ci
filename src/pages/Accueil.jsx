import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Building2,
  Ticket,
  BellRing,
  CheckCircle2,
  PhoneCall,
  ListChecks,
  Users,
} from "lucide-react";
import TicketStub from "../components/TicketStub";
import { useServices, peutAttribuerTicket } from "../data/serviceStore";

const ETAPES = [
  {
    icone: Building2,
    titre: "Choisissez un service",
    texte: "Consultez les services, leurs horaires, puis sélectionnez celui dont vous avez besoin.",
  },
  {
    icone: Ticket,
    titre: "Prenez votre ticket",
    texte: "Vous recevez un numéro et voyez votre position dans la file.",
  },
  {
    icone: BellRing,
    titre: "Rendez-vous au guichet",
    texte: "Suivez votre tour avec votre numéro. Quand l'agent vous appelle, présentez-vous.",
  },
];

const POUR_USAGERS = [
  "Horaires et disponibilité de chaque service",
  "Un ticket numéroté en quelques secondes",
  "Votre position mise à jour avec votre numéro",
];

const POUR_AGENTS = [
  "Appel du prochain ticket en un clic",
  "Un seul passage en cours à la fois",
  "Compteurs des tickets en attente, terminés et annulés",
];

function Accueil() {
  const services = useServices();
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    const intervalle = setInterval(() => setMaintenant(new Date()), 15000);
    return () => clearInterval(intervalle);
  }, []);

  const disponibles = services.filter((s) => peutAttribuerTicket(s, maintenant)).length;

  const etatServices =
    disponibles === 0
      ? "Aucun service disponible pour le moment"
      : `${disponibles} service${disponibles > 1 ? "s" : ""} disponible${disponibles > 1 ? "s" : ""} maintenant`;

  return (
    <main className="home">
      <section className="hero shell">
        <div className="hero-copy">
          <p className="hero-status">
            <span className="live-dot" aria-hidden="true"></span>
            {etatServices}
          </p>

          <h1>Prenez votre ticket. Gardez votre temps.</h1>

          <p className="hero-description">
            SamaFile organise la file d'attente de vos services publics.
            Choisissez un service, obtenez votre numéro et suivez votre tour
            sans rester debout au guichet.
          </p>

          <div className="hero-actions">
            <Link to="/usager#ticket" className="btn btn-accent btn-lg">
              Prendre un ticket
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link to="/usager#suivi" className="btn btn-outline-light btn-lg">
              <Search size={18} aria-hidden="true" />
              Suivre un ticket
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="false">
          <TicketStub
            className="stub-hero"
            numero="A024"
            serviceNom="Service général"
            statut="WAITING"
            position="3"
          >
            <div className="stub-progress">
              <div className="stub-progress-head">
                <span>Progression de la file</span>
                <strong>3 devant vous</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>
            </div>
          </TicketStub>
          <p className="hero-caption">Exemple de ticket</p>
        </div>
      </section>

      <section className="section shell" aria-labelledby="titre-etapes">
        <div className="section-intro">
          <h2 id="titre-etapes">Trois étapes, du ticket au guichet</h2>
          <p>Un parcours simple, identique pour chaque service.</p>
        </div>

        <ol className="steps">
          {ETAPES.map(({ icone: Icone, titre, texte }, index) => (
            <li className="step" key={titre}>
              <span className="step-number">{index + 1}</span>
              <span className="step-icon">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h3>{titre}</h3>
              <p>{texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section shell" aria-labelledby="titre-espaces">
        <div className="section-intro">
          <h2 id="titre-espaces">Un espace pour chaque rôle</h2>
          <p>Les usagers prennent leur tour, les agents gèrent les appels.</p>
        </div>

        <div className="audience">
          <article className="audience-card audience-usager">
            <span className="audience-icon">
              <Users size={22} aria-hidden="true" />
            </span>
            <h3>Pour les usagers</h3>
            <ul className="check-list">
              {POUR_USAGERS.map((ligne) => (
                <li key={ligne}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {ligne}
                </li>
              ))}
            </ul>
            <Link to="/usager#services" className="btn btn-primary">
              Voir les services
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>

          <article className="audience-card audience-agent">
            <span className="audience-icon">
              <PhoneCall size={22} aria-hidden="true" />
            </span>
            <h3>Pour les agents</h3>
            <ul className="check-list">
              {POUR_AGENTS.map((ligne) => (
                <li key={ligne}>
                  <ListChecks size={18} aria-hidden="true" />
                  {ligne}
                </li>
              ))}
            </ul>
            <Link to="/agent" className="btn btn-dark">
              Ouvrir le guichet
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Accueil;
