import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner shell">
        <Link to="/" className="brand brand-small" aria-label="SamaFile, accueil">
          <span className="brand-mark">S</span>
          <span className="brand-name">Sama<span>File</span></span>
        </Link>
        <p>© 2026 SamaFile. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

export default Footer;
