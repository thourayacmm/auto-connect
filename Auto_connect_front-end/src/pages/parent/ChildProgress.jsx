import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import { getKidProgressApi, listKidsApi } from "../../services/domainApi";
import { getStoredUser } from "../../utils/helpers";
import { normalizeLevelLabel } from "../../utils/levels";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const colors = {
  aqua: "#68d6c7",
  ink: "#17233c",
  lilac: "#9f92f4",
  slate: "#536179",
  softBlue: "#72c6f4",
  slateBlue: "#5c75e6",
};

const weekLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const DEMO_WEEKLY_PROGRESS = [
  { label: "Semaine 1", value: 52 },
  { label: "Semaine 2", value: 60 },
  { label: "Semaine 3", value: 68 },
  { label: "Semaine 4", value: 74 },
  { label: "Semaine 5", value: 82 },
  { label: "Semaine 6", value: 89 },
];

const DEMO_TOP_WORDS = [
  { label: "Pharmacie", value: 34 },
  { label: "J'ai mal", value: 29 },
  { label: "Maman", value: 25 },
  { label: "Boire", value: 22 },
  { label: "Aide", value: 18 },
  { label: "Jouer", value: 15 },
];

const DEMO_SKILLS = [
  { label: "Communication", value: 90 },
  { label: "Autonomie", value: 82 },
  { label: "Attention", value: 76 },
  { label: "Scenarios", value: 88 },
];

const DEMO_SCENARIOS = [
  "Routine du matin",
  "Demander de l'aide",
  "Retour a l'ecole",
  "Exprimer une emotion",
];

const DEMO_KPIS = {
  score: 89,
  phrases: 156,
  pictograms: 74,
  sessions: 48,
};

const DEMO_AI_COMMENT =
  "L'enfant presente une amelioration constante de ses capacites de communication. Les demandes de besoins essentiels sont exprimees de maniere autonome dans la majorite des situations observees.";

const buildWeeklyProgress = (scoreEvolution = []) => {
  if (!scoreEvolution.length) return DEMO_WEEKLY_PROGRESS;

  return [...scoreEvolution]
    .sort((left, right) => {
      const leftDate = new Date(left?.createdAt || left?.usedAt || 0).getTime();
      const rightDate = new Date(right?.createdAt || right?.usedAt || 0).getTime();
      return rightDate - leftDate;
    })
    .slice(0, 7)
    .reverse()
    .map((item, index) => ({
      label: item.createdAt || item.usedAt
        ? new Date(item.createdAt || item.usedAt).toLocaleDateString("fr-FR", { weekday: "short" })
        : weekLabels[index] || `J${index + 1}`,
      value: Number.isFinite(Number(item?.value ?? item?.score)) ? Number(item?.value ?? item?.score) : 0,
    }));
};

const buildTopWords = (patient) => {
  const words = patient?.frequentWords?.length ? patient.frequentWords : [];
  const topWords = words
    .slice(0, 5)
    .map((word) => {
      const label = typeof word === "string" ? word : word.label || word.name || word.title || "";
      const value = Number.isFinite(Number(word?.value ?? word?.count)) ? Number(word?.value ?? word?.count) : 0;
      return { label, value };
    })
    .filter((word) => word.label);
  return topWords.some((word) => word.value > 0) ? topWords : DEMO_TOP_WORDS;
};

const buildSkillData = ({ score = 0, averageSessionDuration = 0, phraseCount = 0, scenarioCount = 0 }) => {
  const skillData = [
    { label: "Communication", value: score },
    { label: "Autonomie", value: Math.min(100, Math.round(averageSessionDuration / 6)) },
    { label: "Attention", value: Math.min(100, phraseCount * 10) },
    { label: "Scenarios", value: Math.min(100, scenarioCount * 20) },
  ];
  return skillData.some((item) => item.value > 0) ? skillData : DEMO_SKILLS;
};

const chartShell = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
};

const getChildId = (child) => String(child?.id || child?._id || child?.kidId || "");

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return String(value.id || value._id || value.$oid || "");
  return "";
};

const getChildParentIds = (child) => [
  child?.parentId,
  child?.assignedParent,
  ...(Array.isArray(child?.assignedParents) ? child.assignedParents : []),
]
  .map(getEntityId)
  .filter(Boolean);

