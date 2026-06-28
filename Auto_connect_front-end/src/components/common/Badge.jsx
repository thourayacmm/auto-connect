import { classNames } from "../../utils/helpers";

const tones = {
  primary: "bg-softBlue/15 text-slateBlue",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-[#a85d18]",
  danger: "bg-danger/15 text-danger",
  secondary: "bg-lilac/35 text-[#6652b4]",
  neutral: "bg-slate-100 text-slate-600",
};

function Badge({ children, tone = "neutral", className = "" }) {
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

export default Badge;
