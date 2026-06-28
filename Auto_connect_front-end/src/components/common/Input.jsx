import { classNames } from "../../utils/helpers";

function Input({ label, id, className, wrapperClassName = "", ...props }) {
  return (
    <label className={classNames("block space-y-2", wrapperClassName)} htmlFor={id}>
      {label ? <span className="text-sm font-semibold text-ink">{label}</span> : null}
      <input
        id={id}
        className={classNames(
          "focus-ring w-full rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export default Input;
