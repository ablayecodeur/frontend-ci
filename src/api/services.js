import { apiRequest } from "./client";

export function listerServices() {
  return apiRequest("/api/services");
}

export function obtenirService(id) {
  return apiRequest(`/api/services/${id}`);
}
