import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CirclePlay, ListChecks, RotateCcw, Volume2 } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import PictogramGrid from "../../components/pictograms/PictogramGrid";
import { calculateScore } from "../../services/aiApi";
import {
  createHistoryApi,
  endSessionApi,
  listPictogramsApi,
  listScenariosApi,
  startSessionApi,
} from "../../services/domainApi";
import { getStoredUser, speakText } from "../../utils/helpers";

const levelRank = (level = "") => {
  const normalized = level.toLowerCase();
  if (normalized.includes("avanc")) return 3;
  if (normalized.includes("inter")) return 2;
  return 1;
};

const findPictogram = (label) => ({
    id: `scenario-${label}`,
    label,
    category: "Scenario",
    icon: "Sparkles",
    color: "#d7f4ff",
  });

const DEMO_SCENARIOS = [
  {
    id: "demo-demander-a-manger",
    title: "Demander a manger",
    level: "Debutant",
    description: "L'enfant apprend a construire la phrase \"Je veux manger\".",
    childGoal: "Construire une demande simple pour exprimer la faim.",
    progress: 35,
    steps: ["Je veux", "Manger"],
    pictograms: [
      { id: "demo-je-veux", label: "Je veux", category: "Scenario", icon: "Sparkles", color: "#d7f4ff" },
      { id: "demo-manger", label: "Manger", category: "Nourriture", icon: "Utensils", color: "#fff4bf" },
    ],
  },
  {
    id: "demo-aller-aux-toilettes",
    title: "Aller aux toilettes",
    level: "Debutant",
    description: "L'enfant apprend a exprimer le besoin d'aller aux toilettes.",
    childGoal: "Identifier et communiquer un besoin essentiel.",
    progress: 45,
    steps: ["Je veux", "Toilettes"],
    pictograms: [
      { id: "demo-je-veux-toilettes", label: "Je veux", category: "Scenario", icon: "Sparkles", color: "#d7f4ff" },
      { id: "demo-toilettes", label: "Toilettes", category: "Besoins essentiels", icon: "Toilet", color: "#d7f4ff" },
    ],
  },
  {
    id: "demo-dire-une-emotion",
    title: "Dire une emotion",
    level: "Debutant",
    description: "L'enfant apprend a dire \"Je suis content\".",
    childGoal: "Exprimer une emotion positive avec une phrase simple.",
    progress: 25,
    steps: ["Je suis", "Content"],
    pictograms: [
      { id: "demo-je-suis", label: "Je suis", category: "Scenario", icon: "Sparkles", color: "#d7f4ff" },
      { id: "demo-content", label: "Content", category: "Emotions", icon: "Laugh", color: "#efe4ff" },
    ],
  },
];

const SCENARIO_SESSION_STATE_KEY = "auto-connect-training-scenario-state";

