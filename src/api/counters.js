import { apiRequest } from "./client";

export function listerGuichets(serviceId) {
  const query = serviceId
    ? `?service_id=${encodeURIComponent(serviceId)}`
    : "";

  return apiRequest(`/api/counters${query}`);
}

export function listerTicketsGuichet(counterId, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffixe = query.toString();

  return apiRequest(
    `/api/counters/${counterId}/tickets${suffixe ? `?${suffixe}` : ""}`
  );
}

export function appelerProchain(counterId) {
  return apiRequest(`/api/counters/${counterId}/next`, {
    method: "POST",
  });
}
