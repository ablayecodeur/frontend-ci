import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  RefreshCw,
  Pencil,
  KeyRound,
  Power,
  Save,
  X,
} from "lucide-react";

import {
  listerUtilisateurs,
  creerUtilisateur,
  modifierUtilisateur,
  reinitialiserMotDePasse,
} from "../api/users";
import { listerGuichets } from "../api/counters";

function EspaceAdmin() {
  const [agents, setAgents] = useState([]);
  const [guichets, setGuichets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [agentEnEdition, setAgentEnEdition] = useState(null);
  const [agentPourMotDePasse, setAgentPourMotDePasse] = useState(null);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");

  const [formulaire, setFormulaire] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    counter_id: "",
  });

  async function chargerDonnees() {
    setChargement(true);
    setErreur("");

    try {
      const [resultatUtilisateurs, resultatGuichets] = await Promise.all([
        listerUtilisateurs(),
        listerGuichets(),
      ]);

      setAgents(
        (resultatUtilisateurs.items || []).filter(
          (utilisateur) => utilisateur.role === "AGENT"
        )
      );

      const guichetsActifs = resultatGuichets.filter(
        (guichet) => guichet.is_active
      );

      setGuichets(guichetsActifs);

      setFormulaire((precedent) => ({
        ...precedent,
        counter_id:
          precedent.counter_id ||
          (guichetsActifs.length > 0 ? String(guichetsActifs[0].id) : ""),
      }));
    } catch (error) {
      setErreur(error.message || "Impossible de charger les données.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  function modifierChamp(event) {
    const { name, value } = event.target;
    setFormulaire((precedent) => ({ ...precedent, [name]: value }));
  }

  async function soumettreFormulaire(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");

    if (!formulaire.counter_id) {
      setErreur("Veuillez sélectionner un guichet.");
      return;
    }

    setActionEnCours(true);
    try {
      const nouvelAgent = await creerUtilisateur({
        full_name: formulaire.full_name.trim(),
        email: formulaire.email.trim(),
        phone: formulaire.phone.trim() || null,
        password: formulaire.password,
        role: "AGENT",
        counter_id: Number(formulaire.counter_id),
      });

      setAgents((precedents) => [...precedents, nouvelAgent]);
      setMessage(`Le compte de ${nouvelAgent.full_name} a été créé avec succès.`);
      setFormulaire((precedent) => ({
        ...precedent,
        full_name: "",
        email: "",
        phone: "",
        password: "",
      }));
    } catch (error) {
      setErreur(error.message || "La création de l'agent a échoué.");
    } finally {
      setActionEnCours(false);
    }
  }

  function nomGuichet(counterId) {
    const guichet = guichets.find(
      (element) => Number(element.id) === Number(counterId)
    );
    return guichet
      ? `${guichet.service_name} — ${guichet.name}`
      : `Guichet #${counterId ?? "non affecté"}`;
  }

  function commencerModification(agent) {
    setErreur("");
    setMessage("");
    setAgentPourMotDePasse(null);
    setAgentEnEdition({
      id: agent.id,
      full_name: agent.full_name || "",
      phone: agent.phone || "",
      counter_id: agent.counter_id == null ? "" : String(agent.counter_id),
    });
  }

  async function enregistrerModification(event) {
    event.preventDefault();
    if (!agentEnEdition) return;

    setErreur("");
    setMessage("");
    if (!agentEnEdition.counter_id) {
      setErreur("Veuillez sélectionner un guichet pour cet agent.");
      return;
    }

    setActionEnCours(true);
    try {
      const agentModifie = await modifierUtilisateur(agentEnEdition.id, {
        full_name: agentEnEdition.full_name.trim(),
        phone: agentEnEdition.phone.trim() || null,
        counter_id: Number(agentEnEdition.counter_id),
      });
      setAgents((precedents) =>
        precedents.map((agent) =>
          agent.id === agentModifie.id ? agentModifie : agent
        )
      );
      setAgentEnEdition(null);
      setMessage(`Les informations de ${agentModifie.full_name} ont été mises à jour.`);
    } catch (error) {
      setErreur(error.message || "La modification de l'agent a échoué.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function changerActivation(agent) {
    setErreur("");
    setMessage("");
    setActionEnCours(true);
    try {
      const agentModifie = await modifierUtilisateur(agent.id, {
        is_active: !agent.is_active,
      });
      setAgents((precedents) =>
        precedents.map((element) =>
          element.id === agentModifie.id ? agentModifie : element
        )
      );
      setMessage(
        agentModifie.is_active
          ? `Le compte de ${agentModifie.full_name} est maintenant actif.`
          : `Le compte de ${agentModifie.full_name} a été désactivé.`
      );
    } catch (error) {
      setErreur(error.message || "Impossible de modifier l'état de l'agent.");
    } finally {
      setActionEnCours(false);
    }
  }

  function ouvrirReinitialisation(agent) {
    setErreur("");
    setMessage("");
    setAgentEnEdition(null);
    setNouveauMotDePasse("");
    setAgentPourMotDePasse(agent);
  }

  async function soumettreNouveauMotDePasse(event) {
    event.preventDefault();
    if (!agentPourMotDePasse) return;

    setErreur("");
    setMessage("");
    setActionEnCours(true);
    try {
      await reinitialiserMotDePasse(
        agentPourMotDePasse.id,
        nouveauMotDePasse
      );
      setMessage(`Le mot de passe de ${agentPourMotDePasse.full_name} a été réinitialisé.`);
      setAgentPourMotDePasse(null);
      setNouveauMotDePasse("");
    } catch (error) {
      setErreur(error.message || "La réinitialisation du mot de passe a échoué.");
    } finally {
      setActionEnCours(false);
    }
  }

  return (
    <main className="page shell">
      <header className="page-header">
        <span className="page-label">
          <Users size={16} />
          Administration
        </span>
        <h1>Gestion des agents</h1>
        <p className="page-description">
          Créez les comptes du personnel, gérez leurs informations et affectez chaque agent à un guichet.
        </p>
      </header>

      {erreur && <div className="notice notice-error" role="alert">{erreur}</div>}
      {message && <div className="notice notice-success" role="status">{message}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 24,
          alignItems: "start",
        }}
      >
        <section className="panel">
          <div className="section-head">
            <h2>Créer un agent</h2>
            <UserPlus size={22} />
          </div>

          <form onSubmit={soumettreFormulaire}>
            <label htmlFor="agent-name">Nom complet</label>
            <input
              id="agent-name"
              name="full_name"
              type="text"
              placeholder="Ex. : Mamadou Diallo"
              value={formulaire.full_name}
              onChange={modifierChamp}
              minLength={1}
              maxLength={100}
              required
            />

            <label htmlFor="agent-email">Adresse e-mail</label>
            <input
              id="agent-email"
              name="email"
              type="email"
              placeholder="agent@samafile.sn"
              value={formulaire.email}
              onChange={modifierChamp}
              maxLength={254}
              required
            />

            <label htmlFor="agent-phone">Téléphone (facultatif)</label>
            <input
              id="agent-phone"
              name="phone"
              type="tel"
              placeholder="Ex. : 77 000 00 00"
              value={formulaire.phone}
              onChange={modifierChamp}
              maxLength={30}
            />

            <label htmlFor="agent-password">Mot de passe provisoire</label>
            <input
              id="agent-password"
              name="password"
              type="password"
              placeholder="8 caractères minimum"
              value={formulaire.password}
              onChange={modifierChamp}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />

            <label htmlFor="agent-counter">Guichet à affecter</label>
            <select
              id="agent-counter"
              name="counter_id"
              value={formulaire.counter_id}
              onChange={modifierChamp}
              required
              disabled={chargement || guichets.length === 0}
            >
              <option value="">Sélectionner un guichet</option>
              {guichets.map((guichet) => (
                <option key={guichet.id} value={guichet.id}>
                  {guichet.service_name} — {guichet.name}
                </option>
              ))}
            </select>

            {guichets.length === 0 && !chargement && (
              <p className="muted" style={{ marginTop: 8, fontSize: ".88rem" }}>
                Aucun guichet actif disponible.
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: 24 }}
              disabled={actionEnCours || chargement || guichets.length === 0}
            >
              <UserPlus size={18} />
              {actionEnCours ? "Création en cours..." : "Créer le compte agent"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Agents enregistrés</h2>
              <p className="muted" style={{ marginTop: 5 }}>
                {agents.length} agent(s) dans SamaFile
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={chargerDonnees}
              disabled={chargement || actionEnCours}
              title="Actualiser la liste"
            >
              <RefreshCw size={17} />
              Actualiser
            </button>
          </div>

          {chargement ? (
            <div className="empty-state">Chargement des agents...</div>
          ) : agents.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <strong>Aucun agent enregistré</strong>
              <span>Créez le premier compte avec le formulaire.</span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Guichet</th>
                    <th>État</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <strong>{agent.full_name}</strong>
                        <br />
                        <span className="muted">{agent.email}</span>
                        {agent.phone && (
                          <>
                            <br />
                            <span className="muted">{agent.phone}</span>
                          </>
                        )}
                      </td>
                      <td>{nomGuichet(agent.counter_id)}</td>
                      <td>
                        <span className={agent.is_active ? "pill pill-open" : "pill pill-off"}>
                          {agent.is_active ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => commencerModification(agent)}
                            disabled={actionEnCours}
                            title="Modifier les informations et le guichet"
                          >
                            <Pencil size={15} /> Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => changerActivation(agent)}
                            disabled={actionEnCours}
                            title={agent.is_active ? "Désactiver ce compte" : "Activer ce compte"}
                          >
                            <Power size={15} /> {agent.is_active ? "Désactiver" : "Activer"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => ouvrirReinitialisation(agent)}
                            disabled={actionEnCours}
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound size={15} /> Mot de passe
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {agentEnEdition && (
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="section-head">
            <div>
              <h2>Modifier l'agent</h2>
              <p className="muted" style={{ marginTop: 5 }}>
                Modifiez son nom, son téléphone ou son guichet.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setAgentEnEdition(null)}
              disabled={actionEnCours}
            >
              <X size={16} /> Fermer
            </button>
          </div>
          <form onSubmit={enregistrerModification}>
            <label htmlFor="edit-agent-name">Nom complet</label>
            <input
              id="edit-agent-name"
              value={agentEnEdition.full_name}
              onChange={(event) => setAgentEnEdition((precedent) => ({ ...precedent, full_name: event.target.value }))}
              minLength={1}
              maxLength={100}
              required
            />

            <label htmlFor="edit-agent-phone">Téléphone</label>
            <input
              id="edit-agent-phone"
              type="tel"
              value={agentEnEdition.phone}
              onChange={(event) => setAgentEnEdition((precedent) => ({ ...precedent, phone: event.target.value }))}
              maxLength={30}
            />

            <label htmlFor="edit-agent-counter">Guichet</label>
            <select
              id="edit-agent-counter"
              value={agentEnEdition.counter_id}
              onChange={(event) => setAgentEnEdition((precedent) => ({ ...precedent, counter_id: event.target.value }))}
              required
            >
              {!guichets.some((guichet) => String(guichet.id) === agentEnEdition.counter_id) && agentEnEdition.counter_id && (
                <option value={agentEnEdition.counter_id}>
                  Guichet actuel #{agentEnEdition.counter_id}
                </option>
              )}
              {guichets.map((guichet) => (
                <option key={guichet.id} value={guichet.id}>
                  {guichet.service_name} — {guichet.name}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={actionEnCours}>
                <Save size={17} /> {actionEnCours ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setAgentEnEdition(null)}
                disabled={actionEnCours}
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      )}

      {agentPourMotDePasse && (
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="section-head">
            <div>
              <h2>Réinitialiser le mot de passe</h2>
              <p className="muted" style={{ marginTop: 5 }}>
                Nouveau mot de passe pour {agentPourMotDePasse.full_name}.
              </p>
            </div>
            <KeyRound size={22} />
          </div>
          <form onSubmit={soumettreNouveauMotDePasse}>
            <label htmlFor="agent-new-password">Nouveau mot de passe</label>
            <input
              id="agent-new-password"
              type="password"
              value={nouveauMotDePasse}
              onChange={(event) => setNouveauMotDePasse(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              required
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={actionEnCours}>
                <KeyRound size={17} /> {actionEnCours ? "Réinitialisation..." : "Confirmer le nouveau mot de passe"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setAgentPourMotDePasse(null);
                  setNouveauMotDePasse("");
                }}
                disabled={actionEnCours}
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

export default EspaceAdmin;
