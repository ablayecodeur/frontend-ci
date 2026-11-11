import { useEffect, useSyncExternalStore } from "react";
import {
  creerTicket as creerTicketAPI,
  listerTickets,
  obtenirTicket,
  demarrerTicket as demarrerTicketAPI,
  terminerTicket as terminerTicketAPI,
  annulerTicket as annulerTicketAPI,
  declarerAbsent as declarerAbsentAPI,
  reactiverTicket as reactiverTicketAPI,
} from "../api/tickets";
import {
  appelerProchain as appelerProchainAPI,
} from "../api/counters";

let tickets = [];
let loading = true;
let error = null;

let snapshot = { tickets, loading, error };
const listeners = new Set();

function notifier() {
  snapshot = { tickets, loading, error };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function normaliserTicket(ticket, serviceNom = "") {
  return {
    id: ticket.id,
    numero: ticket.ticket_number,
    serviceId: ticket.service_id,
    serviceNom: serviceNom || `Service ${ticket.service_id}`,
    counterId: ticket.counter_id ?? null,
    statut: ticket.status,
    createdAt: ticket.created_at ?? new Date().toISOString(),
    calledAt: ticket.called_at ?? null,
    position: ticket.position ?? null,
    peopleAhead: ticket.people_ahead ?? null,
    notification: ticket.notification ?? null,
    userName: ticket.user_name ?? null,
    message: ticket.message ?? null,
  };
}

export async function chargerTickets() {
  try {
    loading = true;
    error = null;
    notifier();

    const premierResultat = await listerTickets({
      limit: 200,
      offset: 0,
    });

    let elements = premierResultat.items || [];
    const total = premierResultat.total || 0;

    for (let offset = 200; offset < total; offset += 200) {
      const resultat = await listerTickets({
        limit: 200,
        offset,
      });

      elements = [...elements, ...(resultat.items || [])];
    }

    tickets = elements.map((ticket) => normaliserTicket(ticket));
  } catch (erreur) {
    error = erreur.message || "Impossible de charger les tickets.";
  } finally {
    loading = false;
    notifier();
  }

  return tickets;
}

export function useTickets() {
  const etat = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    chargerTickets();

    const intervalle = setInterval(chargerTickets, 5000);

    return () => clearInterval(intervalle);
  }, []);

  return etat.tickets;
}

export function useTicketsState() {
  const etat = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    chargerTickets();

    const intervalle = setInterval(chargerTickets, 5000);

    return () => clearInterval(intervalle);
  }, []);

  return etat;
}

export async function creerTicket(service, userName) {
  if (!service?.id) {
    throw new Error("Veuillez sélectionner un service.");
  }

  const resultat = await creerTicketAPI(service.id, userName);
  const details = await obtenirTicket(resultat.id);

  return normaliserTicket(details, service.nom);
}

export async function appelerProchain(counterId) {
  if (!counterId) {
    throw new Error("Veuillez sélectionner un guichet.");
  }

  const resultat = await appelerProchainAPI(counterId);

  await chargerTickets();

  return normaliserTicket(resultat);
}

export async function demarrerTicket(id) {
  const resultat = await demarrerTicketAPI(id);

  await chargerTickets();

  return normaliserTicket(resultat);
}

export async function terminerTicket(id) {
  const resultat = await terminerTicketAPI(id);

  await chargerTickets();

  return normaliserTicket(resultat);
}

export async function annulerTicket(id) {
  const resultat = await annulerTicketAPI(id);

  await chargerTickets();

  return normaliserTicket(resultat);
}

export async function declarerAbsent(id) {
  const resultat = await declarerAbsentAPI(id);

  await chargerTickets();

  return normaliserTicket(resultat);
}

export async function reactiverTicket(id) {
  const resultat = await reactiverTicketAPI(id);

  await chargerTickets();

  return normaliserTicket(resultat);
}
