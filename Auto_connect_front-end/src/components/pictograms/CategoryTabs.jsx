import { classNames } from "../../utils/helpers";

function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <button
          key={category}
          className={classNames(
            "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
            active === category ? "bg-slateBlue text-white" : "bg-white text-slate-600 hover:bg-softBlue/10",
          )}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;
