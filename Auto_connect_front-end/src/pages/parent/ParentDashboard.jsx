import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import RoleOverview from "../../components/common/RoleOverview";
import ActivityCard from "../../components/dashboard/ActivityCard";
import {
  CategoryDoughnutChart,
  TrendLineChart,
} from "../../components/dashboard/PlatformAnalyticsChart";
import {
  getKidProgressApi,
  listKidsApi,
} from "../../services/domainApi";

const DEMO_WEEKLY_DATA = [
  { label: "Lundi", value: 55 },
  { label: "Mardi", value: 60 },
  { label: "Mercredi", value: 65 },
  { label: "Jeudi", value: 70 },
  { label: "Vendredi", value: 75 },
  { label: "Samedi", value: 82 },
  { label: "Dimanche", value: 88 },
];

const DEMO_MONTHLY_DATA = [
  { label: "S1", value: 63 },
  { label: "S2", value: 71 },
  { label: "S3", value: 80 },
  { label: "S4", value: 88 },
];

const DEMO_COMPETENCE_DATA = [
  { label: "Phrases", value: 40 },
  { label: "Pictogrammes", value: 35 },
  { label: "Recommandations IA", value: 25 },
];

const DEMO_KPIS = {
  globalScore: 88,
  masteredPictograms: 74,
  sessions: 132,
  monthlyProgress: 18,
};

const DEMO_ACTIVITIES = [
  { id: "demo-faim", title: "Phrase construite", subtitle: "J'ai faim", meta: "18/06/2026" },
  { id: "demo-jouer", title: "Phrase construite", subtitle: "Je veux jouer", meta: "18/06/2026" },
  { id: "demo-mal", title: "Phrase construite", subtitle: "J'ai mal", meta: "17/06/2026" },
  { id: "demo-fatigue", title: "Phrase construite", subtitle: "Je suis fatigue", meta: "17/06/2026" },
  { id: "demo-routine", title: "Activite terminee", subtitle: "Routine du matin", meta: "16/06/2026" },
  { id: "demo-retour-ecole", title: "Activite terminee", subtitle: "Retour a l'ecole", meta: "15/06/2026" },
];

const DEMO_AI_SUMMARY =
  "L'enfant montre une amelioration constante de ses capacites de communication. Les besoins essentiels sont exprimes de maniere autonome dans 82% des situations observees. Une progression significative est constatee dans la construction de phrases simples.";

const ACQUIRED_SKILLS = [
  "Demander de l'aide",
  "Exprimer la faim",
  "Exprimer la douleur",
  "Identifier ses emotions",
  "Construire une phrase simple",
];

const hasUsefulValues = (items = []) => items.some((item) => Number(item?.value || 0) > 0);

const buildWeekSeries = (scoreEvolution = []) => {
  if (!scoreEvolution.length) {
    return DEMO_WEEKLY_DATA;
  }

  return [...scoreEvolution]
    .slice(0, 7)
    .reverse()
    .map((item, index) => ({
      label: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("fr-FR", { weekday: "short" })
        : `J${index + 1}`,
      value: item.value || 0,
    }));
};

const buildMonthSeries = (scoreEvolution = []) => {
  if (!scoreEvolution.length) {
    return DEMO_MONTHLY_DATA;
  }

  const ordered = [...scoreEvolution].reverse();
  const groups = Array.from({ length: 4 }, (_, index) => {
    const slice = ordered.slice(index * 2, index * 2 + 2);
    const average = slice.length
      ? slice.reduce((sum, item) => sum + (item.value || 0), 0) / slice.length
      : 0;
    return { label: `S${index + 1}`, value: Math.round(average) };
  });

  return groups;
};

