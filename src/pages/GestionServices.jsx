import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Power, Save, X, RefreshCw } from "lucide-react";
import {
  listerTousServicesAdmin,
  creerService,
  modifierService,
} from "../api/services";

const formulaireVide = {
  name: "",
  opening_time: "08:00",
  closing_time: "16:00",
  no_show_timeout_seconds: 120,
};

function GestionServices() {
  const [services, setServices] = useState([]);
  const [formulaire, setFormulaire] = useState(formulaireVide);
  const [editionId, setEditionId] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  async function chargerServices() {
    setChargement(true);
    setErreur("");
    try {
      const resultat = await listerTousServicesAdmin();
      setServices(Array.isArray(resultat) ? resultat : []);
    } catch (e) {
      setErreur(e.message || "Impossible de charger les services.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerServices();
  }, []);

  function modifierChamp(e) {
    const { name, value } = e.target;
    setFormulaire((ancien) => ({ ...ancien, [name]: value }));
  }

  function commencerEdition(service) {
    setEditionId(service.id);
    setFormulaire({
      name: service.name,
      opening_time: service.opening_time,
      closing_time: service.closing_time,
      no_show_timeout_seconds: service.no_show_timeout_seconds,
    });
    setMessage("");
    setErreur("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function annulerEdition() {
    setEditionId(null);
    setFormulaire(formulaireVide);
  }

  async function enregistrer(e) {
    e.preventDefault();
    setAction(true);
    setErreur("");
    setMessage("");

    const donnees = {
      name: formulaire.name.trim(),
      opening_time: formulaire.opening_time,
      closing_time: formulaire.closing_time,
      no_show_timeout_seconds: Number(formulaire.no_show_timeout_seconds),
    };

    try {
      if (editionId) {
        await modifierService(editionId, donnees);
        setMessage("Service modifié avec succès.");
      } else {
        await creerService(donnees);
        setMessage("Service créé avec succès.");
      }
      annulerEdition();
      await chargerServices();
    } catch (e) {
      setErreur(e.message || "L'enregistrement a échoué.");
    } finally {
      setAction(false);
    }
  }

  async function basculerActivation(service) {
    const confirmation = service.is_active
      ? `Désactiver le service « ${service.name} » ?`
      : `Réactiver le service « ${service.name} » ?`;
    if (!window.confirm(confirmation)) return;

    setAction(true);
    setErreur("");
    setMessage("");
    try {
      await modifierService(service.id, { is_active: !service.is_active });
      setMessage(service.is_active ? "Service désactivé." : "Service réactivé.");
      await chargerServices();
    } catch (e) {
      setErreur(e.message || "Impossible de modifier ce service.");
    } finally {
      setAction(false);
    }
  }

  const champStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid var(--line)",
    borderRadius: "10px",
    background: "var(--surface)",
    color: "var(--text)",
    font: "inherit",
    marginTop: "6px",
  };

  return (
    <main className="shell section">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link to="/admin" className="btn btn-secondary" style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 24 }}>
          <ArrowLeft size={17} /> Retour à l'administration
        </Link>

        <div className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <h1>Gestion des services</h1>
            <p>Crée, modifie, active ou désactive les services de SamaFile.</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={chargerServices} disabled={chargement || action}>
            <RefreshCw size={17} /> Actualiser
          </button>
        </div>

        {erreur && <p role="alert" style={{ padding: 14, borderRadius: 10, background: "var(--danger-soft)", color: "var(--danger)", marginBottom: 16 }}>{erreur}</p>}
        {message && <p role="status" style={{ padding: 14, borderRadius: 10, background: "var(--ok-soft)", color: "var(--ok)", marginBottom: 16 }}>{message}</p>}

        <section className="stub-panel" style={{ padding: 24, marginBottom: 32 }}>
          <h2 style={{ marginBottom: 20 }}>{editionId ? "Modifier le service" : "Ajouter un service"}</h2>
          <form onSubmit={enregistrer}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
              <label>
                Nom du service
                <input style={champStyle} name="name" value={formulaire.name} onChange={modifierChamp} required maxLength={100} placeholder="Ex. Dépôt" />
              </label>
              <label>
                Heure d'ouverture
                <input style={champStyle} type="time" name="opening_time" value={formulaire.opening_time} onChange={modifierChamp} required />
              </label>
              <label>
                Heure de fermeture
                <input style={champStyle} type="time" name="closing_time" value={formulaire.closing_time} onChange={modifierChamp} required />
              </label>
              <label>
                Délai d'absence (secondes)
                <input style={champStyle} type="number" name="no_show_timeout_seconds" min="10" max="3600" value={formulaire.no_show_timeout_seconds} onChange={modifierChamp} required />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button className="btn btn-primary" type="submit" disabled={action}>
                <Save size={17} /> {action ? "Enregistrement..." : editionId ? "Enregistrer les modifications" : "Créer le service"}
              </button>
              {editionId && <button className="btn btn-secondary" type="button" onClick={annulerEdition}><X size={17} /> Annuler</button>}
            </div>
          </form>
        </section>

        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2>Services existants</h2>
          <span className="count-pill">{services.length} service(s)</span>
        </div>

        {chargement ? <p>Chargement des services...</p> : services.length === 0 ? (
          <p>Aucun service enregistré.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {services.map((service) => (
              <article key={service.id} className="stub-panel" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ marginBottom: 8 }}>{service.name}</h3>
                  <p style={{ color: "var(--muted)", marginBottom: 8 }}>
                    Horaires : {service.opening_time} – {service.closing_time}
                    {" · "}Délai d'absence : {service.no_show_timeout_seconds} s
                  </p>
                  <span className={`pill ${service.is_active ? "pill-open" : "pill-off"}`}>
                    {service.is_active ? "Actif" : "Désactivé"}
                  </span>
                  {service.is_active && (
                    <span className={`pill ${service.is_open ? "pill-open" : "pill-closed"}`} style={{ marginLeft: 8 }}>
                      {service.is_open ? "Ouvert actuellement" : "Fermé actuellement"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" type="button" onClick={() => commencerEdition(service)} disabled={action}>
                    <Pencil size={16} /> Modifier
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => basculerActivation(service)} disabled={action}>
                    <Power size={16} /> {service.is_active ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default GestionServices;