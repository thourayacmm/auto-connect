import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import {
  createCategoryApi,
  createPictogramApi,
  deletePictogramApi,
  listCategoriesApi,
  listPictogramsApi,
  updatePictogramApi,
} from "../../services/domainApi";
import { CHILD_CATEGORY_COLORS, normalizeCategoryName } from "../../utils/constants";
import { classNames, getIconComponent } from "../../utils/helpers";

const defaultCategoryColors = {
  Besoins: "#d7f4ff",
  "Besoins essentiels": "#d7f4ff",
  Emotions: "#efe4ff",
  Actions: "#d8f8ea",
  Lieux: "#ffe9d5",
  Personnes: "#ffe2ec",
  Nourriture: "#fff4bf",
  Ecole: "#eef6ff",
  Famille: "#ffe2ec",
  Sante: "#e7f8ef",
  Transport: "#e8f1ff",
  Activites: "#fff0df",
  General: "#eef6ff",
};

const defaultSubcategories = {
  Besoins: ["Faim et soif", "Sommeil", "Hygiene"],
  "Besoins essentiels": ["Besoins essentiels"],
  Emotions: ["Joie", "Tristesse", "Calme"],
  Actions: ["Demandes", "Jeux", "Aide"],
  Lieux: ["Maison", "Ecole", "Sante"],
  Personnes: ["Famille", "Professionnels", "Moi"],
  Nourriture: ["Fruits", "Boissons", "Repas"],
  Ecole: ["Ecole"],
  Famille: ["Famille"],
  Sante: ["Sante"],
  Transport: ["Transport"],
  Activites: ["Activites"],
  General: ["General"],
};

const iconOptions = [
  "Bot",
  "Soup",
  "Droplets",
  "Joystick",
  "BookHeart",
  "Laugh",
  "MoonStar",
  "Toilet",
  "HeartHandshake",
  "UserRound",
  "School",
  "Home",
  "Stethoscope",
  "Utensils",
  "Apple",
  "Baby",
  "MapPin",
  "Activity",
  "AlarmClock",
  "Ambulance",
  "Bath",
  "Bed",
  "Bike",
  "Bus",
  "Cake",
  "Calendar",
  "Camera",
  "Car",
  "CircleHelp",
  "Coffee",
  "Cookie",
  "Dumbbell",
  "Gamepad2",
  "Gift",
  "Map",
  "MessageCircle",
  "Music",
  "Palette",
  "Pencil",
  "Phone",
  "Pill",
  "Pizza",
  "Plane",
  "Salad",
  "ShowerHead",
  "Smile",
  "Star",
  "Sun",
  "ToyBrick",
  "Train",
  "Trees",
  "Trophy",
  "Volume2",
];

const iconKeywords = {
  Activity: "activite mouvement sport",
  AlarmClock: "temps reveil horloge",
  Ambulance: "sante urgence medecin",
  Apple: "pomme fruit nourriture",
  Baby: "enfant moi bebe",
  Bath: "bain hygiene",
  Bed: "lit dormir sommeil",
  Bike: "velo transport jouer",
  BookHeart: "triste emotion coeur",
  Bot: "robot ia assistant",
  Bus: "bus transport ecole",
  Cake: "gateau anniversaire nourriture",
  Calendar: "calendrier date temps",
  Camera: "photo image",
  Car: "voiture transport",
  CircleHelp: "aide question",
  Coffee: "boire boisson",
  Cookie: "biscuit nourriture",
  Droplets: "eau soif boire",
  Dumbbell: "sport exercice",
  Gamepad2: "jeu jouer",
  Gift: "cadeau",
  HeartHandshake: "aide amour famille maman",
  Home: "maison",
  Joystick: "jouer jeu",
  Laugh: "content joie rire",
  Map: "carte lieu",
  MapPin: "lieu parc position",
  MessageCircle: "parler message",
  MoonStar: "nuit dormir sommeil",
  Music: "musique ecouter",
  Palette: "couleur dessin",
  Pencil: "ecrire crayon ecole",
  Phone: "telephone appeler",
  Pill: "medicament sante",
  Pizza: "pizza nourriture",
  Plane: "avion voyage",
  Salad: "salade manger nourriture",
  School: "ecole",
  ShowerHead: "douche hygiene",
  Smile: "sourire content emotion",
  Soup: "faim manger soupe",
  Star: "etoile favori",
  Stethoscope: "medecin sante",
  Sun: "soleil jour",
  Toilet: "toilettes hygiene",
  ToyBrick: "jouet jouer",
  Train: "train transport",
  Trees: "parc arbre dehors",
  Trophy: "reussite bravo",
  UserRound: "personne papa",
  Utensils: "manger repas",
  Volume2: "son ecouter",
};

