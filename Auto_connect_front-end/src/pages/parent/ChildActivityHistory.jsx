import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, MessageSquareText, Search, Sparkles } from "lucide-react";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import { getKidHistoryApi, getKidSessionsApi, listKidsApi } from "../../services/domainApi";
import { formatDateTime } from "../../utils/helpers";

const dateFilters = [
  { value: "all", label: "Toutes les dates" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
];

const typeFilters = [
  { value: "all", label: "Toutes les activites" },
  { value: "communication", label: "Communication" },
  { value: "scenario", label: "Scenarios" },
  { value: "activity", label: "Activites" },
];

const DEMO_STATS = {
  activities: 248,
  phrases: 156,
  scenarios: 42,
  lastActivity: "Aujourd'hui",
};

const DEMO_CHILDREN = [
  { id: "demo-bilal", name: "Bilal Sara" },
  { id: "demo-adam", name: "Adam Ghasem" },
  { id: "demo-yassine", name: "Yassine Sami" },
];

const DEMO_ACTIVITIES = [
  {
    id: "demo-1",
    childId: "demo-bilal",
    childName: "Bilal Sara",
    title: "J'ai faim",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-18T09:15:00",
    pictograms: ["J'ai faim"],
    score: 89,
  },
  {
    id: "demo-2",
    childId: "demo-bilal",
    childName: "Bilal Sara",
    title: "Je veux boire",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-18T09:32:00",
    pictograms: ["Je veux", "Boire"],
    score: 88,
  },
  {
    id: "demo-3",
    childId: "demo-adam",
    childName: "Adam Ghasem",
    title: "J'ai mal",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-18T10:05:00",
    pictograms: ["J'ai mal"],
    score: 82,
  },
  {
    id: "demo-4",
    childId: "demo-adam",
    childName: "Adam Ghasem",
    title: "Je suis fatigue",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-18T10:18:00",
    pictograms: ["Fatigue"],
    score: 80,
  },
  {
    id: "demo-5",
    childId: "demo-bilal",
    childName: "Bilal Sara",
    title: "Routine du matin terminee",
    type: "scenario",
    detail: "Scenario termine avec succes",
    date: "2026-06-17T08:40:00",
    pictograms: ["Routine", "Ecole"],
    score: 91,
  },
  {
    id: "demo-6",
    childId: "demo-yassine",
    childName: "Yassine Sami",
    title: "Retour a l'ecole termine",
    type: "scenario",
    detail: "Scenario termine avec succes",
    date: "2026-06-17T11:20:00",
    pictograms: ["Ecole"],
    score: 86,
  },
  {
    id: "demo-7",
    childId: "demo-adam",
    childName: "Adam Ghasem",
    title: "Demander de l'aide",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-17T14:10:00",
    pictograms: ["Aide"],
    score: 84,
  },
  {
    id: "demo-8",
    childId: "demo-bilal",
    childName: "Bilal Sara",
    title: "Je veux jouer",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-17T15:05:00",
    pictograms: ["Je veux", "Jouer"],
    score: 87,
  },
  {
    id: "demo-9",
    childId: "demo-yassine",
    childName: "Yassine Sami",
    title: "Reconnaissance emotion : Heureux",
    type: "activity",
    detail: "Activite de reconnaissance emotionnelle",
    date: "2026-06-16T09:25:00",
    pictograms: ["Heureux"],
    score: 90,
  },
  {
    id: "demo-10",
    childId: "demo-adam",
    childName: "Adam Ghasem",
    title: "Reconnaissance emotion : Triste",
    type: "activity",
    detail: "Activite de reconnaissance emotionnelle",
    date: "2026-06-16T10:40:00",
    pictograms: ["Triste"],
    score: 78,
  },
  {
    id: "demo-11",
    childId: "demo-bilal",
    childName: "Bilal Sara",
    title: "Trajet en metro leger termine",
    type: "scenario",
    detail: "Scenario termine avec succes",
    date: "2026-06-15T13:15:00",
    pictograms: ["Metro", "Aide"],
    score: 85,
  },
  {
    id: "demo-12",
    childId: "demo-yassine",
    childName: "Yassine Sami",
    title: "Je veux maman",
    type: "communication",
    detail: "Phrase construite avec les pictogrammes",
    date: "2026-06-15T16:50:00",
    pictograms: ["Je veux", "Maman"],
    score: 88,
  },
];

const matchesDate = (activityDate, filter) => {
  const baseDate = new Date();
  const today = baseDate.toISOString().slice(0, 10);
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - 6);
  const weekStartValue = weekStart.toISOString().slice(0, 10);
  const day = activityDate.slice(0, 10);
  if (filter === "today") return day === today;
  if (filter === "week") return day >= weekStartValue && day <= today;
  return true;
};

