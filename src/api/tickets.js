import { apiRequest } from "./client";

export function creerTicket(serviceId, userName) {
  return apiRequest("/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      service_id: serviceId,
      ...(userName ? { user_name: userName } : {}),
    }),
  });
}

export function listerTickets(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffixe = query.toString();

  return apiRequest(`/api/tickets${suffixe ? `?${suffixe}` : ""}`);
}

export function obtenirTicket(id) {
  return apiRequest(`/api/tickets/${id}`);
}

export function obtenirPosition(id) {
  return apiRequest(`/api/tickets/${id}/position`);
}

export function demarrerTicket(id) {
  return apiRequest(`/api/tickets/${id}/start`, {
    method: "PATCH",
  });
}

export function terminerTicket(id) {
  return apiRequest(`/api/tickets/${id}/complete`, {
    method: "PATCH",
  });
}

export function annulerTicket(id) {
  return apiRequest(`/api/tickets/${id}/cancel`, {
    method: "PATCH",
  });
}

export function declarerAbsent(id) {
  return apiRequest(`/api/tickets/${id}/no-show`, {
    method: "PATCH",
  });
}

export function reactiverTicket(id) {
  return apiRequest(`/api/tickets/${id}/reactivate`, {
    method: "POST",
  });
}

export function listerMesTickets(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffixe = query.toString();

  return apiRequest(`/api/me/tickets${suffixe ? `?${suffixe}` : ""}`);
}
