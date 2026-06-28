import Button from "./Button";

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-[28px] border border-dashed border-softBlue/30 bg-white/60 p-8 text-center">
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
