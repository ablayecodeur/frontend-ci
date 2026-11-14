// Same-origin API: Vite and nginx proxy /api and /health to the backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "samafile_access_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  const token = getAccessToken();

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez que le backend est démarré.",
      0,
      "NETWORK_ERROR"
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = data?.error;

    throw new ApiError(
      error?.message || "Une erreur est survenue.",
      response.status,
      error?.code || "HTTP_ERROR",
      error?.details ?? null
    );
  }

  return data;
}
