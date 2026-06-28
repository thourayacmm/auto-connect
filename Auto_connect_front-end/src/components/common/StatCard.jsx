import { ArrowUpRight } from "lucide-react";
import Card from "./Card";

function StatCard({ title, value, icon: Icon, variation }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-themed-muted">{title}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-themed-primary">
            {value ?? "—"}
          </p>
          {variation ? (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {variation}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex-shrink-0 rounded-2xl bg-softBlue/15 dark:bg-sky-500/15 p-3 text-slateBlue dark:text-sky-400">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default StatCard;
