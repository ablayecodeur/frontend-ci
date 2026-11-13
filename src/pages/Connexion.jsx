import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Connexion() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErreur("");
    setChargement(true);
    const valeurs = new FormData(event.currentTarget);
    const adresse = String(valeurs.get("email") || "").trim();
    const motDePasse = String(valeurs.get("password") || "");

    try {
      let user;

      if (mode === "login") {
        user = await login({ email: adresse, password: motDePasse });
      } else {
        user = await register({
          email: adresse,
          password: motDePasse,
          full_name: String(valeurs.get("full_name") || "").trim(),
          phone: String(valeurs.get("phone") || "").trim() || null,
        });
      }

      if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "AGENT") {
        navigate("/agent");
      } else {
        navigate("/usager");
      }
    } catch (error) {
      setErreur(error.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  function changerMode(nouveauMode) {
    setMode(nouveauMode);
    setErreur("");
  }

  return (
    <main className="section shell auth-page">
      <div className="page-header">
        <span className="page-label">Votre espace SamaFile</span>
        <h1>{mode === "login" ? "Bienvenue !" : "Créer un compte"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Connectez-vous pour accéder à votre espace."
            : "Inscrivez-vous pour prendre et suivre vos tickets."}
        </p>
      </div>

      <section className="panel auth-panel">
        <div className="tabs" role="tablist" aria-label="Authentification">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => changerMode("login")}
          >
            <LogIn size={17} />
            Connexion
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => changerMode("register")}
          >
            <UserPlus size={17} />
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="fullName">Nom complet</label>
              <input
                id="fullName"
                name="full_name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Votre nom complet"
                required
              />

              <label htmlFor="phone">Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Votre numéro de téléphone"
              />
            </>
          )}

          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="exemple@email.com"
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "register" ? "8 caractères minimum" : "Votre mot de passe"}
            required
          />

          {erreur && (
            <p className="auth-error" role="alert">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit"
            disabled={chargement}
          >
            {chargement
              ? "Veuillez patienter..."
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-back">
          <Link to="/">Retour à l'accueil</Link>
        </p>
      </section>
    </main>
  );
}

export default Connexion;