const defaultSubcategoryByLabel = {
  "J'ai faim": "Faim et soif",
  "J'ai soif": "Faim et soif",
  "Je veux dormir": "Sommeil",
  Toilettes: "Hygiene",
  "Je suis triste": "Tristesse",
  "Je suis content": "Joie",
  "Je veux jouer": "Jeux",
  Jouer: "Jeux",
  Aider: "Aide",
  Maman: "Famille",
  Papa: "Famille",
  Moi: "Moi",
  Medecin: "Professionnels",
  Maison: "Maison",
  Ecole: "Ecole",
  Parc: "Maison",
  Manger: "Repas",
  Boire: "Boissons",
  Pomme: "Fruits",
};

const demoPictogramLibrary = {
  General: [
    ["Bonjour", "MessageCircle"],
    ["Merci", "HeartHandshake"],
    ["Oui", "Smile"],
    ["Non", "CircleHelp"],
    ["Aide", "CircleHelp"],
    ["Stop", "CircleHelp"],
    ["Encore", "Star"],
    ["Fin", "Star"],
  ],
  "Besoins essentiels": [
    ["Boire", "Droplets"],
    ["Manger", "Utensils"],
    ["Dormir", "Bed"],
    ["Aller aux toilettes", "Toilet"],
    ["Se laver les mains", "ShowerHead"],
    ["Se brosser les dents", "Smile"],
    ["S'habiller", "UserRound"],
    ["Se reposer", "MoonStar"],
  ],
  Emotions: [
    ["Heureux", "Laugh"],
    ["Triste", "BookHeart"],
    ["Fache", "Activity"],
    ["Peur", "CircleHelp"],
    ["Fatigue", "Bed"],
    ["Calme", "Smile"],
    ["Stresse", "AlarmClock"],
    ["Surpris", "Star"],
  ],
  Actions: [
    ["Demander", "MessageCircle"],
    ["Attendre", "AlarmClock"],
    ["Ecouter", "Volume2"],
    ["Regarder", "Camera"],
    ["Jouer", "Gamepad2"],
    ["Lire", "BookHeart"],
    ["Ecrire", "Pencil"],
    ["Ranger", "ToyBrick"],
  ],
  Nourriture: [
    ["Eau", "Droplets"],
    ["Pain", "Cookie"],
    ["Lait", "Coffee"],
    ["Pomme", "Apple"],
    ["Banane", "Salad"],
    ["Soupe", "Soup"],
    ["Yaourt", "Cake"],
    ["Sandwich", "Utensils"],
  ],
  Ecole: [
    ["Cartable", "School"],
    ["Cahier", "BookHeart"],
    ["Crayon", "Pencil"],
    ["Tableau", "School"],
    ["Maitresse", "UserRound"],
    ["Classe", "School"],
    ["Recreation", "Trees"],
    ["Devoirs", "Pencil"],
  ],
  Famille: [
    ["Maman", "HeartHandshake"],
    ["Papa", "UserRound"],
    ["Frere", "Baby"],
    ["Soeur", "Baby"],
    ["Grand-mere", "HeartHandshake"],
    ["Grand-pere", "UserRound"],
    ["Maison", "Home"],
    ["Parent", "HeartHandshake"],
  ],
  Sante: [
    ["Medecin", "Stethoscope"],
    ["Medicament", "Pill"],
    ["Douleur", "Activity"],
    ["Fievre", "Sun"],
    ["Pansement", "HeartHandshake"],
    ["Hopital", "Ambulance"],
    ["Repos", "Bed"],
    ["Aide", "CircleHelp"],
  ],
  Transport: [
    ["Bus", "Bus"],
    ["Voiture", "Car"],
    ["Taxi", "Car"],
    ["Metro", "Train"],
    ["Train", "Train"],
    ["Velo", "Bike"],
    ["Arret", "MapPin"],
    ["Traverser", "Map"],
  ],
  Activites: [
    ["Dessiner", "Palette"],
    ["Chanter", "Music"],
    ["Danser", "Activity"],
    ["Sport", "Dumbbell"],
    ["Puzzle", "ToyBrick"],
    ["Peinture", "Palette"],
    ["Musique", "Music"],
    ["Histoire", "BookHeart"],
  ],
};

