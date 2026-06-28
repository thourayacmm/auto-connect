import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Lightbulb, ListChecks, PlayCircle, Plus, Trash2 } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import SearchBar from "../../components/common/SearchBar";
import {
  createScenarioApi,
  deleteScenarioApi,
  listKidsApi,
  listPictogramsApi,
  listScenariosApi,
  updateScenarioApi,
} from "../../services/domainApi";

const formatPictogramLabel = (item) => (typeof item === "string" ? item : item.label || item.name || "");

const buildDemoKids = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `demo-kid-${count}-${index + 1}`,
    name: `Enfant ${index + 1}`,
  }));

const DEMO_SCENARIOS = [
  {
    id: "demo-routine-matin",
    title: "Routine du matin",
    level: "Debutant",
    ageTarget: "2-5 ans",
    ageMin: 2,
    ageMax: 5,
    assignedKids: buildDemoKids(6),
    description: "L'enfant enchaine besoins, actions et preparation pour l'ecole.",
    isActive: true,
    estimatedDuration: 5,
    pictograms: ["Se lever", "Toilette", "S'habiller", "Ecole"],
    childGoal: "L'enfant suit une sequence simple pour preparer sa matinee.",
    blockageHelp: "Reprendre la routine avec deux pictogrammes visibles et valider chaque choix.",
    steps: [
      "Presenter les pictogrammes de la routine du matin.",
      "Demander a l'enfant de choisir l'action suivante.",
      "Ecouter la phrase et passer a l'etape suivante.",
    ],
  },
  {
    id: "demo-demander-aide",
    title: "Demander de l'aide",
    level: "Debutant",
    ageTarget: "3-6 ans",
    ageMin: 3,
    ageMax: 6,
    assignedKids: buildDemoKids(14),
    description: "L'enfant apprend a exprimer un besoin d'aide avec des pictogrammes.",
    isActive: true,
    estimatedDuration: 4,
    pictograms: ["Aide-moi", "Je veux", "Difficile"],
    childGoal: "L'enfant identifie une difficulte puis demande l'aide d'un adulte.",
    blockageHelp: "Montrer le pictogramme Aide-moi, puis laisser l'enfant completer la demande.",
    steps: [
      "Creer une petite situation de blocage.",
      "Proposer le pictogramme Aide-moi.",
      "Valider la demande et repondre immediatement au besoin.",
    ],
  },
  {
    id: "demo-emotion-difficile",
    title: "Expliquer une emotion difficile",
    level: "Avance",
    ageTarget: "6-10 ans",
    ageMin: 6,
    ageMax: 10,
    assignedKids: buildDemoKids(5),
    description: "L'enfant identifie son emotion puis demande le soutien d'un parent.",
    isActive: true,
    estimatedDuration: 8,
    pictograms: ["Triste", "En colere", "Papa", "Maman", "Calme"],
    childGoal: "L'enfant nomme son emotion et choisit une strategie de soutien.",
    blockageHelp: "Revenir aux emotions de base et proposer un choix entre deux pictogrammes.",
    steps: [
      "Afficher deux emotions et demander ce que ressent l'enfant.",
      "Ajouter le pictogramme du parent ou adulte souhaite.",
      "Construire une phrase courte pour demander du soutien.",
    ],
  },
  {
    id: "demo-trajet-metro",
    title: "Trajet en metro leger",
    level: "Avance",
    ageTarget: "7-12 ans",
    ageMin: 7,
    ageMax: 12,
    assignedKids: buildDemoKids(3),
    description: "L'enfant prepare un trajet avec transport, destination et besoin d'aide.",
    isActive: true,
    estimatedDuration: 10,
    pictograms: ["Metro leger", "Arret", "Ecole", "Aide-moi"],
    childGoal: "L'enfant organise les pictogrammes pour anticiper un deplacement.",
    blockageHelp: "Decouper le trajet en depart, transport, destination, puis aide si besoin.",
    steps: [
      "Choisir le moyen de transport.",
      "Ajouter la destination.",
      "Prevoir une demande d'aide si l'enfant se sent bloque.",
    ],
  },
];

