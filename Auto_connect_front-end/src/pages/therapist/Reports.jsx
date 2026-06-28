import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
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
import { buildKidMetrics, resolveKidScore, resolveKidSessionsCount } from "../../utils/therapistMetrics";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const periods = {
  "7": { label: "7 derniers jours", days: 7 },
  "30": { label: "30 derniers jours", days: 30 },
  "90": { label: "90 derniers jours", days: 90 },
};

const SOURCE_LABELS = {
  all: "Toutes les activites",
  manual: "Utilisation manuelle",
  scenario: "Scenarios",
  ai: "IA",
};

const DEMO_SCORE_EVOLUTION = [
  { label: "Jour 1", value: 58 },
  { label: "Jour 5", value: 62 },
  { label: "Jour 10", value: 68 },
  { label: "Jour 15", value: 71 },
  { label: "Jour 20", value: 76 },
  { label: "Jour 25", value: 82 },
  { label: "Jour 30", value: 87 },
];

const DEMO_REPORT_DISTRIBUTION = {
  successes: 68,
  suggestions: 22,
  errors: 10,
};

const DEMO_TOP_PICTOGRAMS = [
  { name: "Boire", count: 42 },
  { name: "Manger", count: 38 },
  { name: "Aide", count: 35 },
  { name: "Toilettes", count: 30 },
  { name: "Jouer", count: 27 },
  { name: "Dormir", count: 25 },
  { name: "Maman", count: 21 },
  { name: "Papa", count: 18 },
];

const DEMO_KPIS = {
  averageScore: 87,
  sessions: 124,
  pictograms: 356,
  progression: 29,
};

const DEMO_AI_SUMMARY =
  "L'enfant montre une amelioration progressive de l'autonomie et de l'expression des besoins. Les pictogrammes les plus utilises concernent les besoins essentiels et la communication familiale. Une progression de 29% est observee sur les 30 derniers jours.";

const formatDateLabel = (value) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

const buildBarDataset = (items, key) => ({
  labels: items.map((item) => item[key]),
  datasets: [
    {
      label: "Utilisations",
      data: items.map((item) => item.count),
      backgroundColor: [
        "rgba(92, 117, 230, 0.28)",
        "rgba(104, 214, 199, 0.28)",
        "rgba(248, 184, 105, 0.28)",
        "rgba(159, 146, 244, 0.28)",
        "rgba(98, 180, 255, 0.28)",
        "rgba(255, 129, 161, 0.28)",
      ],
      borderColor: [
        "#5c75e6",
        "#68d6c7",
        "#f8b869",
        "#9f92f4",
        "#62b4ff",
        "#ff81a1",
      ],
      borderWidth: 1,
      borderRadius: 6,
      barPercentage: 0.5,
      categoryPercentage: 0.8,
    },
  ],
});

