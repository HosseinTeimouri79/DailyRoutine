export default function Card({ title, subtitle, actions, children }) {
  return (
    <section className="bg-[var(--color-bg-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] shadow-[var(--shadow-card)] p-[18px] max-[720px]:p-3.5 max-[720px]:rounded-[14px]">
      {(title || subtitle || actions) && (
        <header className="flex items-start justify-between mb-3 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-2">
          <div>
            {title ? (
              <h2 className="m-0 text-[1.05rem]">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1.5 text-[var(--color-text-secondary)] text-[0.9rem]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
