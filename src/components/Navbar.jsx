import { NavLink, Link } from "react-router-dom";
import { Home, Ticket, LayoutDashboard, Plus } from "lucide-react";

function Navbar() {
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
          <NavLink to="/usager">
            <Ticket size={18} aria-hidden="true" />
            <span>Espace usager</span>
          </NavLink>
          <NavLink to="/agent">
            <LayoutDashboard size={18} aria-hidden="true" />
            <span>Espace agent</span>
          </NavLink>
        </nav>

        <Link to="/usager#ticket" className="btn btn-primary navbar-cta">
          <Plus size={18} aria-hidden="true" />
          Prendre un ticket
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
