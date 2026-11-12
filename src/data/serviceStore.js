import { useEffect, useSyncExternalStore } from "react";
import { listerServices } from "../api/services";

let services = [];
let loading = true;
let error = null;

let snapshot = { services, loading, error };
const listeners = new Set();

function notifier() {
  snapshot = { services, loading, error };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function convertirService(service) {
  return {
    id: service.id,
    nom: service.name,
    description: "",
    heureOuverture: service.opening_time,
    heureFermeture: service.closing_time,
    heureLimiteTickets: service.ticket_cutoff_time || service.closing_time,
    actif: true,
    ouvert: service.is_open,
    distributionOuverte: service.ticket_distribution_open,
    noShowTimeoutSeconds: service.no_show_timeout_seconds,
  };
}

export async function chargerServices() {
  loading = true;
  error = null;
  notifier();

  try {
    const donnees = await listerServices();

    if (!Array.isArray(donnees)) {
      throw new Error("Format de réponse des services invalide.");
    }

    services = donnees.map(convertirService);
  } catch (erreur) {
    error = erreur.message || "Impossible de charger les services.";
  } finally {
    loading = false;
    notifier();
  }
}

export function useServicesState() {
  const etat = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    chargerServices();

    const intervalle = setInterval(chargerServices, 5000);
    return () => clearInterval(intervalle);
  }, []);

  return etat;
}

export function useServices() {
  return useServicesState().services;
}

export function creerService(donnees) {
  const nouveauService = {
    id: Date.now(),
    nom: donnees.nom.trim(),
    description: donnees.description?.trim() || "",
    heureOuverture: donnees.heureOuverture,
    heureFermeture: donnees.heureFermeture,
    heureLimiteTickets: donnees.heureLimiteTickets,
    actif: true,
  };

  services = [...services, nouveauService];
  notifier();

  return nouveauService;
}

export function modifierService(id, modifications) {
  services = services.map((service) =>
    service.id === id ? { ...service, ...modifications } : service
  );

  notifier();
}

export function changerStatutService(id) {
  services = services.map((service) =>
    service.id === id
      ? { ...service, actif: !service.actif }
      : service
  );

  notifier();
}

export function serviceEstOuvert(service, maintenant = new Date()) {
  if (!service || service.actif === false) return false;

  if (typeof service.ouvert === "boolean") {
    return service.ouvert;
  }

  const heure = maintenant.getHours().toString().padStart(2, "0") +
    ":" + maintenant.getMinutes().toString().padStart(2, "0");

  return heure >= service.heureOuverture &&
    heure < service.heureFermeture;
}

export function peutAttribuerTicket(service, maintenant = new Date()) {
  if (!serviceEstOuvert(service, maintenant)) return false;

  if (typeof service.distributionOuverte === "boolean") {
    return service.distributionOuverte;
  }

  const heure = maintenant.getHours().toString().padStart(2, "0") +
    ":" + maintenant.getMinutes().toString().padStart(2, "0");

  return heure < service.heureLimiteTickets;
}