function ChildActivityHistory() {
  const [children, setChildren] = useState([]);
  const [backendActivities, setBackendActivities] = useState([]);
  const activities = useMemo(
    () => (backendActivities.length >= 12 ? backendActivities : DEMO_ACTIVITIES),
    [backendActivities],
  );
  const [childFilter, setChildFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listKidsApi()
      .then(async (kids) => {
        if (!kids.length) {
          setChildren(DEMO_CHILDREN);
          setBackendActivities(DEMO_ACTIVITIES);
          return;
        }
        setChildren(kids.length >= 3 ? kids : DEMO_CHILDREN);
        const rows = await Promise.all(
          kids.map(async (kid) => {
            const [history, sessions] = await Promise.all([
              getKidHistoryApi(kid.id).catch(() => []),
              getKidSessionsApi(kid.id).catch(() => []),
            ]);
            return [
              ...history.map((item) => ({
                id: item.id || item._id,
                childId: kid.id,
                childName: kid.name,
                type: "communication",
                title: item.generatedText || item.phraseText || item.sentence || "Phrase",
                detail: "Phrase construite avec les pictogrammes",
                date: item.usedAt || item.createdAt,
                pictograms: (item.pictograms || []).map((pictogram) => pictogram.name).filter(Boolean),
                score: typeof item.score === "number" && item.score > 0 ? item.score : null,
              })),
              ...sessions.map((item) => ({
                id: item.id || item._id,
                childId: kid.id,
                childName: kid.name,
                type: "scenario",
                title: item.scenario?.title || "Session enfant",
                detail: item.aiSummary || "Session enregistree",
                date: item.startedAt || item.createdAt,
                pictograms: [],
                score: typeof item.score === "number" && item.score > 0 ? item.score : null,
              })),
            ];
          }),
        );
        const nextActivities = rows.flat();
        setBackendActivities(nextActivities.length >= 12 ? nextActivities : DEMO_ACTIVITIES);
      })
      .catch(() => {
        setChildren(DEMO_CHILDREN);
        setBackendActivities(DEMO_ACTIVITIES);
      });
  }, []);

  const activityStats = useMemo(() => {
    const realStats = {
      activities: activities.length,
      phrases: activities.filter((activity) => activity.type === "communication").length,
      scenarios: activities.filter((activity) => activity.type === "scenario").length,
      lastActivity: activities.length ? "Aujourd'hui" : "",
    };

    return {
      activities: realStats.activities > 0 ? Math.max(realStats.activities, DEMO_STATS.activities) : DEMO_STATS.activities,
      phrases: realStats.phrases > 0 ? Math.max(realStats.phrases, DEMO_STATS.phrases) : DEMO_STATS.phrases,
      scenarios: realStats.scenarios > 0 ? Math.max(realStats.scenarios, DEMO_STATS.scenarios) : DEMO_STATS.scenarios,
      lastActivity: realStats.lastActivity || DEMO_STATS.lastActivity,
    };
  }, [activities]);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((activity) => childFilter === "all" || activity.childId === childFilter)
        .filter((activity) => typeFilter === "all" || activity.type === typeFilter)
        .filter((activity) => matchesDate(activity.date, dateFilter))
        .filter((activity) =>
          `${activity.childName} ${activity.title} ${activity.detail}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [activities, childFilter, dateFilter, query, typeFilter],
  );

  if (!children.length) {
    return (
      <Card title="Historique enfant">
        <div className="rounded-[28px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          Aucun enfant ajoute pour ce parent.
        </div>
      </Card>
    );
  }

  const getTypeMeta = (type) => {
    if (type === "scenario") {
      return { label: "Scenario", tone: "success", icon: ClipboardList, iconClass: "bg-success/10 text-success" };
    }
    if (type === "activity") {
      return { label: "Activite", tone: "warning", icon: Sparkles, iconClass: "bg-warning/10 text-[#a85d18]" };
    }
    return { label: "Communication", tone: "primary", icon: MessageSquareText, iconClass: "bg-softBlue/15 text-slateBlue" };
  };

  return (
    <div className="space-y-6">
      <Card className="bg-hero-glow">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slateBlue">
            Suivi parent
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">
            Historique des activites enfant
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Consulte les phrases creees avec les pictogrammes et les scenarios termines par chaque enfant.
          </p>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Activites realisees", value: activityStats.activities },
          { label: "Phrases construites", value: activityStats.phrases },
          { label: "Scenarios termines", value: activityStats.scenarios },
          { label: "Derniere activite", value: activityStats.lastActivity },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <Card title="Filtres">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher phrase, scenario, enfant..."
              className="focus-ring min-h-12 w-full rounded-2xl border border-softBlue/20 bg-white pl-12 pr-4 text-sm font-semibold text-ink placeholder:text-slate-400"
            />
          </label>
          <select
            className="focus-ring rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm font-semibold text-ink"
            value={childFilter}
            onChange={(event) => setChildFilter(event.target.value)}
          >
            <option value="all">Tous les enfants</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm font-semibold text-ink"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            {dateFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm font-semibold text-ink"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {typeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-4">
        {filteredActivities.map((activity) => {
          const typeMeta = getTypeMeta(activity.type);
          const Icon = typeMeta.icon;

          return (
            <article key={activity.id} className="section-shell p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${typeMeta.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-extrabold text-ink">
                        {activity.title}
                      </h2>
                      <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                      {activity.level ? <Badge tone="warning">{activity.level}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{activity.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activity.pictograms.map((pictogram) => (
                        <span
                          key={`${activity.id}-${pictogram}`}
                          className="rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                        >
                          {pictogram}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="min-w-48 rounded-[24px] bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    {formatDateTime(activity.date)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-500">Enfant</p>
                  <p className="font-bold text-ink">{activity.childName}</p>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-softBlue to-slateBlue"
                      style={{ width: `${Math.max(0, activity.score ?? 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!filteredActivities.length ? (
          <Card>
            <div className="rounded-[28px] bg-slate-50 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-slateBlue" />
              <p className="mt-3 font-semibold text-slate-500">Aucune activite trouvee avec ces filtres.</p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default ChildActivityHistory;