const MIN_DEMO_PICTOGRAMS = 40;

const shouldHidePictogram = (item) => String(item?.label || item?.name || "").trim().toLowerCase() === "jj";

const normalizePictogramCategory = (item) => {
  const label = String(item?.label || item?.name || "").trim().toLowerCase();
  if (label === "cafe" || label === "café") return "Nourriture";
  return normalizeCategoryName(item.category);
};

const normalizePictogram = (item) => ({
  ...item,
  category: normalizePictogramCategory(item),
  status: item.isActive === false ? "pending" : "active",
  subcategory:
    String(item.label || item.name || "").trim().toLowerCase() === "cafe" ||
    String(item.label || item.name || "").trim().toLowerCase() === "café"
      ? "Nourriture"
      :
    item.subcategory ||
    defaultSubcategoryByLabel[item.label] ||
    defaultSubcategories[normalizePictogramCategory(item)]?.[0] ||
    "General",
});

const DEMO_PICTOGRAMS = Object.entries(demoPictogramLibrary).flatMap(([category, entries]) =>
  entries.map(([label, icon], index) =>
    normalizePictogram({
      id: `demo-${category}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      category,
      subcategory: category,
      icon,
      color: defaultCategoryColors[category],
      level: index < 5 ? "Debutant" : "Intermediaire",
      ageMin: 2,
      ageMax: 12,
      isActive: true,
      demo: true,
    }),
  ),
);

const buildLibraryFromItems = (pictograms, fallbackCategories = []) => {
  const categorySet = new Set(
    [...fallbackCategories, ...pictograms.map((item) => item.category)]
      .map(normalizeCategoryName)
      .filter(Boolean),
  );
  categorySet.delete("mange");

  const categories = [...categorySet].filter((category) =>
    pictograms.some((item) => item.category === category),
  );
  const subcategories = categories.reduce((acc, category) => {
    const itemSubcategories = pictograms
      .filter((item) => item.category === category)
      .map((item) => item.subcategory || defaultSubcategories[category]?.[0] || "General");
    acc[category] = Array.from(new Set([...(defaultSubcategories[category] || []), ...itemSubcategories]));
    return acc;
  }, {});

  return { categories, subcategories };
};

const mergeDemoPictograms = (apiPictograms) => {
  const normalizedItems = apiPictograms.filter((item) => !shouldHidePictogram(item)).map(normalizePictogram);
  if (normalizedItems.length >= MIN_DEMO_PICTOGRAMS) return normalizedItems;

  const existingKeys = new Set(
    normalizedItems.map((item) => `${item.category}:${String(item.label || "").trim().toLowerCase()}`),
  );
  const missingDemoItems = DEMO_PICTOGRAMS.filter(
    (item) => !existingKeys.has(`${item.category}:${String(item.label || "").trim().toLowerCase()}`),
  );

  return [...normalizedItems, ...missingDemoItems];
};

const buildLibraryState = (categories, subcategoryMap, category, subcategory) => {
  const nextCategories = categories.includes(category) ? categories : [...categories, category];
  const nextSubcategories = {
    ...subcategoryMap,
    [category]: Array.from(new Set([...(subcategoryMap[category] || []), subcategory])),
  };

  return { categories: nextCategories, subcategories: nextSubcategories };
};

const buildEmptyForm = (category, subcategory, subcategoryMap) => ({
  label: "",
  category,
  subcategory: subcategory || subcategoryMap[category]?.[0] || "General",
  newCategory: "",
  newSubcategory: "",
  icon: "Bot",
  color: defaultCategoryColors[category] || "#d7f4ff",
  level: "Debutant",
  ageMin: "2",
  ageMax: "25",
});

const pickUnusedIcon = (items, currentId = null) => {
  const usedIcons = new Set(
    items
      .filter((item) => item.id !== currentId)
      .map((item) => item.icon)
      .filter(Boolean),
  );
  return iconOptions.find((iconName) => !usedIcons.has(iconName)) || "Bot";
};

function PictogramManagement() {
  const initialLibrary = { categories: [], subcategories: {} };
  const [items, setItems] = useState([]);
  const [library, setLibrary] = useState(initialLibrary);
  const [activeCategory, setActiveCategory] = useState(initialLibrary.categories[0]);
  const [open, setOpen] = useState(false);
  const [editingPictogram, setEditingPictogram] = useState(null);
  const [deletingPictogram, setDeletingPictogram] = useState(null);
  const [form, setForm] = useState(
    buildEmptyForm(initialLibrary.categories[0], null, initialLibrary.subcategories),
  );
  const [error, setError] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [sourceLabel, setSourceLabel] = useState("backend");
  const [categoryIds, setCategoryIds] = useState({});

  useEffect(() => {
    Promise.all([listCategoriesApi(), listPictogramsApi()])
      .then(([apiCategories, apiPictograms]) => {
        const labels = apiCategories
          .map((category) => normalizeCategoryName(category.name || category.label))
          .filter(Boolean);
        const nextItems = mergeDemoPictograms(apiPictograms);
        const nextLibrary = buildLibraryFromItems(nextItems, labels);
        setCategoryIds(
          Object.fromEntries(
            apiCategories.map((category) => [
              normalizeCategoryName(category.name || category.label),
              category.id,
            ]),
          ),
        );
        setLibrary(nextLibrary);
        if (nextLibrary.categories[0]) setActiveCategory(nextLibrary.categories[0]);
        setItems(nextItems);
        setSourceLabel(apiPictograms.length >= MIN_DEMO_PICTOGRAMS ? "backend" : "backend + demo");
      })
      .catch(() => {
        const nextLibrary = buildLibraryFromItems(DEMO_PICTOGRAMS);
        setItems(DEMO_PICTOGRAMS);
        setLibrary(nextLibrary);
        if (nextLibrary.categories[0]) setActiveCategory(nextLibrary.categories[0]);
        setSourceLabel("donnees de demo");
      });
  }, []);

  const categories = library.categories;
  const subcategoryMap = library.subcategories;
  const subcategories = subcategoryMap[activeCategory] || ["General"];
  const formSubcategories = subcategoryMap[form.category] || ["General"];

  const filteredIcons = useMemo(
    () =>
      iconOptions.filter((iconName) =>
        `${iconName} ${iconKeywords[iconName] || ""}`
          .toLowerCase()
          .includes(iconSearch.toLowerCase()),
      ),
    [iconSearch],
  );

  const groupedPictograms = useMemo(() => {
    const groups = subcategories.map((subcategory) => ({
      subcategory,
      pictograms: items.filter(
        (item) => item.category === activeCategory && item.subcategory === subcategory,
      ),
    }));
    const hasVisiblePictograms = groups.some((group) => group.pictograms.length > 0);
    return hasVisiblePictograms ? groups.filter((group) => group.pictograms.length > 0) : groups;
  }, [activeCategory, items, subcategories]);

  const openAddModal = (category = activeCategory, subcategory) => {
    setEditingPictogram(null);
    setForm({
      ...buildEmptyForm(category, subcategory, subcategoryMap),
      icon: pickUnusedIcon(items),
    });
    setIconSearch("");
    setError("");
    setOpen(true);
  };

  const openEditModal = (pictogram) => {
    setEditingPictogram(pictogram);
    setForm({
      label: pictogram.label,
      category: pictogram.category,
      subcategory: pictogram.subcategory,
      newCategory: "",
      newSubcategory: "",
      icon: pictogram.icon,
      color: pictogram.color || defaultCategoryColors[pictogram.category] || "#d7f4ff",
      level: pictogram.level || "Debutant",
      ageMin: String(pictogram.ageMin ?? 2),
      ageMax: String(pictogram.ageMax ?? 25),
    });
    setIconSearch("");
    setError("");
    setOpen(true);
  };

  const updateCategory = (category) => {
    setForm((current) => ({
      ...current,
      category,
      subcategory: subcategoryMap[category]?.[0] || "General",
      newCategory: "",
      newSubcategory: "",
      color: defaultCategoryColors[category] || current.color,
    }));
  };

  const createPictogram = async () => {
    const finalCategory = form.newCategory.trim() || form.category;
    const finalSubcategory = form.newSubcategory.trim() || form.subcategory;

    if (!form.label.trim()) {
      setError("Le nom du pictogramme est obligatoire.");
      return;
    }

    if (!finalCategory || !finalSubcategory) {
      setError("La categorie et la sous-categorie sont obligatoires.");
      return;
    }

    const nextLibrary = buildLibraryState(
      categories,
      subcategoryMap,
      finalCategory,
      finalSubcategory,
    );

    const nextPictogram = {
      id: editingPictogram?.id || Date.now(),
      label: form.label.trim(),
      category: finalCategory,
      subcategory: finalSubcategory,
      icon: form.icon,
      color: form.color,
      level: form.level,
      ageMin: Number(form.ageMin) || 2,
      ageMax: Number(form.ageMax) || 25,
    };

    if (nextPictogram.ageMin > nextPictogram.ageMax) {
      setError("L'age minimum doit etre inferieur ou egal a l'age maximum.");
      return;
    }

    if (sourceLabel.startsWith("backend")) {
      try {
        let backendCategoryId = categoryIds[finalCategory];
        if (!backendCategoryId) {
          const createdCategory = await createCategoryApi({
            name: finalCategory,
            description: finalSubcategory,
            color: defaultCategoryColors[finalCategory] || "#d7f4ff",
          });
          backendCategoryId = createdCategory.id;
          setCategoryIds((current) => ({ ...current, [finalCategory]: createdCategory.id }));
        }

        const payload = {
          name: nextPictogram.label,
          imageUrl: `https://dummyimage.com/256x256/eef6ff/17233c&text=${encodeURIComponent(nextPictogram.label)}`,
          category: backendCategoryId,
          keywords: [nextPictogram.label, finalCategory, finalSubcategory],
          level: nextPictogram.level,
          ageMin: nextPictogram.ageMin,
          ageMax: nextPictogram.ageMax,
          icon: nextPictogram.icon,
          subcategory: finalSubcategory,
          description: finalSubcategory,
        };
        const saved = editingPictogram
          ? await updatePictogramApi(editingPictogram.id, payload)
          : await createPictogramApi(payload);

        setLibrary(nextLibrary);
        setItems((current) =>
          editingPictogram
            ? current.map((item) => (item.id === editingPictogram.id ? normalizePictogram(saved) : item))
            : [normalizePictogram(saved), ...current],
        );
        setEditingPictogram(null);
        setOpen(false);
        setActiveCategory(finalCategory);
        return;
      } catch (backendError) {
        setError(backendError.message);
        return;
      }
    }

    setLibrary(nextLibrary);
    setItems((current) =>
      editingPictogram
        ? current.map((item) => (item.id === editingPictogram.id ? normalizePictogram(nextPictogram) : item))
        : [normalizePictogram(nextPictogram), ...current],
    );
    setEditingPictogram(null);
    setOpen(false);
    setActiveCategory(finalCategory);
  };

  const deletePictogram = async () => {
    if (!sourceLabel.startsWith("backend") || deletingPictogram.demo) {
      setItems((current) => current.filter((item) => item.id !== deletingPictogram.id));
      setDeletingPictogram(null);
      return;
    }

    try {
      await deletePictogramApi(deletingPictogram.id);
      setItems((current) => current.filter((item) => item.id !== deletingPictogram.id));
      setDeletingPictogram(null);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const PreviewIcon = getIconComponent(form.icon);
  const finalPreviewSubcategory = form.newSubcategory.trim() || form.subcategory;
  const finalPreviewCategory = form.newCategory.trim() || form.category;
  const previewCategory = normalizeCategoryName(finalPreviewCategory);
  const previewTone = CHILD_CATEGORY_COLORS[previewCategory] || "bg-white text-ink";

  return (
    <Card
      title={`Gestion des pictogrammes (${sourceLabel})`}
      action={<Button onClick={() => openAddModal()}>Ajouter un pictogramme</Button>}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const count = items.filter((item) => item.category === category).length;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={classNames(
                "focus-ring rounded-2xl px-4 py-2 text-sm font-semibold transition",
                activeCategory === category
                  ? "bg-slateBlue text-white"
                  : "bg-white text-slate-600 hover:bg-softBlue/10",
              )}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {groupedPictograms.map(({ subcategory, pictograms }) => (
          <section key={subcategory} className="rounded-[28px] bg-white/70 p-4">
            <div className="mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{subcategory}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {pictograms.length} pictogramme(s)
                </p>
              </div>
            </div>

            {pictograms.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {pictograms.map((pictogram) => {
                  const Icon = getIconComponent(pictogram.icon);
                  const tone = CHILD_CATEGORY_COLORS[normalizeCategoryName(pictogram.category)] || "bg-white text-ink";

                  return (
                    <div key={pictogram.id} className="flex items-stretch gap-2">
                      <div
                        className={classNames(
                          "flex min-h-[150px] flex-1 flex-col items-center justify-center gap-3 rounded-[28px] p-4 text-center shadow-card",
                          tone,
                        )}
                        style={
                          CHILD_CATEGORY_COLORS[normalizeCategoryName(pictogram.category)]
                            ? undefined
                            : { backgroundColor: pictogram.color }
                        }
                      >
                        <Icon className="h-10 w-10" />
                        <div>
                          <p className="font-display text-base font-bold">{pictogram.label}</p>
                          <p className="mt-1 text-xs opacity-80">{pictogram.subcategory}</p>
                          {pictogram.status === "pending" ? (
                            <p className="mt-2 text-xs font-bold text-danger">En attente admin</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex w-11 shrink-0 flex-col justify-center gap-2">
                        <button
                          type="button"
                          aria-label="Modifier pictogramme"
                          onClick={() => openEditModal(pictogram)}
                          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue shadow-card transition hover:bg-softBlue/25"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Supprimer pictogramme"
                          onClick={() => setDeletingPictogram(pictogram)}
                          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-card transition hover:bg-danger/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-softBlue/30 bg-white p-5 text-sm text-slate-500">
                Aucun pictogramme dans cette sous-categorie.
              </div>
            )}
          </section>
        ))}
      </div>

      <Modal
        open={open}
        title={editingPictogram ? "Modifier un pictogramme" : "Ajouter un pictogramme"}
        onClose={() => {
          setOpen(false);
          setEditingPictogram(null);
        }}
        panelClassName="max-w-5xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditingPictogram(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={createPictogram}>
              {editingPictogram ? "Enregistrer" : "Ajouter"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="picto-name"
              label="Nom"
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
            />
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Categorie</span>
              <select
                className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
                value={form.category}
                onChange={(event) => updateCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Input
              id="picto-new-category"
              label="Nouvelle categorie"
              value={form.newCategory}
              placeholder="Ex: Vetements"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newCategory: event.target.value,
                  newSubcategory: current.newSubcategory,
                }))
              }
            />
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Sous-categorie</span>
              <select
                className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
                value={form.subcategory}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subcategory: event.target.value }))
                }
              >
                {formSubcategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Input
              id="picto-new-subcategory"
              label="Nouvelle sous-categorie"
              value={form.newSubcategory}
              placeholder="Ex: Chaussures"
              onChange={(event) =>
                setForm((current) => ({ ...current, newSubcategory: event.target.value }))
              }
            />
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Bibliotheque icons SVG</span>
              <Input
                id="picto-icon-search"
                value={iconSearch}
                placeholder="Rechercher: manger, dormir, ecole, sante..."
                onChange={(event) => setIconSearch(event.target.value)}
              />
              <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border border-softBlue/20 bg-white p-2 sm:grid-cols-6">
                {filteredIcons.map((item) => {
                  const Icon = getIconComponent(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      title={item}
                      onClick={() => setForm((current) => ({ ...current, icon: item }))}
                      className={classNames(
                        "focus-ring flex h-14 items-center justify-center rounded-2xl border transition",
                        form.icon === item
                          ? "border-slateBlue bg-softBlue/15 text-slateBlue"
                          : "border-transparent bg-slate-50 text-slate-500 hover:bg-softBlue/10",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </button>
                  );
                })}
              </div>
              <span className="block text-xs font-semibold text-slate-500">
                Icone selectionnee: {form.icon}
              </span>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Niveau recommande</span>
              <select
                className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
                value={form.level}
                onChange={(event) =>
                  setForm((current) => ({ ...current, level: event.target.value }))
                }
              >
                <option>Debutant</option>
                <option>Intermediaire</option>
                <option>Avance</option>
              </select>
            </label>
            <Input
              id="picto-color"
              label="Couleur"
              type="color"
              value={form.color}
              onChange={(event) =>
                setForm((current) => ({ ...current, color: event.target.value }))
              }
            />
            <Input
              id="picto-age-min"
              label="Age minimum"
              type="number"
              min="2"
              max="25"
              value={form.ageMin}
              onChange={(event) =>
                setForm((current) => ({ ...current, ageMin: event.target.value }))
              }
            />
            <Input
              id="picto-age-max"
              label="Age maximum"
              type="number"
              min="2"
              max="25"
              value={form.ageMax}
              onChange={(event) =>
                setForm((current) => ({ ...current, ageMax: event.target.value }))
              }
            />
            {error ? <p className="text-sm font-semibold text-danger md:col-span-2">{error}</p> : null}
          </div>

          <div className="rounded-[28px] bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-500">Apercu</p>
            <div
              className={classNames(
                "flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[28px] p-4 text-center shadow-card",
                previewTone,
              )}
              style={
                CHILD_CATEGORY_COLORS[previewCategory]
                  ? undefined
                  : { backgroundColor: form.color }
              }
            >
              <PreviewIcon className="h-12 w-12" />
              <div>
                <p className="font-display text-lg font-bold">
                  {form.label || "Nouveau pictogramme"}
                </p>
                <p className="mt-1 text-xs opacity-80">{finalPreviewSubcategory}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingPictogram)}
        title="Confirmer la suppression"
        onClose={() => setDeletingPictogram(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingPictogram(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={deletePictogram}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Voulez-vous vraiment supprimer le pictogramme{" "}
            <span className="font-semibold text-ink">{deletingPictogram?.label}</span> ?
          </p>
        </div>
      </Modal>
    </Card>
  );
}

export default PictogramManagement;
