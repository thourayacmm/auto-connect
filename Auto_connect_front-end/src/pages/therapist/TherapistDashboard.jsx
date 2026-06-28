import { useEffect, useMemo, useState } from "react";
import { Activity, Users } from "lucide-react";
import Card from "../../components/common/Card";
import RoleOverview from "../../components/common/RoleOverview";
import ActivityCard from "../../components/dashboard/ActivityCard";
import {
  CategoryDoughnutChart,
  TrendLineChart,
} from "../../components/dashboard/PlatformAnalyticsChart";
import {
  getDashboardAnalyticsApi,
  getKidProgressApi,
  listKidsApi,
  listScenariosApi,
} from "../../services/domainApi";
import { buildKidMetrics } from "../../utils/therapistMetrics";

const groupAverageByLabel = (rows, labels) =>
  labels.map((label) => {
    const matches = rows.filter((item) => item.label === label);
    const value = matches.length
      ? Math.round(matches.reduce((sum, item) => sum + item.value, 0) / matches.length)
      : 0;
    return { label, value };
  });

const firstResolvedNumber = (...values) => {
  const numbers = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return numbers.find((value) => value > 0) ?? numbers[0] ?? 0;
};

const normalizeActivityKey = (activity) =>
  `${String(activity?.title || "").trim().toLowerCase()}|${String(activity?.subtitle || "")
    .trim()
    .toLowerCase()}|${String(activity?.meta || "").trim().toLowerCase()}`;

