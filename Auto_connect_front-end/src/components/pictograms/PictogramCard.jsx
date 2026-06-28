import { Plus } from "lucide-react";
import { CHILD_CATEGORY_COLORS, normalizeCategoryName } from "../../utils/constants";
import { classNames, getIconComponent } from "../../utils/helpers";

function PictogramCard({ pictogram, onSelect, large = false }) {
  const Icon = getIconComponent(pictogram.icon);
  const category = normalizeCategoryName(pictogram.category);
  const tone = CHILD_CATEGORY_COLORS[category] || "bg-white text-ink";

  return (
    <button
      className={classNames(
        "pictogram-card flex w-full flex-col items-center gap-3 rounded-[28px] p-4 text-center shadow-card transition hover:-translate-y-0.5 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-softBlue/20 active:scale-[0.99]",
        tone,
        large ? "min-h-[150px] justify-center" : "min-h-[130px]",
      )}
      onClick={() => onSelect?.(pictogram)}
      aria-label={` ${pictogram.label}`}
    >
      <Icon className={large ? "h-12 w-12" : "h-10 w-10"} />
      <div>
        <p className="font-display text-base font-bold">{pictogram.label}</p>
        <p className="mt-1 text-xs opacity-80">{category}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
        <Plus className="h-3.5 w-3.5" />
        Ajouter
      </span>
    </button>
  );
}

export default PictogramCard;
