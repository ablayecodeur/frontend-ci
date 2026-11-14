// Libellés et tonalités des statuts de ticket (partagés par les pages et les composants).
export const STATUTS = {
  WAITING: { label: "En attente", tone: "waiting" },
  CALLED: { label: "Veuillez vous présenter", tone: "called" },
  IN_PROGRESS: { label: "En cours de traitement", tone: "progress" },
  COMPLETED: { label: "Terminé", tone: "done" },
  CANCELLED: { label: "Annulé", tone: "cancelled" },
  NO_SHOW: { label: "Absent", tone: "muted" },
  EXPIRED: { label: "Expiré", tone: "muted" },
};

export function libelleStatut(statut) {
  return STATUTS[statut]?.label || statut;
}

export function tonaliteStatut(statut) {
  return STATUTS[statut]?.tone || "muted";
}
