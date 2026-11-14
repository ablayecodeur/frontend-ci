function PageHeader({ icon: Icone, label, title, description }) {
  return (
    <header className="page-header">
      <p className="page-label">
        {Icone && <Icone size={16} aria-hidden="true" />}
        {label}
      </p>
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </header>
  );
}

export default PageHeader;
