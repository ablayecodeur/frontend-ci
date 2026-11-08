import StatusBadge from "./StatusBadge";

function TicketStub({
  numero,
  serviceNom,
  guichetNom,
  date,
  position,
  statut,
  label,
  className = "",
  children,
}) {
  return (
    <article className={`stub ${className}`} aria-label={`Ticket ${numero}`}>
      <div className="stub-main">
        <p className="stub-caption">Numéro de ticket</p>
        <p className="stub-number">{numero}</p>
        <StatusBadge statut={statut} label={label} />
      </div>

      <div className="stub-tear" aria-hidden="true"></div>

      <dl className="stub-meta">
        {serviceNom && (
          <div>
            <dt>Service</dt>
            <dd>{serviceNom}</dd>
          </div>
        )}

        {guichetNom && (
          <div>
            <dt>Guichet</dt>
            <dd>{guichetNom}</dd>
          </div>
        )}

        {date && (
          <div>
            <dt>Date</dt>
            <dd>{date}</dd>
          </div>
        )}

        {position != null && (
          <div>
            <dt>Position</dt>
            <dd>{position}</dd>
          </div>
        )}
      </dl>

      {children}
    </article>
  );
}

export default TicketStub;
