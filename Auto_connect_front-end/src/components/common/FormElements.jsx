import { classNames } from "../../utils/helpers";
import { ArrowUpRight, Search } from "lucide-react";
import Card from "./Card";

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, id, className, wrapperClassName = "", ...props }) {
  return (
    <label className={classNames("block space-y-2", wrapperClassName)} htmlFor={id}>
      {label ? (
        <span className="text-sm font-semibold text-themed-primary">{label}</span>
      ) : null}
      <input
        id={id}
        className={classNames(
          "focus-ring w-full rounded-2xl border border-themed bg-themed-surface px-4 py-3 text-sm text-themed-primary placeholder:text-themed-faint",
          className,
        )}
        {...props}
      />
    </label>
  );
}
export default Input;

// ── Badge ─────────────────────────────────────────────────────────────────────
const tones = {
  primary:   "bg-softBlue/15 dark:bg-dark-accent/15 text-slateBlue dark:text-dark-accent",
  success:   "bg-success/15 text-success",
  warning:   "bg-warning/20 text-[#a85d18] dark:text-warning",
  danger:    "bg-danger/15 text-danger",
  secondary: "bg-lilac/35 dark:bg-dark-purple/25 text-[#6652b4] dark:text-dark-purple",
  neutral:   "bg-themed-subtle text-themed-muted",
};

export function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, variation }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-themed-muted">{title}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-themed-primary">{value}</p>
          {variation ? (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {variation}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-softBlue/15 dark:bg-dark-accent/15 p-3 text-slateBlue dark:text-dark-accent">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-themed bg-themed-subtle p-10 text-center">
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-softBlue/10 dark:bg-dark-accent/10 text-slateBlue dark:text-dark-accent">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}
      {title ? (
        <p className="font-display text-xl font-bold text-themed-primary">{title}</p>
      ) : null}
      {description ? (
        <p className="max-w-sm text-sm leading-6 text-themed-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={classNames("relative", className)}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-themed-faint" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="focus-ring w-full rounded-2xl border border-themed bg-themed-surface py-3 pl-11 pr-4 text-sm text-themed-primary placeholder:text-themed-faint"
      />
    </div>
  );
}
