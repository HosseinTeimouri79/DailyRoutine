export default function Card({ title, subtitle, actions, children }) {
  return (
    <section className="card">
      {(title || subtitle || actions) && (
        <header className="card-header">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
