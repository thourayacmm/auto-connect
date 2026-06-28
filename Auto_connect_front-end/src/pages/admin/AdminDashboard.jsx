import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import Card from "../../components/common/Card";
import RoleOverview from "../../components/common/RoleOverview";
import ActivityCard from "../../components/dashboard/ActivityCard";
import {
  CategoryDoughnutChart,
  TrendLineChart,
} from "../../components/dashboard/PlatformAnalyticsChart";
import { getGlobalAnalyticsApi } from "../../services/domainApi";

const DEMO_WEEKLY_DATA = [
  { label: "sam.", value: 12 },
  { label: "dim.", value: 18 },
  { label: "lun.", value: 25 },
  { label: "mar.", value: 32 },
  { label: "mer.", value: 28 },
  { label: "jeu.", value: 41 },
  { label: "ven.", value: 55 },
];

const DEMO_MONTHLY_DATA = [
  { label: "S1", value: 34 },
  { label: "S2", value: 48 },
  { label: "S3", value: 63 },
  { label: "S4", value: 87 },
];

const DEMO_CATEGORY_DATA = [
  { label: "Actions", value: 18 },
  { label: "Besoins essentiels", value: 15 },
  { label: "Emotions", value: 12 },
  { label: "Nourriture", value: 14 },
  { label: "Activites", value: 11 },
  { label: "Famille", value: 10 },
  { label: "Ecole", value: 8 },
  { label: "Sante", value: 7 },
  { label: "Transport", value: 5 },
];

const DEMO_RECENT_ACTIVITIES = [
  { id: "demo-session-yassine", title: "Session enfant", subtitle: "Yassine Sami", meta: "12/06/2026" },
  { id: "demo-session-ahmed", title: "Session enfant", subtitle: "Ahmed Ben Ali", meta: "11/06/2026" },
  { id: "demo-pictogram-boire", title: 'Ajout pictogramme "Boire"', subtitle: "Base pictogrammes", meta: "11/06/2026" },
  { id: "demo-therapist-validation", title: "Validation therapeute", subtitle: "Sarah Trabelsi", meta: "10/06/2026" },
  { id: "demo-access-request", title: "Nouvelle demande d'acces", subtitle: "Compte en attente", meta: "10/06/2026" },
];

const hasUsefulValues = (items = []) => items.some((item) => Number(item?.value || item?.count || 0) > 0);

function AdminDashboard() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    getGlobalAnalyticsApi()
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  const weeklyData = useMemo(() => {
    const data = overview?.sessionTrend?.weekly || [];
    return hasUsefulValues(data) ? data : DEMO_WEEKLY_DATA;
  }, [overview]);

  const monthlyData = useMemo(() => {
    const data = overview?.sessionTrend?.monthly || [];
    return hasUsefulValues(data) ? data : DEMO_MONTHLY_DATA;
  }, [overview]);

  const analysisData = useMemo(() => {
    const data = (overview?.pictogramsByCategory || [])
      .map((item) => ({
        label: item.name || "Sans categorie",
        value: item.count || 0,
      }))
      .filter((item) => item.value > 0);

    return data.length ? data : DEMO_CATEGORY_DATA;
  }, [overview]);

  const recentSessionsByChild = useMemo(() => {
    const seenKids = new Set();
    return (overview?.recentSessions || []).filter((session) => {
      const kidKey = session.kid?._id || session.kid?.id || `${session.kid?.firstName || ""}-${session.kid?.lastName || ""}`;
      if (!kidKey || seenKids.has(kidKey)) return false;
      seenKids.add(kidKey);
      return true;
    });
  }, [overview]);

  const recentActivities = useMemo(() => {
    const realActivities = recentSessionsByChild.slice(0, 5).map((session) => ({
      id: session._id || session.id,
      title: "Session enfant",
      subtitle: `${session.kid?.firstName || "Enfant"} ${session.kid?.lastName || ""}`.trim(),
      meta: session.startedAt ? new Date(session.startedAt).toLocaleDateString("fr-FR") : "Recemment",
    }));

    return realActivities.length ? realActivities : DEMO_RECENT_ACTIVITIES;
  }, [recentSessionsByChild]);

  const roleCounts = useMemo(
    () =>
      (overview?.usersByRole || []).reduce((acc, item) => {
        acc[item._id] = item.count || 0;
        return acc;
      }, {}),
    [overview],
  );

  const hasRealOverviewCounts = Boolean(
    overview &&
      [
        overview.totalPictograms,
        overview.totalCategories,
        overview.totalUserAccounts,
        overview.pictograms,
        overview.categories,
        overview.users,
      ].some((value) => Number(value || 0) > 0),
  );

  const demoCounters = {
    pictograms: 420,
    categories: 12,
    roles: 5,
    users: 48,
    therapists: 12,
    parents: 35,
    admins: 1,
    criticalAlerts: 0,
    loginsToday: 3,
  };

  const counters = hasRealOverviewCounts
    ? {
        pictograms: overview.totalPictograms ?? overview.pictograms ?? demoCounters.pictograms,
        categories: overview.totalCategories ?? overview.categories ?? demoCounters.categories,
        roles: Math.max(Object.values(roleCounts).filter((count) => count > 0).length, 1),
        users: overview.totalUserAccounts ?? overview.users ?? demoCounters.users,
        therapists: roleCounts.therapist ?? 0,
        parents: roleCounts.parent ?? 0,
        admins: roleCounts.admin ?? 0,
        criticalAlerts: 0,
        loginsToday: Math.max(overview.totalSessions ?? overview.sessions ?? 0, 0),
      }
    : demoCounters;

  return (
    <div className="space-y-6">
      <RoleOverview
        title="Espace administrateur"
        items={[
          {
            title: "Base globale",
            text: `${counters.pictograms} pictogrammes, ${counters.categories} categories partagees.`,
          },
          {
            title: "Permissions",
            text: `${counters.roles} roles actifs avec droits controles par profil.`,
          },
          {
            title: "Utilisateurs",
            text: `${counters.users} utilisateurs, ${counters.therapists} therapeutes, ${counters.parents} parents, ${counters.admins} administrateur.`,
          },
          {
            title: "Securite",
            text: `${counters.criticalAlerts} alerte critique, ${counters.loginsToday} connexions aujourd'hui.`,
          },
        ]}
        accent="bg-lilac/20"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Tendance plateforme">
          <TrendLineChart
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            valueSuffix=""
            lineLabelWeek="Sessions sur 7 jours"
            lineLabelMonth="Sessions sur 4 semaines"
            yTickFormatter={(value) => `${value}`}
            tooltipFormatter={(value) => `${value} session(s)`}
          />
        </Card>
        <Card title="Analyse par categorie">
          <CategoryDoughnutChart analysisData={analysisData} />
        </Card>
      </div>

      <div>
        <Card title="Activite recente" icon={Activity}>
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

export default AdminDashboard;
