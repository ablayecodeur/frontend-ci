import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Après chaque navigation : défile vers l'ancre (#ticket, #suivi, #services…)
// ou revient en haut de page. location.key change même si l'on clique
// deux fois sur le même lien, ce qui évite l'effet « le clic ne fait rien ».
function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const comportement = reduit ? "auto" : "smooth";

    if (hash) {
      const cible = document.getElementById(hash.slice(1));
      if (cible) {
        cible.scrollIntoView({ behavior: comportement, block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash, key]);

  return null;
}

export default ScrollManager;