const filterChildrenForLoggedParent = (items = []) => {
  const user = getStoredUser();
  const userRole = String(user?.role || "").toUpperCase();
  if (userRole !== "PARENT") return items;

  const parentId = getEntityId(user);
  if (!parentId) return items;

  const hasParentRefs = items.some((child) => getChildParentIds(child).length > 0);
  const filtered = items.filter((child) => getChildParentIds(child).includes(parentId));
  return hasParentRefs ? filtered : items;
};

const hasProgressData = (progress) =>
  Boolean(
    progress &&
      (progress.currentScore != null ||
      progress.averageScore != null ||
      progress?.totalSessions ||
      progress?.historyCount ||
      progress?.scoreEvolution?.length ||
      progress?.recentHistory?.length ||
      progress?.topPictograms?.length ||
      progress?.assignedScenarios?.length),
  );

const normalizeScore = (value) => {
  const score = Number(value);
  return Number.isFinite(score) ? Math.round(score) : null;
};

const firstMeaningfulScore = (...values) => {
  const scores = values.map(normalizeScore).filter((score) => score !== null);
  return scores.find((score) => score > 0) ?? scores[0] ?? null;
};

const getProgressScore = (progress) => {
  if (!progress) return null;

  const latestEvolution = Array.isArray(progress.scoreEvolution)
    ? [...progress.scoreEvolution].sort((left, right) => {
        const leftDate = new Date(left?.createdAt || 0).getTime();
        const rightDate = new Date(right?.createdAt || 0).getTime();
        return rightDate - leftDate;
      })[0]
    : null;

  return firstMeaningfulScore(
    latestEvolution?.value,
    latestEvolution?.score,
    progress.scoreEvolution?.[0]?.value,
    progress.scoreEvolution?.[0]?.score,
    progress.scoreEvolution?.at?.(-1)?.value,
    progress.scoreEvolution?.at?.(-1)?.score,
    progress.recentHistory?.[0]?.score,
    progress.currentScore,
    progress.score,
    progress.averageScore,
  );
};

