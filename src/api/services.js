import { apiRequest } from "./client";

export function listerServices() {
  return apiRequest("/api/services");
}

export function obtenirService(id) {
  return apiRequest(`/api/services/${id}`);
}

export function listerTousServicesAdmin() {
  return apiRequest("/api/admin/services");
}

export function creerService(data) {
  return apiRequest("/api/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function modifierService(id, data) {
  return apiRequest(`/api/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}