function TherapistDashboard() {
  const [patients, setPatients] = useState([]);
  const [overview, setOverview] = useState(null);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [progressByKid, setProgressByKid] = useState({});
  const safeOverview = overview || {};

  useEffect(() => {
    getDashboardAnalyticsApi()
      .then((data) => {
        setOverview(data);
      })
      .catch(() => {
        setOverview(null);
      });

    listKidsApi()
      .then(async (items) => {
        const progressEntries = await Promise.allSettled(
          items.map(async (kid) => ({
            kid,
            progress: await getKidProgressApi(kid.id),
          })),
        );

        const nextProgressMap = progressEntries.reduce((acc, entry) => {
          if (entry.status === "fulfilled") {
            acc[entry.value.kid.id] = entry.value.progress;
          }
          return acc;
        }, {});

        setProgressByKid(nextProgressMap);
        setPatients(items.map((kid) => buildKidMetrics(kid, nextProgressMap[kid.id])));

        const activityRows = items.flatMap((kid) => {
          const progress = nextProgressMap[kid.id];
          if (!progress) return [];

          const latestHistory = progress?.recentHistory?.[0];
          const latestRecommendation = progress?.recentRecommendations?.[0];

          return [
            latestHistory
              ? {
                  id: `${kid.id}-history-${latestHistory._id || latestHistory.id || "latest"}`,
                  title: kid.name,
                  subtitle:
                    latestHistory.correctedText ||
                    latestHistory.generatedText ||
                    "Phrase enfant enregistree",
                  meta: latestHistory.usedAt
                    ? new Date(latestHistory.usedAt).toLocaleDateString("fr-FR")
                    : "Recemment",
                  date: latestHistory.usedAt || latestHistory.createdAt || null,
                }
              : null,
            latestRecommendation
              ? {
                  id: `${kid.id}-rec-${latestRecommendation._id || latestRecommendation.id || "latest"}`,
                  title: `Reco pour ${kid.firstName || kid.name}`,
                  subtitle: latestRecommendation.title || latestRecommendation.content,
                  meta: latestRecommendation.createdAt
                    ? new Date(latestRecommendation.createdAt).toLocaleDateString("fr-FR")
                    : "Recemment",
                  date: latestRecommendation.createdAt || null,
                }
              : null,
          ].filter(Boolean);
        });

        const uniqueActivities = activityRows
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          .reduce((acc, activity) => {
            const key = normalizeActivityKey(activity);
            if (!acc.seen.has(key)) {
              acc.seen.add(key);
              acc.rows.push(activity);
            }
            return acc;
          }, { seen: new Set(), rows: [] }).rows;

        setRecentActivities(uniqueActivities.slice(0, 4));
      })
      .catch(() => setPatients([]));

    listScenariosApi()
      .then((items) => setScenarioCount(items.length))
      .catch(() => setScenarioCount(0));
  }, []);

  const aggregateStats = useMemo(() => {
    const scoreValues = patients
      .map((item) => Number(item.score))
      .filter((value) => Number.isFinite(value));

    return {
      trackedKids: patients.length,
      sessionsCount: patients.reduce((sum, item) => sum + (item.sessionsCount || 0), 0),
      historyCount: Object.values(progressByKid).reduce((sum, progress) => sum + (progress?.historyCount || 0), 0),
      averageScore: scoreValues.length
        ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
        : null,
    };
  }, [patients, progressByKid]);

  const weeklyData = useMemo(() => {
    const labels = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
    const rows = Object.values(progressByKid).flatMap((progress) =>
      (progress?.scoreEvolution || []).slice(0, 7).map((item, index) => ({
        label: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("fr-FR", { weekday: "short" }).toLowerCase()
          : labels[index],
        value: item.value || 0,
      })),
    );

    return groupAverageByLabel(rows, labels);
  }, [progressByKid]);

  const monthlyData = useMemo(() => {
    const labels = ["S1", "S2", "S3", "S4"];
    const rows = Object.values(progressByKid).flatMap((progress) => {
      const ordered = [...(progress?.scoreEvolution || [])].reverse();
      return labels.map((label, index) => {
        const slice = ordered.slice(index * 2, index * 2 + 2);
        const value = slice.length
          ? Math.round(slice.reduce((sum, item) => sum + (item.value || 0), 0) / slice.length)
          : 0;
        return { label, value };
      });
    });

    return groupAverageByLabel(rows, labels);
  }, [progressByKid]);

  const analysisData = useMemo(() => {
    const assignedScenarioCount = Object.values(progressByKid).reduce(
      (sum, progress) => sum + (progress?.assignedScenarioCount || 0),
      0,
    );

    return [
      { label: "Patients", value: firstResolvedNumber(aggregateStats.trackedKids, safeOverview.trackedKids) },
      { label: "Sessions", value: firstResolvedNumber(aggregateStats.sessionsCount, safeOverview.sessionsCount) },
      { label: "Phrases", value: firstResolvedNumber(aggregateStats.historyCount, safeOverview.historyCount) },
      { label: "Scenarios", value: assignedScenarioCount || scenarioCount },
    ].filter((item) => item.value > 0);
  }, [aggregateStats, progressByKid, safeOverview, scenarioCount]);

  const enrichedPatients = useMemo(() => patients, [patients]);

  return (
    <div className="space-y-6">
      <RoleOverview
        title="Espace therapeute"
        description="Le therapeute consulte le tableau de bord, gere les comptes patients, cree les scenarios et niveaux d'entrainement, puis suit les progres avec l'appui de l'IA."
        items={[
          { title: "Patients", text: "Creer, consulter et mettre a jour les comptes patients." },
          { title: "Scenarios et niveaux", text: "Structurer les activites d'entrainement selon l'age et la complexite." },
          { title: "Pictogrammes", text: "Gerer les pictogrammes et categories utilises en seance." },
          { title: "Suivi et justification", text: "Observer les progres et motiver les demandes de changement d'acces." },
        ]}
        ctaLabel="Voir les patients"
        ctaTo="/therapist/patients"
        accent="bg-success/10"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Tendance des progres">
          <TrendLineChart weeklyData={weeklyData} monthlyData={monthlyData} />
        </Card>
        <Card title="Analyse par categorie">
          <CategoryDoughnutChart analysisData={analysisData.length ? analysisData : [{ label: "Aucune donnee", value: 1 }]} />
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card title="Patients recents" icon={Users}>
          <div className="grid gap-4 md:grid-cols-2">
            {enrichedPatients.map((patient) => (
              <ActivityCard
                key={patient.id}
                title={patient.name}
                subtitle={`${patient.level || patient.currentLevel || "Niveau non defini"} - ${patient.age || "-"} ans`}
                meta={`${patient.parentName || "Parent non lie"} - Score ${
                  typeof patient.score === "number" ? `${patient.score}%` : "non disponible"
                } - ${patient.sessionsCount || patient.assignedScenarioCount || 0} session(s)`}
              />
            ))}
          </div>
        </Card>
        <Card title="Activite therapeutique" icon={Activity}>
          <div className="space-y-4">
            {recentActivities.length ? (
              recentActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  meta={activity.meta}
                />
              ))
            ) : (
              <ActivityCard
                title="Aucune activite recente"
                subtitle="Les activites recentes du therapeute apparaitront ici des que les enfants auront de l'historique."
                meta="Temps reel"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default TherapistDashboard;