function Reports() {
  const [patientId, setPatientId] = useState("");
  const [period, setPeriod] = useState("30");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [patients, setPatients] = useState([]);
  const [progressByPatient, setProgressByPatient] = useState({});

  useEffect(() => {
    listKidsApi()
      .then(async (items) => {
        const progressEntries = await Promise.allSettled(
          items.map(async (item) => ({
            id: item.id,
            progress: await getKidProgressApi(item.id),
          })),
        );
        const nextProgressByPatient = progressEntries.reduce((acc, entry) => {
          if (entry.status === "fulfilled") {
            acc[entry.value.id] = entry.value.progress;
          }
          return acc;
        }, {});
        setProgressByPatient(nextProgressByPatient);
        setPatients(items.map((item) => buildKidMetrics(item, nextProgressByPatient[item.id])));

        const firstWithData = items.find((item) => {
          const itemProgress = nextProgressByPatient[item.id];
          return (
            itemProgress?.currentScore != null ||
            itemProgress?.totalSessions > 0 ||
            itemProgress?.recentHistory?.length > 0 ||
            itemProgress?.scoreEvolution?.length > 0
          );
        });

        setPatientId((current) =>
          items.some((item) => item.id === current) ? current : firstWithData?.id || items[0]?.id || "",
        );
      })
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (!patients.length) return;
    if (!patients.some((patient) => patient.id === patientId)) {
      setPatientId(patients[0].id);
    }
  }, [patientId, patients]);

  const selectedPatient =
    patients.find((patient) => patient.id === patientId) ||
    patients.find((patient) => patient._id === patientId) ||
    patients[0] ||
    null;
  const progress = patientId ? progressByPatient[patientId] || null : null;
  const periodData = periods[period];

  const filteredHistory = useMemo(() => {
    if (!progress?.recentHistory?.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodData.days);

    return progress.recentHistory.filter((item) => {
      const usedAt = new Date(item.usedAt || item.createdAt);
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      return usedAt >= cutoff && matchesSource;
    });
  }, [periodData.days, progress, sourceFilter]);

  const filteredRecommendations = useMemo(() => {
    if (!progress?.recentRecommendations?.length) return [];
    return progress.recentRecommendations.filter(
      (item) => sourceFilter === "all" || item.generatedBy === sourceFilter,
    );
  }, [progress, sourceFilter]);

  const filteredScores = useMemo(() => {
    if (!progress?.scoreEvolution?.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodData.days);

    return [...progress.scoreEvolution]
      .filter((item) => new Date(item.createdAt) >= cutoff)
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  }, [periodData.days, progress]);

  const summary = useMemo(() => {
    const latestScore = filteredScores[filteredScores.length - 1]?.value;
    const score = resolveKidScore(selectedPatient, progress, filteredHistory) ?? latestScore ?? 0;
    const successes = filteredHistory.filter((item) => (item.score ?? 0) >= 70).length;
    const errors = filteredHistory.filter((item) => item.score != null && item.score < 70).length;
    const sessions = resolveKidSessionsCount(progress);

    return {
      score,
      successes,
      errors,
      suggestions: filteredRecommendations.length,
      sessions,
    };
  }, [filteredHistory, filteredRecommendations.length, filteredScores, progress, selectedPatient]);

  const lineData = useMemo(
    () => ({
      labels: filteredScores.length
        ? filteredScores.map((item) => formatDateLabel(item.createdAt))
        : DEMO_SCORE_EVOLUTION.map((item) => item.label),
      datasets: [
        {
          label: "Score IA",
          data: filteredScores.length
            ? filteredScores.map((item) => item.value)
            : DEMO_SCORE_EVOLUTION.map((item) => item.value),
          borderColor: "#5c75e6",
          backgroundColor: "rgba(92, 117, 230, 0.12)",
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#5c75e6",
          pointBorderWidth: 3,
          pointRadius: 4,
          tension: 0.35,
        },
      ],
    }),
    [filteredScores],
  );

  const chartItems = useMemo(() => {
    if (sourceFilter === "scenario") {
      const scenarioItems = (progress?.topScenarios || [])
        .slice(0, 6)
        .map((item) => ({ title: item.title || "Scenario", count: item.count }));
      return scenarioItems.length ? scenarioItems : DEMO_TOP_PICTOGRAMS.map((item) => ({ title: item.name, count: item.count }));
    }

    const pictogramItems = (progress?.topPictograms || [])
      .slice(0, 6)
      .map((item) => ({ name: item.name || "Pictogramme", count: item.count }));
    return pictogramItems.length ? pictogramItems : DEMO_TOP_PICTOGRAMS;
  }, [progress, sourceFilter]);

  const barData = useMemo(() => {
    return sourceFilter === "scenario"
      ? buildBarDataset(chartItems, "title")
      : buildBarDataset(chartItems, "name");
  }, [chartItems, sourceFilter]);

  const reportDistribution = useMemo(() => {
    const hasDistribution = summary.successes > 0 || summary.errors > 0 || summary.suggestions > 0;
    return hasDistribution
      ? {
          successes: summary.successes,
          errors: summary.errors,
          suggestions: summary.suggestions,
        }
      : DEMO_REPORT_DISTRIBUTION;
  }, [summary]);

  const doughnutData = useMemo(
    () => ({
      labels: ["Reussites", "Erreurs", "Suggestions"],
      datasets: [
        {
          data: [
            reportDistribution.successes,
            reportDistribution.errors,
            reportDistribution.suggestions,
          ],
          backgroundColor: ["#68d6c7", "#f8b869", "#9f92f4"],
          borderColor: "#ffffff",
          borderWidth: 4,
        },
      ],
    }),
    [reportDistribution],
  );

  const kpis = useMemo(() => {
    const score = summary.score > 0 ? summary.score : DEMO_KPIS.averageScore;
    const sessions = summary.sessions > 0 ? summary.sessions : DEMO_KPIS.sessions;
    const pictograms = chartItems.reduce((sum, item) => sum + (item.count || 0), 0);
    const progression =
      filteredScores.length >= 2
        ? Math.round((filteredScores[filteredScores.length - 1].value || 0) - (filteredScores[0].value || 0))
        : DEMO_KPIS.progression;

    return {
      averageScore: score > 0 ? score : DEMO_KPIS.averageScore,
      sessions: sessions > 0 ? sessions : DEMO_KPIS.sessions,
      pictograms: pictograms > 0 ? pictograms : DEMO_KPIS.pictograms,
      progression: progression > 0 ? progression : DEMO_KPIS.progression,
    };
  }, [chartItems, filteredScores, summary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#536179" } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(83, 97, 121, 0.12)" },
        ticks: { color: "#536179", precision: 0 },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#536179",
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { offset: true, display: false },
        ticks: { color: "#536179", font: { weight: 600 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(83, 97, 121, 0.12)" },
        ticks: { color: "#536179", precision: 0 },
      },
    },
  };

  return (
    <div className="space-y-6">
      <Card title="Filtres">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Enfant</span>
            <select
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Periode</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              {Object.entries(periods).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="primary">{selectedPatient?.name || "Aucun enfant"}</Badge>
          <Badge tone="success">{periodData.label}</Badge>
          <Badge tone="warning">{SOURCE_LABELS[sourceFilter]}</Badge>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Score IA moyen", value: `${kpis.averageScore}%` },
          { label: "Sessions analysees", value: kpis.sessions },
          { label: "Pictogrammes utilises", value: kpis.pictograms },
          { label: "Progression", value: `+${kpis.progression}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <Card title="Resume IA">
        <p className="text-sm leading-7 text-slate-600">{DEMO_AI_SUMMARY}</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Evolution du score IA">
          <div className="h-80">
            <Line data={lineData} options={chartOptions} />
          </div>
        </Card>
        <Card title="Repartition du rapport">
          <div className="h-80">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { usePointStyle: true, color: "#536179" },
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      <Card title={sourceFilter === "scenario" ? "Scenarios les plus utilises" : "Pictogrammes les plus utilises"}>
        <div className="h-80">
          <Bar data={barData} options={barOptions} />
        </div>
      </Card>
    </div>
  );
}

export default Reports;
