import { apiRequest } from "./client";

export function listerUtilisateurs() {
  return apiRequest("/api/users");
}

export function creerUtilisateur(data) {
  return apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function modifierUtilisateur(id, data) {
  return apiRequest(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function reinitialiserMotDePasse(id, newPassword) {
  return apiRequest(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}
