import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Ticket,
  LayoutDashboard,
  Plus,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const role = user?.role;

  return (
    <header className="navbar">
      <div className="navbar-inner shell">
        <Link to="/" className="brand" aria-label="SamaFile, accueil">
          <span className="brand-mark">S</span>
          <span className="brand-name">Sama<span>File</span></span>
        </Link>

        <nav className="nav-menu" aria-label="Navigation principale">
          <NavLink to="/" end>
            <Home size={18} aria-hidden="true" />
            <span>Accueil</span>
          </NavLink>

          {user && role === "USER" && (
            <NavLink to="/usager">
              <Ticket size={18} aria-hidden="true" />
              <span>Espace usager</span>
            </NavLink>
          )}

          {user && (role === "AGENT" || role === "ADMIN") && (
            <NavLink to="/agent">
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Espace agent</span>
            </NavLink>
          )}

          {user && role === "ADMIN" && (
            <NavLink to="/admin">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Administration</span>
            </NavLink>
          )}
          {user && role === "ADMIN" && (
            <NavLink to="/admin/services">
              <Users size={18} aria-hidden="true" />
              <span>Services</span>
            </NavLink>
          )}
        </nav>

        <div className="navbar-actions">
          {!loading && !user && (
            <Link to="/connexion" className="btn btn-primary navbar-cta">
              <LogIn size={18} aria-hidden="true" />
              Connexion
            </Link>
          )}

          {!loading && user && role === "USER" && (
            <Link to="/usager#ticket" className="btn btn-primary navbar-cta">
              <Plus size={18} aria-hidden="true" />
              Prendre un ticket
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              <LogOut size={18} aria-hidden="true" />
              DÃ©connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