const LEVEL_FILTERS = ["Tous les niveaux", "Debutant", "Intermediaire", "Avance"];

const DEMO_STATS = {
  activeScenarios: 12,
  assignedChildren: 48,
  averageDuration: 7,
  levelsCount: 3,
};

const normalizeLevel = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase();

const enrichScenario = (scenario) => ({
  ...scenario,
  pictograms: scenario.pictograms || [],
  assignedKids: scenario.assignedKids || [],
  estimatedDuration: scenario.estimatedDuration || 5,
  isActive: scenario.isActive !== false,
  childGoal:
    scenario.childGoal ||
    "L'enfant observe la situation, choisit les pictogrammes utiles, puis construit une phrase courte.",
  blockageHelp:
    scenario.blockageHelp ||
    "Si l'enfant bloque, proposer deux choix maximum et montrer le premier pictogramme attendu.",
  steps:
    scenario.steps?.length
      ? scenario.steps
      : [
          "Regarder l'image ou ecouter la consigne du scenario.",
          "Selectionner les pictogrammes dans l'ordre demande.",
          "Ecouter la phrase et recommencer avec moins d'aide.",
        ],
});

const emptyForm = {
  title: "",
  description: "",
  childGoal: "",
  blockageHelp: "",
  level: "Debutant",
  ageTarget: "",
  ageMin: "2",
  ageMax: "25",
  pictograms: "",
  assignedKidIds: [],
  step1: "",
  step2: "",
  step3: "",
};

