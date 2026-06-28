import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers3, MessageSquareText, Target } from "lucide-react";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import { listPictogramsApi, listScenariosApi } from "../../services/domainApi";
import { normalizeLevelLabel } from "../../utils/levels";

const LEVEL_CONTENT = {
  Debutant: {
    complexity: "Phrases a 1-2 pictogrammes",
    objective: "Aider l'enfant a exprimer une demande simple avec un choix tres guide.",
  },
  Intermediaire: {
    complexity: "Phrases a 2-3 pictogrammes",
    objective: "Construire des phrases courtes en choisissant le bon pictogramme selon le contexte.",
  },
  Avance: {
    complexity: "Phrases plus completes",
    objective: "Combiner plusieurs intentions et gagner en autonomie dans les routines.",
  },
};

const getLevelMeta = (title) =>
  LEVEL_CONTENT[title] || {
    complexity: "Complexite determinee par les ressources disponibles",
    objective: "Objectif calcule selon les pictogrammes et scenarios de ce niveau.",
  };

function TrainingLevels() {
  const [pictograms, setPictograms] = useState([]);
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    listPictogramsApi().then(setPictograms).catch(() => setPictograms([]));
    listScenariosApi().then(setScenarios).catch(() => setScenarios([]));
  }, []);

  const dynamicLevels = useMemo(() => {
    const normalizedPictograms = pictograms.map((item) => ({ ...item, level: normalizeLevelLabel(item.level) }));
    const normalizedScenarios = scenarios.map((item) => ({ ...item, level: normalizeLevelLabel(item.level) }));
    const levelNames = [...new Set([...normalizedPictograms.map((item) => item.level), ...normalizedScenarios.map((item) => item.level)])]
      .filter(Boolean);

    return levelNames.map((title) => {
      const levelPictograms = normalizedPictograms.filter((item) => item.level === title);
      const levelScenarios = normalizedScenarios.filter((item) => item.level === title);
      const meta = getLevelMeta(title);

      return {
        title,
        pictogramCount: levelPictograms.length,
        scenarioCount: levelScenarios.length,
        complexity: meta.complexity,
        objective: meta.objective,
        scenarioTitles: levelScenarios.map((item) => item.title),
        examples: levelPictograms.slice(0, 4).map((item) => item.label),
        progress: Math.min(
          100,
          Math.round(((levelPictograms.length * 2 + levelScenarios.length * 3) / 18) * 100),
        ),
      };
    });
  }, [pictograms, scenarios]);

  return (
    <Card title="Gestion des niveaux">
      <div className="grid gap-5 lg:grid-cols-3">
        {dynamicLevels.map((level) => (
          <article
            key={level.title}
            className="rounded-[28px] border border-softBlue/10 bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                  <Layers3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{level.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Parcours dynamique
                  </p>
                </div>
              </div>
              <Badge tone="primary">{level.pictogramCount} pictos</Badge>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-slateBlue" />
                  <p className="text-sm font-semibold text-ink">Complexite</p>
                </div>
                <p className="text-sm text-slate-600">{level.complexity}</p>
              </div>

              <div className="rounded-[22px] bg-lilac/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#6652b4]" />
                  <p className="text-sm font-semibold text-ink">Objectif</p>
                </div>
                <p className="text-sm leading-6 text-slate-600">{level.objective}</p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">Progression cible</span>
                  <span className="font-semibold text-slateBlue">{level.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-softBlue to-slateBlue"
                    style={{ width: `${level.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                Scenarios recommandes
              </p>
              <div className="flex flex-wrap gap-2">
                {level.scenarioTitles.length ? (
                  level.scenarioTitles.slice(0, 3).map((scenario) => (
                    <Badge key={scenario} tone="secondary">
                      {scenario}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="secondary">Aucun scenario</Badge>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                Exemples de pictogrammes
              </p>
              <div className="space-y-2">
                {level.examples.length ? (
                  level.examples.map((example) => (
                    <div
                      key={example}
                      className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {example}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    Aucun pictogramme pour ce niveau.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] bg-softBlue/10 p-4 text-sm text-slate-600">
              {level.scenarioCount} scenario(s) et {level.pictogramCount} pictogramme(s) trouves dans la base de donnees.
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

export default TrainingLevels;