const loadScenarioSessionState = () => {
  try {
    const raw = sessionStorage.getItem(SCENARIO_SESSION_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_error) {
    sessionStorage.removeItem(SCENARIO_SESSION_STATE_KEY);
    return {};
  }
};

const saveScenarioSessionState = (state) => {
  sessionStorage.setItem(SCENARIO_SESSION_STATE_KEY, JSON.stringify(state));
};

const clearScenarioSessionState = () => {
  sessionStorage.removeItem(SCENARIO_SESSION_STATE_KEY);
};

function TrainingScenarios() {
  const [pictograms, setPictograms] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const childUser = getStoredUser();
  const childLevel = childUser?.currentLevel || "Debutant";
  const restoredState = useMemo(loadScenarioSessionState, []);

  useEffect(() => {
    listPictogramsApi()
      .then((items) => {
        setPictograms(items);
      })
      .catch(() => setPictograms([]));

    listScenariosApi({ isActive: "true", ...(childUser?.age ? { age: childUser.age } : {}) })
      .then((items) => {
        setScenarios(items);
      })
      .catch(() => setScenarios([]));
  }, []);

  const displayScenarios = scenarios.length ? scenarios : DEMO_SCENARIOS;
  const availableScenarios = useMemo(
    () => displayScenarios.filter((scenario) => levelRank(scenario.level) <= levelRank(childLevel)),
    [childLevel, displayScenarios],
  );
  const [selectedId, setSelectedId] = useState(restoredState.selectedId || null);
  const [started, setStarted] = useState(Boolean(restoredState.started));
  const [answer, setAnswer] = useState(Array.isArray(restoredState.answer) ? restoredState.answer : []);
  const [sessionId, setSessionId] = useState(null);
  const [resultSaved, setResultSaved] = useState(Boolean(restoredState.resultSaved));
  const [isValidating, setIsValidating] = useState(false);

const availableScenarioIds = useMemo(
  () => availableScenarios.map((scenario) => scenario.id).join(","),
  [availableScenarios],
);

useEffect(() => {
  if (!availableScenarios.length) return;
  if (selectedId && availableScenarios.some((scenario) => scenario.id === selectedId)) return;

  setSelectedId(availableScenarios[0].id);
  setStarted(false);
  setAnswer([]);
  setResultSaved(false);
  setIsValidating(false);
  clearScenarioSessionState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [availableScenarioIds, selectedId]);

  const selected =
    availableScenarios.find((scenario) => scenario.id === selectedId) ||
    availableScenarios[0] ||
    scenarios[0] ||
    {};
  const findScenarioPictogram = (label) =>
    pictograms.find((item) => item.label.toLowerCase() === label.toLowerCase()) || findPictogram(label);
  const scenarioLabels = (selected.pictograms?.length ? selected.pictograms : selected.steps || []).map((item) =>
    typeof item === "string" ? item : item.label || item.name || "",
  ).filter(Boolean);
  const expectedPictograms = scenarioLabels.map(findScenarioPictogram);
  const hasPlayableScenario = Boolean(selected.id && scenarioLabels.length > 0);
  const answerSentence = answer.map((item) => item.label).join(" ");
  const targetSentence = scenarioLabels.join(" ");
  const isComplete = hasPlayableScenario && answer.length >= scenarioLabels.length;
  const isCorrect =
    isComplete && scenarioLabels.every((label, index) => answer[index]?.label === label);
  const selectedPictogramIds = expectedPictograms
    .map((item) => item.id)
    .filter((id) => /^[a-f\d]{24}$/i.test(String(id)));

  const startScenario = async () => {
    if (!hasPlayableScenario) {
      clearScenarioSessionState();
      setStarted(false);
      setAnswer([]);
      setResultSaved(false);
      setIsValidating(false);
      setSessionId(null);
      return;
    }

    clearScenarioSessionState();
    setStarted(true);
    setAnswer([]);
    setResultSaved(false);
    setIsValidating(false);
    speakText(`Scenario. ${selected.title}. ${selected.description}`);

    const kidId = childUser?.kidId || childUser?._id || childUser?.id;
    if (!kidId || !selected.id || !/^[a-f\d]{24}$/i.test(String(selected.id))) {
      setSessionId(null);
      return;
    }

    try {
      const session = await startSessionApi({
        kid: kidId,
        scenario: selected.id,
        actions: [
          {
            type: "scenario-started",
            payload: { title: selected.title },
            at: new Date().toISOString(),
          },
        ],
      });
      setSessionId(session.id || session._id || null);
    } catch (_error) {
      setSessionId(null);
    }
  };

  const resetScenario = async () => {
    if (sessionId && !resultSaved) {
      endSessionApi({
        sessionId,
        actions: [
          {
            type: "scenario-reset",
            payload: { title: selected.title },
            at: new Date().toISOString(),
          },
        ],
      }).catch(() => {});
    }
    setAnswer([]);
    setSessionId(null);
    setResultSaved(false);
    setIsValidating(false);
    saveScenarioSessionState({
      selectedId: selected.id,
      started: true,
      answer: [],
      resultSaved: false,
    });
  };

  const validateAnswer = async () => {
    if (!isComplete || resultSaved || isValidating) return;

    setIsValidating(true);
    const kidId = childUser?.kidId || childUser?._id || childUser?.id;
    if (!kidId) {
      saveScenarioSessionState({
        selectedId: selected.id,
        started: true,
        answer,
        resultSaved: true,
      });
      setStarted(true);
      setResultSaved(true);
      setIsValidating(false);
      return;
    }

    let score = isCorrect ? 100 : 40;
    try {
      const aiScore = await calculateScore({
        kidId,
        phrase: answerSentence,
        sessionData: {
          pictograms: answer,
          phraseCount: 1,
          currentLevel: childLevel,
          correctionCount: isCorrect ? 0 : 1,
        },
      });
      if (typeof aiScore?.score === "number") {
        score = aiScore.score;
      }
    } catch (_error) {
      // Keep the deterministic fallback score when AI scoring is unavailable.
    }

    saveScenarioSessionState({
      selectedId: selected.id,
      started: true,
      answer,
      resultSaved: true,
    });
    setStarted(true);
    setResultSaved(true);

    try {
      await createHistoryApi({
        kidId,
        phraseText: answerSentence || targetSentence,
        pictograms: selectedPictogramIds,
        score,
        source: "scenario",
      });
    } catch (_error) {
      // Preserve the in-progress UI even if history persistence fails.
    }

    if (sessionId) {
      endSessionApi({
        sessionId,
        score,
        aiSummary: isCorrect
          ? "Scenario complete avec succes."
          : "Scenario complete avec des erreurs d'ordre.",
        actions: [
          {
            type: "scenario-completed",
            payload: { answer: answerSentence, expected: targetSentence, isCorrect },
            at: new Date().toISOString(),
          },
        ],
      }).catch(() => {});
    }

    setIsValidating(false);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <Card title="Scenarios selon mon niveau">
        <div className="mb-4 rounded-[24px] bg-softBlue/10 p-4">
          <p className="text-sm font-semibold text-slate-500">Niveau enfant</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              {childUser?.name || "Enfant"}
            </h2>
            <Badge tone="secondary">{childLevel}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {availableScenarios.length ? availableScenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={`focus-ring w-full rounded-[28px] p-5 text-left transition ${
                selected.id === scenario.id ? "bg-softBlue/20 shadow-card" : "bg-slate-50"
              }`}
              onClick={() => {
                clearScenarioSessionState();
                setSelectedId(scenario.id);
                setStarted(false);
                setAnswer([]);
                setResultSaved(false);
                setIsValidating(false);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-extrabold text-ink">{scenario.title}</h3>
                <Badge tone="secondary">{scenario.level}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{scenario.description}</p>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-softBlue to-slateBlue"
                  style={{ width: `${scenario.progress || 0}%` }}
                />
              </div>
            </button>
          )) : (
            <div className="rounded-[28px] bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Aucun scenario actif n'est encore assigne a cet enfant.
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <Card
          title={selected.title || "Aucun scenario disponible"}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => speakText(selected.description)}
                disabled={!selected.description}
              >
                <Volume2 className="h-4 w-4" />
                Ecouter
              </Button>
              <Button onClick={startScenario} disabled={!hasPlayableScenario}>
                <CirclePlay className="h-4 w-4" />
                Commencer
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[28px] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                Consigne
              </p>
              <p className="mt-3 text-base leading-8 text-slate-600">
                {selected.description || "Ecoute la consigne puis touche les pictogrammes dans l'ordre."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {scenarioLabels.length ? scenarioLabels.map((item, index) => (
                  <Badge key={`${item}-${index}`} tone="primary">
                    {index + 1}. {item}
                  </Badge>
                )) : (
                  <span className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                    Aucun pictogramme configure pour ce scenario.
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-[28px] bg-success/10 p-5">
              <ListChecks className="h-8 w-8 text-success" />
              <p className="mt-3 font-display text-xl font-extrabold text-ink">
                Objectif
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {selected.childGoal ? <span className="mb-2 block">{selected.childGoal}</span> : null}
                Construire :{" "}
                <span className="font-bold text-ink">
                  {targetSentence || "selectionner un scenario avec pictogrammes"}
                </span>
              </p>
            </div>
          </div>
        </Card>

        {started ? (
          <Card
            title="Exercice en cours"
            action={
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => speakText(answerSentence || targetSentence)}>
                  <Volume2 className="h-4 w-4" />
                  Audio
                </Button>
                <Button variant="ghost" onClick={resetScenario}>
                  <RotateCcw className="h-4 w-4" />
                  Refaire
                </Button>
                <Button variant="success" onClick={validateAnswer} disabled={!isComplete || resultSaved || isValidating}>
                  <CheckCircle2 className="h-4 w-4" />
                  {isValidating ? "Validation..." : "Valider la reponse"}
                </Button>
              </div>
            }
          >
            <div className="mb-5 rounded-[28px] bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Phrase de l'enfant
              </p>
              <div className="mt-3 flex min-h-14 flex-wrap items-center gap-2">
                {answer.length ? (
                  answer.map((item, index) => (
                    <span
                      key={`${item.label}-${index}`}
                      className="rounded-2xl bg-softBlue/15 px-4 py-3 font-bold text-slateBlue"
                    >
                      {item.label}
                    </span>
                  ))
                ) : (
                  <span className="font-semibold text-slate-400">
                    Touche les pictogrammes pour commencer...
                  </span>
                )}
              </div>
            </div>

            <PictogramGrid
              pictograms={expectedPictograms}
              onSelect={(pictogram) => {
                if (resultSaved) return;
                setAnswer((current) => [...current, pictogram]);
              }}
              large
            />

            {resultSaved ? (
              <div
                className={`mt-5 rounded-[28px] p-5 ${
                  isCorrect ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7" />
                  <p className="font-display text-xl font-extrabold">
                    {isCorrect ? "Bravo, phrase reussie !" : "Presque, recommence dans le bon ordre."}
                  </p>
                </div>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default TrainingScenarios;
