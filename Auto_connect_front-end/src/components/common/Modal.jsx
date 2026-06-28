import { X } from "lucide-react";
import { useAppPreferences } from "../../context/AppPreferences";

function Modal({ open, title, children, onClose, footer, panelClassName = "", contentClassName = "" }) {
  const { t } = useAppPreferences();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 dark:bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-[32px] bg-themed-elevated border border-themed p-6 shadow-soft ${panelClassName}`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? (
            <h2 className="font-display text-2xl font-bold text-themed-primary">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label={t("closeWindow")}
            onClick={onClose}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-themed-muted transition hover:text-themed-primary hover:bg-themed-subtle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`max-h-[70vh] overflow-y-auto ${contentClassName}`}>{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