function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedProgress, setSelectedProgress] = useState(null);

  useEffect(() => {
    listKidsApi()
      .then(async (items) => {
        setChildren(items);
        if (items.length) {
          const progressRows = await Promise.all(
            items.map(async (item) => {
              try {
                return { child: item, progress: await getKidProgressApi(item.id) };
              } catch (_error) {
                return { child: item, progress: null };
              }
            }),
          );
          const bestRow =
            progressRows.find(
              ({ progress }) =>
                progress?.recentHistory?.length ||
                progress?.scoreEvolution?.length ||
                progress?.topPictograms?.length ||
                progress?.assignedScenarios?.length,
            ) ||
            progressRows[0];
          setChildren(bestRow ? [bestRow.child, ...items.filter((item) => item.id !== bestRow.child.id)] : items);
          setSelectedProgress(bestRow?.progress || null);
        }
      })
      .catch(() => setChildren([]));
  }, []);

  const weeklyData = useMemo(() => {
    const data = buildWeekSeries(selectedProgress?.scoreEvolution || []);
    return hasUsefulValues(data) ? data : DEMO_WEEKLY_DATA;
  }, [selectedProgress]);
  const monthlyData = useMemo(() => {
    const data = buildMonthSeries(selectedProgress?.scoreEvolution || []);
    return hasUsefulValues(data) ? data : DEMO_MONTHLY_DATA;
  }, [selectedProgress]);
  const recentActivities = useMemo(() => {
    const activities = selectedProgress?.recentHistory?.slice(0, 6) || [];
    if (!activities.length) return DEMO_ACTIVITIES;

    return activities.map((activity) => ({
      id: activity._id || activity.id,
      title: activity.source === "scenario" ? "Activite terminee" : "Phrase construite",
      subtitle: activity.correctedText || activity.generatedText || "Activite enfant enregistree",
      meta: activity.usedAt
        ? new Date(activity.usedAt).toLocaleDateString("fr-FR")
        : "Recemment",
    }));
  }, [selectedProgress]);
  const parentAnalysis = useMemo(() => {
    const data = [
      { label: "Phrases", value: selectedProgress?.recentHistory?.length || 0 },
      { label: "Pictogrammes", value: selectedProgress?.topPictograms?.reduce((sum, item) => sum + (item.count || 0), 0) || 0 },
      { label: "Recommandations IA", value: selectedProgress?.recentRecommendations?.length || 0 },
    ].filter((item) => item.value > 0);
    return data.length ? data : DEMO_COMPETENCE_DATA;
  }, [selectedProgress]);

  const kpis = useMemo(() => {
    const latestScore = weeklyData.at(-1)?.value || 0;
    const firstScore = weeklyData[0]?.value || 0;
    const masteredPictograms = selectedProgress?.topPictograms?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    const sessions = selectedProgress?.activityCount || selectedProgress?.totalSessions || selectedProgress?.historyCount || 0;
    const monthlyProgress = latestScore - firstScore;

    return {
      globalScore: latestScore > 0 ? latestScore : DEMO_KPIS.globalScore,
      masteredPictograms: masteredPictograms > 0 ? masteredPictograms : DEMO_KPIS.masteredPictograms,
      sessions: sessions > 0 ? sessions : DEMO_KPIS.sessions,
      monthlyProgress: monthlyProgress > 0 ? monthlyProgress : DEMO_KPIS.monthlyProgress,
    };
  }, [selectedProgress, weeklyData]);

  return (
    <div className="space-y-6">
      <RoleOverview
        title="Espace parent"
        description="Le parent suit les progres de son enfant, prepare les routines de communication et ajuste les parametres de l'interface enfant."
        items={[
          { title: "Session enfant", text: "Ouvrir l'espace de communication adapte." },
          { title: "Parametres", text: "Changer la grille, la voix et les couleurs." },
          { title: "Assistant IA", text: "Recevoir des conseils pratiques au quotidien." },
          { title: "Progression", text: "Lire les scores, mots frequents et activites recentes." },
        ]}
        accent="bg-peach/30"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Score global", value: `${kpis.globalScore}%` },
          { label: "Pictogrammes maitrises", value: kpis.masteredPictograms },
          { label: "Sessions realisees", value: kpis.sessions },
          { label: "Progression mensuelle", value: `+${kpis.monthlyProgress}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Evolution des progres">
          <TrendLineChart weeklyData={weeklyData} monthlyData={monthlyData} />
        </Card>
        <Card title="Repartition des competences">
          <CategoryDoughnutChart analysisData={parentAnalysis} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Analyse IA">
          <p className="text-sm leading-7 text-slate-600">{DEMO_AI_SUMMARY}</p>
        </Card>
        <Card title="Competences acquises">
          <div className="grid gap-3">
            {ACQUIRED_SKILLS.map((skill) => (
              <div key={skill} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-ink">{skill}</span>
                <span className="text-sm font-bold text-success">✓</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card title="Activite recente">
          <div className="grid gap-4 md:grid-cols-2">
            {recentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                title={activity.title}
                subtitle={activity.subtitle}
                meta={activity.meta}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ParentDashboard;
