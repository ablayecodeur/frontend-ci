import { libelleStatut, tonaliteStatut } from "../utils/statuts";

function StatusBadge({ statut, label }) {
  return (
    <span className={`badge badge-${tonaliteStatut(statut)}`}>
      <span className="badge-dot" aria-hidden="true"></span>
      {label || libelleStatut(statut)}
    </span>
  );
}

export default StatusBadge;
