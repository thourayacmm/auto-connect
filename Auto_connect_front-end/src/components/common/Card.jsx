// ── Card.jsx ──────────────────────────────────────────────────────────────────
export function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`section-shell p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon ? (
              <div className="rounded-2xl bg-softBlue/15 dark:bg-dark-accent/15 p-2 text-slateBlue dark:text-dark-accent">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            {title ? (
              <h3 className="font-display text-lg font-bold text-themed-primary">{title}</h3>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export default Card;