function ScenarioManagement() {
  const [scenarios, setScenarios] = useState([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tous les niveaux");
  const [open, setOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [deletingScenario, setDeletingScenario] = useState(null);
  const [expandedScenarioId, setExpandedScenarioId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [children, setChildren] = useState([]);
  const [pictogramsCatalog, setPictogramsCatalog] = useState([]);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("base de donnees");

  useEffect(() => {
    listScenariosApi()
      .then((items) => {
        if (items.length) {
          setScenarios(items.map(enrichScenario));
          setSourceLabel("base de donnees");
        } else {
          setScenarios(DEMO_SCENARIOS.map(enrichScenario));
          setSourceLabel("donnees de demo");
        }
      })
      .catch(() => {
        setScenarios(DEMO_SCENARIOS.map(enrichScenario));
        setSourceLabel("base de donnees indisponible");
      });
    listKidsApi()
      .then(setChildren)
      .catch(() => setChildren([]));
    listPictogramsApi()
      .then(setPictogramsCatalog)
      .catch(() => setPictogramsCatalog([]));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
    setEditingScenario(null);
  };

  const openCreateModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (scenario) => {
    const normalizedScenario = enrichScenario(scenario);
    setEditingScenario(scenario);
    setForm({
      title: normalizedScenario.title,
      description: normalizedScenario.description,
      childGoal: normalizedScenario.childGoal,
      blockageHelp: normalizedScenario.blockageHelp,
      level: normalizedScenario.level,
      ageTarget: normalizedScenario.ageTarget,
      ageMin: String(normalizedScenario.ageMin ?? 2),
      ageMax: String(normalizedScenario.ageMax ?? 25),
      pictograms: (normalizedScenario.pictograms || []).map(formatPictogramLabel).filter(Boolean).join(", "),
      assignedKidIds: (normalizedScenario.assignedKids || []).map((kid) => kid.id || kid._id).filter(Boolean),
      step1: normalizedScenario.steps[0] || "",
      step2: normalizedScenario.steps[1] || "",
      step3: normalizedScenario.steps[2] || "",
    });
    setError("");
    setOpen(true);
  };

  const saveScenario = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Le titre et la description sont obligatoires.");
      return;
    }

    const nextScenario = {
      id: editingScenario?.id || `s-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      childGoal:
        form.childGoal.trim() ||
        "L'enfant choisit les pictogrammes utiles pour repondre a la consigne.",
      blockageHelp:
        form.blockageHelp.trim() ||
        "Reduire le choix, montrer un exemple, puis laisser l'enfant reessayer.",
      level: form.level,
      ageTarget: form.ageTarget.trim() || "Non precise",
      ageMin: Number(form.ageMin) || 2,
      ageMax: Number(form.ageMax) || 25,
      pictograms: form.pictograms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      assignedKidIds: form.assignedKidIds,
      steps: [form.step1, form.step2, form.step3]
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (!nextScenario.steps.length) {
      nextScenario.steps = [
        "Lire la consigne avec l'enfant.",
        "Choisir les pictogrammes un par un.",
        "Ecouter la phrase et valider la reponse.",
      ];
    }

    if (nextScenario.ageMin > nextScenario.ageMax) {
      setError("L'age minimum doit etre inferieur ou egal a l'age maximum.");
      return;
    }

    if (sourceLabel === "base de donnees") {
      try {
        const payload = {
          title: nextScenario.title,
          description: nextScenario.description,
          ageTarget: nextScenario.ageTarget,
          childGoal: nextScenario.childGoal,
          blockageHelp: nextScenario.blockageHelp,
          steps: nextScenario.steps,
          targetLevel: nextScenario.level,
          ageMin: nextScenario.ageMin,
          ageMax: nextScenario.ageMax,
          pictogramSequence: nextScenario.pictograms
            .map((label) =>
              pictogramsCatalog.find((item) => item.label.toLowerCase() === label.toLowerCase())?.id,
            )
            .filter(Boolean),
          assignedKids: nextScenario.assignedKidIds,
          estimatedDuration: 5,
        };
        const saved = editingScenario
          ? await updateScenarioApi(editingScenario.id, payload)
          : await createScenarioApi(payload);
        setScenarios((current) =>
          editingScenario
            ? current.map((scenario) => (scenario.id === editingScenario.id ? enrichScenario(saved) : scenario))
            : [enrichScenario(saved), ...current],
        );
        setOpen(false);
        resetForm();
        return;
      } catch (error) {
        setError(error.message);
        return;
      }
    }

    setScenarios((current) =>
      editingScenario
        ? current.map((scenario) =>
            scenario.id === editingScenario.id ? nextScenario : scenario,
          )
        : [nextScenario, ...current],
    );
    setOpen(false);
    resetForm();
  };

  const deleteScenario = async () => {
    if (sourceLabel === "base de donnees") {
      try {
        await deleteScenarioApi(deletingScenario.id);
        setScenarios((current) => current.filter((scenario) => scenario.id !== deletingScenario.id));
        setDeletingScenario(null);
        return;
      } catch (_error) {
        setSourceLabel("mode local");
      }
    }
    setScenarios((current) => current.filter((scenario) => scenario.id !== deletingScenario.id));
    setDeletingScenario(null);
  };

  const closeScenarioModal = () => {
    setOpen(false);
    resetForm();
  };

  const filteredScenarios = useMemo(
    () =>
      scenarios.filter((rawScenario) => {
        const scenario = enrichScenario(rawScenario);
        const matchesSearch = `${scenario.title} ${scenario.description} ${scenario.level} ${scenario.ageTarget}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesLevel =
          levelFilter === "Tous les niveaux" || normalizeLevel(scenario.level) === normalizeLevel(levelFilter);

        return matchesSearch && matchesLevel;
      }),
    [levelFilter, scenarios, search],
  );

  const scenarioStats = useMemo(() => {
    const activeScenarios = scenarios.filter((scenario) => enrichScenario(scenario).isActive);
    const assignedChildrenCount = scenarios.reduce(
      (sum, scenario) => sum + (enrichScenario(scenario).assignedKids?.length || 0),
      0,
    );
    const durations = scenarios.map((scenario) => Number(enrichScenario(scenario).estimatedDuration || 0)).filter(Boolean);
    const levels = new Set(scenarios.map((scenario) => normalizeLevel(enrichScenario(scenario).level)).filter(Boolean));
    const averageDuration = durations.length
      ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
      : 0;

    return {
      activeCount: activeScenarios.length > 0 ? activeScenarios.length : DEMO_STATS.activeScenarios,
      assignedChildrenCount:
        assignedChildrenCount > 0 ? assignedChildrenCount : DEMO_STATS.assignedChildren,
      averageDuration: averageDuration > 0 ? averageDuration : DEMO_STATS.averageDuration,
      levelCount: levels.size > 0 ? levels.size : DEMO_STATS.levelsCount,
    };
  }, [scenarios]);

  return (
    <Card
      title={`Gestion des scenarios (${sourceLabel})`}
      action={
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Creer scenario
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Scenarios actifs", value: `${scenarioStats.activeCount}` },
          { label: "Enfants assignes", value: `${scenarioStats.assignedChildrenCount}` },
          { label: "Duree moyenne", value: `${scenarioStats.averageDuration} min` },
          { label: "Niveaux disponibles", value: `${scenarioStats.levelCount}` },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_auto]">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un scenario..." />
        <div className="flex flex-wrap gap-2">
          {LEVEL_FILTERS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setLevelFilter(level)}
              className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                levelFilter === level
                  ? "bg-slateBlue text-white shadow-card"
                  : "bg-slate-50 text-slate-600 hover:bg-softBlue/15"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        {filteredScenarios.map((rawScenario) => {
          const scenario = enrichScenario(rawScenario);

          return (
          <article key={scenario.id} className="rounded-[28px] border border-softBlue/10 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                    <PlayCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{scenario.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="secondary">{scenario.level}</Badge>
                      <Badge tone="primary">{scenario.ageTarget}</Badge>
                      <Badge tone="success">
                        {scenario.assignedKids?.length || 0} enfant(s)
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label="Voir details scenario"
                  onClick={() =>
                    setExpandedScenarioId((current) =>
                      current === scenario.id ? null : scenario.id,
                    )
                  }
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Modifier scenario"
                  onClick={() => openEditModal(scenario)}
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer scenario"
                  onClick={() => setDeletingScenario(scenario)}
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger transition hover:bg-danger/15"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Statut</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {scenario.isActive ? "Actif" : "Inactif"}
                </p>
              </div>
              <div className="rounded-[22px] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Duree estimee</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {scenario.estimatedDuration} min
                </p>
              </div>
            </div>

            {expandedScenarioId === scenario.id ? (
              <>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-slateBlue" />
                      <p className="font-semibold text-ink">Etapes de l'exercice</p>
                    </div>
                    <div className="space-y-3">
                      {scenario.steps.map((step, index) => (
                        <div key={`${scenario.id}-${step}`} className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-softBlue/15 text-xs font-bold text-slateBlue">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-slate-600">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Ce que fait l'enfant
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {scenario.childGoal}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-warning/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-[#a85d18]" />
                        <p className="text-sm font-semibold text-[#a85d18]">
                          En cas de blocage
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{scenario.blockageHelp}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                    Enfants assignes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.assignedKids?.length ? (
                      scenario.assignedKids.map((kid) => (
                        <Badge key={kid.id || kid._id} tone="success">
                          {kid.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        Aucun enfant assigne. Le scenario ne sera pas visible dans l'espace enfant.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                    Pictogrammes de l'exercice
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.pictograms.length ? (
                      scenario.pictograms.map((item) => (
                        <Badge key={formatPictogramLabel(item)} tone="primary">
                          {formatPictogramLabel(item)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        Aucun pictogramme renseigne.
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </article>
          );
        })}
        {!filteredScenarios.length ? (
          <div className="rounded-[24px] bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            Aucun scenario ne correspond a la recherche.
          </div>
        ) : null}
      </div>

      <Modal
        open={open}
        title={editingScenario ? "Modifier un scenario" : "Creer un scenario"}
        onClose={closeScenarioModal}
        panelClassName="max-w-4xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeScenarioModal}>
              Annuler
            </Button>
            <Button onClick={saveScenario}>Enregistrer</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="scenario-title"
              label="Titre"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <Input
              id="scenario-age"
              label="Texte age cible"
              value={form.ageTarget}
              placeholder="Ex: 5-8 ans"
              onChange={(event) =>
                setForm((current) => ({ ...current, ageTarget: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="scenario-age-min"
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
              id="scenario-age-max"
              label="Age maximum"
              type="number"
              min="2"
              max="25"
              value={form.ageMax}
              onChange={(event) =>
                setForm((current) => ({ ...current, ageMax: event.target.value }))
              }
            />
          </div>
          <Input
            id="scenario-description"
            label="Description"
            value={form.description}
            placeholder="Ex: Assembler une phrase simple pour exprimer la faim."
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <Input
            id="scenario-child-goal"
            label="Ce que fait l'enfant"
            value={form.childGoal}
            placeholder="Ex: L'enfant choisit les pictogrammes puis ecoute la phrase."
            onChange={(event) =>
              setForm((current) => ({ ...current, childGoal: event.target.value }))
            }
          />
          <Input
            id="scenario-blockage"
            label="Aide en cas de blocage"
            value={form.blockageHelp}
            placeholder="Ex: Reduire le choix a deux pictogrammes et montrer le premier."
            onChange={(event) =>
              setForm((current) => ({ ...current, blockageHelp: event.target.value }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Niveau</span>
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
              id="scenario-pictograms"
              label="Pictogrammes"
              value={form.pictograms}
              placeholder="Ex: J'ai faim, Manger, Pomme"
              onChange={(event) =>
                setForm((current) => ({ ...current, pictograms: event.target.value }))
              }
            />
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="mb-3 font-semibold text-ink">Enfants concernes</p>
            {children.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {children.map((child) => {
                  const checked = form.assignedKidIds.includes(child.id);
                  return (
                    <label
                      key={child.id}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        checked
                          ? "border-slateBlue bg-softBlue/15 text-ink"
                          : "border-transparent bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slateBlue"
                        checked={checked}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            assignedKidIds: event.target.checked
                              ? [...current.assignedKidIds, child.id]
                              : current.assignedKidIds.filter((id) => id !== child.id),
                          }))
                        }
                      />
                      <span>{child.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                Aucun enfant suivi disponible pour ce therapeute.
              </p>
            )}
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="mb-3 font-semibold text-ink">Etapes de l'exercice</p>
            <div className="grid gap-3">
              <Input
                id="scenario-step-1"
                label="Etape 1"
                value={form.step1}
                placeholder="Ex: Montrer la situation a l'enfant."
                onChange={(event) =>
                  setForm((current) => ({ ...current, step1: event.target.value }))
                }
              />
              <Input
                id="scenario-step-2"
                label="Etape 2"
                value={form.step2}
                placeholder="Ex: Demander de choisir le premier pictogramme."
                onChange={(event) =>
                  setForm((current) => ({ ...current, step2: event.target.value }))
                }
              />
              <Input
                id="scenario-step-3"
                label="Etape 3"
                value={form.step3}
                placeholder="Ex: Ecouter la phrase et feliciter la reponse."
                onChange={(event) =>
                  setForm((current) => ({ ...current, step3: event.target.value }))
                }
              />
            </div>
          </div>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingScenario)}
        title="Confirmer la suppression"
        onClose={() => setDeletingScenario(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingScenario(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={deleteScenario}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Voulez-vous vraiment supprimer le scenario{" "}
            <span className="font-semibold text-ink">{deletingScenario?.title}</span> ?
          </p>
        </div>
      </Modal>
    </Card>
  );
}

export default ScenarioManagement;
