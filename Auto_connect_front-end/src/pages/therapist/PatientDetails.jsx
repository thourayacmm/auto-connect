import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CorrectionPanel from "../../components/ai/CorrectionPanel";
import RecommendationCard from "../../components/ai/RecommendationCard";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import {
  getKidHistoryApi,
  getKidProgressApi,
  getKidRecommendationsApi,
  getKidSessionsApi,
  listKidsApi,
} from "../../services/domainApi";
import { buildKidMetrics, resolveKidScore } from "../../utils/therapistMetrics";

function PatientDetails() {
  const { id } = useParams();
  const [backendPatient, setBackendPatient] = useState(null);
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let mounted = true;
    listKidsApi()
      .then(async (items) => {
        const found = items.find((item) => item.id === id);
        if (!found || !mounted) return;
        setBackendPatient(found);
        const [progressData, historyData, recommendationData, sessionsData] = await Promise.all([
          getKidProgressApi(found.id).catch(() => null),
          getKidHistoryApi(found.id).catch(() => []),
          getKidRecommendationsApi(found.id).catch(() => []),
          getKidSessionsApi(found.id).catch(() => []),
        ]);
        if (mounted) {
          setProgress(progressData);
          setHistory(historyData);
          setRecommendations(recommendationData);
          setSessions(sessionsData);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [id]);

  const patient = backendPatient ? buildKidMetrics(backendPatient, progress, history, sessions) : null;
  const recentPhrases = useMemo(
    () =>
      history.length
        ? history.map((item) => item.correctedText || item.generatedText).filter(Boolean)
        : [],
    [history, patient],
  );
  const topWords = patient?.frequentWords || progress?.topPictograms?.map((item) => item.name || item._id) || [];
  const assignedScenarios = progress?.assignedScenarios || [];
  const sessionRows = sessions.slice(0, 4);
  const resolvedScore = resolveKidScore(patient, progress, history) ?? 0;

  if (!patient) {
    return <EmptyState title="Patient introuvable" description="Aucun patient ne correspond a cet identifiant." />;
  }

  return (
    <div className="space-y-6">
      <Card title={patient.name}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-softBlue/10 p-4">
            <p className="text-sm text-slate-500">Age</p>
            <p className="mt-2 font-display text-2xl font-bold">{patient.age} ans</p>
          </div>
          <div className="rounded-2xl bg-lilac/20 p-4">
            <p className="text-sm text-slate-500">Niveau</p>
            <p className="mt-2">
            <Badge tone="secondary">{patient.level || patient.currentLevel}</Badge>
            </p>
          </div>
          <div className="rounded-2xl bg-success/10 p-4">
            <p className="text-sm text-slate-500">Progression</p>
            <p className="mt-2 font-display text-2xl font-bold">{resolvedScore}%</p>
          </div>
          <div className="rounded-2xl bg-warning/15 p-4">
            <p className="text-sm text-slate-500">Score</p>
            <p className="mt-2 font-display text-2xl font-bold">{resolvedScore}/100</p>
          </div>
        </div>
      </Card>
      <Card title="Scenarios assignes">
        <div className="flex flex-wrap gap-2">
          {assignedScenarios.length ? (
            assignedScenarios.map((scenario) => (
              <Badge key={scenario._id || scenario.id || scenario.title} tone="secondary">
                {scenario.title}
              </Badge>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              Aucun scenario assigne a cet enfant.
            </p>
          )}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Historique des phrases">
          <div className="space-y-3">
            {recentPhrases.map((phrase) => (
              <div key={phrase} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-ink">
                {phrase}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Mots frequents">
          <div className="flex flex-wrap gap-2">
            {topWords.map((word) => (
              <Badge key={word} tone="primary">
                {word}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Dernieres sessions">
        <div className="grid gap-4 md:grid-cols-2">
          {sessionRows.length ? (
            sessionRows.map((session) => (
              <div key={session._id || session.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-ink">
                  {session.scenario?.title || "Session libre"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {session.startedAt
                    ? new Date(session.startedAt).toLocaleDateString("fr-FR")
                    : "Date non disponible"}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Score: {session.score ?? 0} - Duree: {session.duration ?? 0}s
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 md:col-span-2">
              Aucune session enregistree.
            </div>
          )}
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <RecommendationCard
          text={
            recommendations[0]?.content ||
            recommendations[0]?.title ||
            "Aucune recommandation pour le moment."
          }
        />
        <CorrectionPanel history={history} />
      </div>
    </div>
  );
}

export default PatientDetails;