const normalizeChildren = (items = []) => {
  const seen = new Set();
  return items
    .map((kid) => ({
      ...kid,
      id: getChildId(kid),
      progress: null,
      score: normalizeScore(kid.score ?? kid.progressScore ?? kid.currentScore),
      frequentWords: [],
      recentPhrases: [],
    }))
    .filter((kid) => {
      const id = getChildId(kid);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

function ChildProgress() {
  const [children, setChildren] = useState([]);
  const [progressByKid, setProgressByKid] = useState({});
  const [selectedChildId, setSelectedChildId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const activeChildId = useMemo(() => {
    if (!children.length) return "";
    return children.some((child) => getChildId(child) === selectedChildId)
      ? selectedChildId
      : getChildId(children[0]);
  }, [children, selectedChildId]);
  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    return children.find((child) => getChildId(child) === activeChildId) || null;
  }, [activeChildId, children]);

  useEffect(() => {
    if (children.length && selectedChildId !== activeChildId) {
      setSelectedChildId(activeChildId);
    }
  }, [activeChildId, children.length, selectedChildId]);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const items = await listKidsApi();
        if (!isMounted) return;

        if (items.length) {
          const mapped = normalizeChildren(filterChildrenForLoggedParent(items));
          setChildren(mapped);
          setSelectedChildId((current) =>
            current && mapped.some((kid) => getChildId(kid) === current)
              ? current
              : getChildId(mapped[0]),
          );
          const rows = await Promise.all(
            mapped.map(async (kid) => {
              try {
                return { kid, progress: await getKidProgressApi(getChildId(kid)) };
              } catch (_error) {
                return { kid, progress: null };
              }
            }),
          );

          if (!isMounted) return;

          setProgressByKid(
            rows.reduce((acc, row) => {
              const kidId = getChildId(row.kid);
              if (kidId) acc[kidId] = row.progress;
              return acc;
            }, {}),
          );
        } else {
          setChildren([]);
        }
      } catch (_error) {
        if (!isMounted) return;
        setChildren([]);
        setLoadError("Impossible de charger les donnees depuis le backend.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedChildKey = activeChildId;
  const selectedProgress = selectedChildKey ? progressByKid[selectedChildKey] : null;
  const resolvedScore = getProgressScore(selectedProgress) ?? normalizeScore(selectedChild?.score) ?? DEMO_KPIS.score;
  const mergedChild = selectedChild
    ? {
        ...selectedChild,
        score: resolvedScore,
        level: normalizeLevelLabel(selectedProgress?.currentLevel || selectedChild.level),
        progress: resolvedScore,
        frequentWords:
          selectedProgress?.topPictograms?.map((item) => ({
            label: item.name || item.label || item.title || "Pictogramme",
            value: item.count || 0,
          })) || selectedChild.frequentWords,
        recentPhrases:
          selectedProgress?.recentHistory
            ?.map((item) => item.correctedText || item.generatedText || item.phraseText || item.sentence)
            .filter(Boolean) || selectedChild.recentPhrases,
      }
    : null;

  const weeklyProgress = useMemo(
    () => buildWeeklyProgress(selectedProgress?.scoreEvolution || []),
    [selectedProgress],
  );
  const topWords = useMemo(() => buildTopWords(mergedChild), [mergedChild]);
  const phrasesThisWeek = selectedProgress?.recentHistory?.length || mergedChild?.recentPhrases?.length || DEMO_KPIS.phrases;
  const completedScenarios =
    selectedProgress?.completedScenariosCount ??
    selectedProgress?.topScenarios?.reduce((sum, item) => sum + (item.count || 0), 0) ??
    null;
  const totalSessions = selectedProgress?.totalSessions || DEMO_KPIS.sessions;
  const scoreGlobal = resolvedScore || DEMO_KPIS.score;
  const scoreSummary = `${scoreGlobal}/100`;
  const topWordsLabel = topWords.length
    ? topWords
        .slice(0, 3)
        .map((word) => word.label)
        .join(", ")
    : DEMO_TOP_WORDS.slice(0, 3).map((word) => word.label).join(", ");
  const hasWeeklyData = true;
  const hasTopWords = topWords.some((word) => word.value > 0);
  const skillData = useMemo(
    () =>
      buildSkillData({
        score: scoreGlobal ?? 0,
        averageSessionDuration: selectedProgress?.averageSessionDuration || 0,
        phraseCount: phrasesThisWeek ?? 0,
        scenarioCount: selectedProgress?.assignedScenarioCount || completedScenarios,
      }),
    [completedScenarios, phrasesThisWeek, scoreGlobal, selectedProgress],
  );
  const hasSkillData = skillData.some((item) => item.value > 0);
  const assignedScenarios = selectedProgress?.assignedScenarios || [];
  const assignedScenarioCount = selectedProgress?.assignedScenarioCount ?? assignedScenarios.length;
  const masteredPictograms = topWords.reduce((sum, word) => sum + (word.value || 0), 0);
  const progressKpis = {
    score: scoreGlobal > 0 ? scoreGlobal : DEMO_KPIS.score,
    phrases: phrasesThisWeek > 0 ? phrasesThisWeek : DEMO_KPIS.phrases,
    pictograms: masteredPictograms > 0 ? masteredPictograms : DEMO_KPIS.pictograms,
    sessions: totalSessions > 0 ? totalSessions : DEMO_KPIS.sessions,
  };

  const lineData = useMemo(
    () => ({
      labels: weeklyProgress.map((item) => item.label),
      datasets: [
        {
          data: weeklyProgress.map((item) => item.value),
          borderColor: colors.slateBlue,
          backgroundColor: "rgba(92, 117, 230, 0.16)",
          borderWidth: 3,
          fill: true,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: colors.slateBlue,
          pointBorderWidth: 3,
          pointRadius: 4,
          tension: 0.4,
        },
      ],
    }),
    [weeklyProgress],
  );

  const lineOptions = {
    ...chartShell,
    plugins: {
      ...chartShell.plugins,
      tooltip: { callbacks: { label: (context) => `${context.parsed.y}%` } },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.slate, font: { weight: 700 } },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(83, 97, 121, 0.12)" },
        ticks: { color: colors.slate, callback: (value) => `${value}%` },
      },
    },
  };

  const barData = useMemo(
    () => ({
      labels: topWords.map((item) => item.label),
      datasets: [
        {
          data: topWords.map((item) => item.value),
          backgroundColor: colors.aqua,
          borderRadius: 12,
          barThickness: 18,
        },
      ],
    }),
    [topWords],
  );

  const barOptions = {
    ...chartShell,
    indexAxis: "y",
    plugins: {
      ...chartShell.plugins,
      tooltip: { callbacks: { label: (context) => `${context.parsed.x} utilisations` } },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "rgba(83, 97, 121, 0.1)" },
        ticks: { color: colors.slate },
      },
      y: {
        grid: { display: false },
        ticks: { color: colors.ink, font: { weight: 700 } },
      },
    },
  };

  const doughnutData = useMemo(
    () => ({
      labels: hasSkillData ? skillData.map((item) => item.label) : ["Aucune donnee"],
      datasets: [
        {
          data: hasSkillData ? skillData.map((item) => item.value) : [1],
          backgroundColor: hasSkillData
            ? [colors.slateBlue, colors.softBlue, colors.lilac, colors.aqua]
            : ["#e8eef6"],
          borderColor: "#ffffff",
          borderWidth: 4,
        },
      ],
    }),
    [hasSkillData, skillData],
  );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "66%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxHeight: 10,
          boxWidth: 10,
          color: colors.slate,
          padding: 14,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => (hasSkillData ? `${context.label}: ${context.parsed}%` : "Aucune donnee"),
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Card title="Progression enfant">
        <div className="rounded-[28px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          Chargement des donnees enfant depuis le backend...
        </div>
      </Card>
    );
  }

  if (!children.length) {
    return (
      <Card title="Progression enfant">
        <div className="rounded-[28px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          {loadError || "Aucun enfant ajoute pour ce parent."}
        </div>
      </Card>
    );
  }

  if (!mergedChild) {
    return (
      <Card title="Progression enfant">
        <div className="rounded-[28px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          Selection enfant indisponible. Rechargez la page pour resynchroniser la liste.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Progression enfant">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="secondary">{mergedChild.level}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {children.length > 1
                ? `${children.length} enfants lies a ce parent`
                : "Un seul enfant lie a ce parent"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              {totalSessions > 0 ? (
                <span className="rounded-full bg-slate-50 px-3 py-2">
                  {totalSessions} sessions
                </span>
              ) : null}
              {phrasesThisWeek > 0 ? (
                <span className="rounded-full bg-slate-50 px-3 py-2">
                  {phrasesThisWeek} phrases recentes
                </span>
              ) : null}
              {assignedScenarioCount > 0 ? (
                <span className="rounded-full bg-slate-50 px-3 py-2">
                  {assignedScenarioCount} scenarios assignes
                </span>
              ) : null}
            </div>
          </div>

          {children.length > 1 ? (
            <label className="w-full max-w-xs space-y-2">
              <span className="text-sm font-semibold text-ink">Choisir un enfant</span>
              <select
                className="focus-ring w-full rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm font-semibold text-ink"
                value={selectedChildKey}
                onChange={(event) => setSelectedChildId(event.target.value)}
              >
                {children.map((child) => (
                  <option key={getChildId(child)} value={getChildId(child)}>
                    {child.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Score actuel", value: `${progressKpis.score}/100` },
          { label: "Phrases creees", value: progressKpis.phrases },
          { label: "Pictogrammes maitrises", value: progressKpis.pictograms },
          { label: "Sessions terminees", value: progressKpis.sessions },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6">
        <Card title="Progression par semaine">
          <div className="h-72">
            <Line data={lineData} options={lineOptions} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Mots les plus utilises">
          <div className="h-72">
            <Bar data={barData} options={barOptions} />
          </div>
        </Card>

        <Card title="Resume visuel">
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div className="h-60">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-sm leading-7 text-slate-600">
                Score actuel: {scoreSummary}. Les mots les plus visibles cette semaine sont {topWordsLabel}.
              </p>
              <div className="mt-4 grid gap-2">
                {skillData.map((skill) => (
                  <div key={skill.label} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500">{skill.label}</span>
                    <span className="text-xs font-bold text-slateBlue">{skill.value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-slate-400">Scenarios assignes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(assignedScenarios.length ? assignedScenarios : DEMO_SCENARIOS).slice(0, 4).map((scenario) => (
                      <span
                        key={scenario._id || scenario.id || scenario.title || scenario}
                        className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        {scenario.title || scenario}
                      </span>
                    ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {mergedChild.recentPhrases?.map((phrase) => (
                  <span
                    key={phrase}
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Commentaire IA">
        <p className="text-sm leading-7 text-slate-600">{DEMO_AI_COMMENT}</p>
      </Card>
    </div>
  );
}

export default ChildProgress;
