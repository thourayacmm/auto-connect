// ── Button.jsx ────────────────────────────────────────────────────────────────
import { classNames } from "../../utils/helpers";

const variants = {
  primary:   "bg-gradient-to-r from-softBlue to-slateBlue text-white shadow-soft hover:opacity-95 dark:from-dark-glow dark:to-dark-purple",
  secondary: "bg-themed-surface text-themed-primary border border-themed hover:bg-themed-subtle",
  danger:    "bg-danger text-white hover:bg-danger/90",
  ghost:     "bg-transparent text-themed-muted hover:bg-themed-subtle",
  success:   "bg-success text-white hover:bg-success/90",
};

export function Button({ children, className, variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={classNames(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
