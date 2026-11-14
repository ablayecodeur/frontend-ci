import { apiRequest } from "./client";

export function inscrireUtilisateur(donnees) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}

export function connecterUtilisateur(donnees) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}

export function obtenirProfil() {
  return apiRequest("/api/auth/me");
}

export function modifierProfil(donnees) {
  return apiRequest("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(donnees),
  });
}

export function changerMotDePasse(donnees) {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}
