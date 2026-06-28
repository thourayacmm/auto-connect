import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { listCategoriesApi, listPictogramsApi, updatePictogramApi } from "../../services/domainApi";
import { getIconComponent } from "../../utils/helpers";

const ALL_CATEGORY_KEY = "__all__";
const ALL_CATEGORY_LABEL = "Tous";

const normalizeCategoryName = (value) => {
  const rawValue =
    typeof value === "object" && value !== null
      ? value.name || value.label || value.title
      : value;

  return String(rawValue || "General").trim() || "General";
};

const getCategoryKey = (value) =>
  normalizeCategoryName(value)
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase();

function PictogramDatabase() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryKey, setActiveCategoryKey] = useState(ALL_CATEGORY_KEY);
  const [search, setSearch] = useState("");
  const [sourceLabel, setSourceLabel] = useState("backend");
  const [updatingIds, setUpdatingIds] = useState([]);

  useEffect(() => {
    Promise.all([listCategoriesApi(), listPictogramsApi()])
      .then(([apiCategories, apiPictograms]) => {
        const normalizedItems = apiPictograms.map((item) => ({
          ...item,
          category: normalizeCategoryName(item.category),
          categoryKey: getCategoryKey(item.category),
          status: item.isActive === false ? "inactive" : "active",
        }));
        const categoryMap = new Map();

        [
          ...apiCategories.map((item) => normalizeCategoryName(item.name || item.label)),
          ...normalizedItems.map((item) => normalizeCategoryName(item.category)),
        ].forEach((name) => {
          const key = getCategoryKey(name);
          if (key && key !== getCategoryKey(ALL_CATEGORY_LABEL) && !categoryMap.has(key)) {
            categoryMap.set(key, { key, label: name });
          }
        });

        setCategories([...categoryMap.values()]);
        setItems(normalizedItems);
        setSourceLabel("backend");
      })
      .catch(() => {
        setItems([]);
        setCategories([]);
        setSourceLabel("backend indisponible");
      });
  }, []);

  useEffect(() => {
    if (activeCategoryKey !== ALL_CATEGORY_KEY && !categories.some((category) => category.key === activeCategoryKey)) {
      setActiveCategoryKey(ALL_CATEGORY_KEY);
    }
  }, [activeCategoryKey, categories]);

  const categoryCounts = useMemo(
    () =>
      items.reduce(
        (counts, item) => {
          const categoryKey = item.categoryKey || getCategoryKey(item.category);
          return {
            ...counts,
            [ALL_CATEGORY_KEY]: counts[ALL_CATEGORY_KEY] + 1,
            [categoryKey]: (counts[categoryKey] || 0) + 1,
          };
        },
        { [ALL_CATEGORY_KEY]: 0 },
      ),
    [items],
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const category = normalizeCategoryName(item.category);
        const categoryKey = item.categoryKey || getCategoryKey(item.category);
        const matchesCategory = activeCategoryKey === ALL_CATEGORY_KEY || categoryKey === activeCategoryKey;
        const matchesSearch = `${item.label} ${category} ${item.level}`
          .toLowerCase()
          .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
      }),
    [activeCategoryKey, items, search],
  );

  const setStatus = async (id, status) => {
    const current = items.find((item) => item.id === id);
    if (!current || updatingIds.includes(id)) return;

    const isActive = status === "active";
    setUpdatingIds((ids) => [...ids, id]);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isActive, status } : item)),
    );

    if (sourceLabel === "backend") {
      try {
        const saved = await updatePictogramApi(id, { isActive });
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...saved,
                  category: normalizeCategoryName(saved.category),
                  categoryKey: getCategoryKey(saved.category),
                  status: saved.isActive === false ? "inactive" : "active",
                }
              : item,
          ),
        );
      } catch (_error) {
        setItems((currentItems) => currentItems.map((item) => (item.id === id ? current : item)));
        setSourceLabel("backend indisponible");
      } finally {
        setUpdatingIds((ids) => ids.filter((itemId) => itemId !== id));
      }
      return;
    }

    setUpdatingIds((ids) => ids.filter((itemId) => itemId !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.55fr_1.45fr]">
        <Card title="Categories">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveCategoryKey(ALL_CATEGORY_KEY)}
              className={`focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                activeCategoryKey === ALL_CATEGORY_KEY
                  ? "bg-softBlue/15 text-slateBlue"
                  : "bg-slate-50 text-ink hover:bg-softBlue/10"
              }`}
            >
              <span className="font-semibold">{ALL_CATEGORY_LABEL}</span>
            </button>

            {categories.map((category) => {
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategoryKey(category.key)}
                  className={`focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                    activeCategoryKey === category.key
                      ? "bg-softBlue/15 text-slateBlue"
                      : "bg-slate-50 text-ink hover:bg-softBlue/10"
                  }`}
                >
                  <span className="font-semibold">{category.label}</span>
                  <Badge tone="primary">{categoryCounts[category.key] || 0} pictos</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title={`Supervision globale (${sourceLabel})`}
          action={
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                className="focus-ring w-full rounded-2xl border border-softBlue/20 bg-white py-3 pl-11 pr-4 text-sm text-ink placeholder:text-slate-400"
              />
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visibleItems.map((item) => {
              const Icon = getIconComponent(item.icon);
              const isActive = item.status === "active";

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-softBlue/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: item.color }}
                    >
                      <Icon className="h-7 w-7 text-ink" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                        </div>
                        <Badge tone={isActive ? "success" : "danger"}>
                          {isActive ? "Valide" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-400">{item.level}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant={isActive ? "danger" : "success"}
                      className="min-h-10 rounded-2xl px-3 py-2 text-xs"
                      aria-label={isActive ? "Desactiver" : "Activer"}
                      disabled={updatingIds.includes(item.id)}
                      onClick={() => setStatus(item.id, isActive ? "inactive" : "active")}
                    >
                      {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isActive ? "Desactiver" : "Activer"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {!visibleItems.length ? (
            <div className="rounded-[24px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              Aucun pictogramme trouve.
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default PictogramDatabase;
