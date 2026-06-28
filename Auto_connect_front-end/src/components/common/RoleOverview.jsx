import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "./Badge";
import Card from "./Card";

function RoleOverview({ title, description, items, ctaLabel, ctaTo, accent = "bg-softBlue/10" }) {
  return (
    <Card className={`${accent} dark:bg-sky-500/5 border border-white/60 dark:border-white/10`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Badge tone="primary">Parcours du rôle</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-themed-primary">{title}</h2>
          {description ? (
            <p className="mt-3 text-sm leading-7 text-themed-muted">{description}</p>
          ) : null}
        </div>
        {ctaLabel && ctaTo ? (
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 rounded-2xl bg-themed-surface px-4 py-3 text-sm font-semibold text-slateBlue dark:text-sky-400 shadow-card"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-[24px] bg-white/80 dark:bg-white/5 p-4 shadow-sm border border-transparent dark:border-white/10"
          >
            <p className="font-semibold text-themed-primary">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-themed-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default RoleOverview;
