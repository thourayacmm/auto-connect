import { BookOpen, MessageSquareText, ScanSearch, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/common/Card";
import RoleOverview from "../../components/common/RoleOverview";
import ActivityCard from "../../components/dashboard/ActivityCard";
import { getKidProgressApi, listScenariosApi } from "../../services/domainApi";
import { getStoredUser } from "../../utils/helpers";

const actions = [
  { title: "Communiquer", to: "/child/board", icon: MessageSquareText, color: "bg-softBlue/15" },
  { title: "Rechercher un pictogramme", to: "/child/search", icon: ScanSearch, color: "bg-lilac/25" },
  { title: "Ecouter mes phrases", to: "/child/listen", icon: BookOpen, color: "bg-peach/40" },
  { title: "Scenarios d'entrainement", to: "/child/scenarios", icon: Sparkles, color: "bg-success/15" },
];

const DEMO_RECENT_PHRASES = [
  "Je veux jouer",
  "J'ai faim",
  "Je suis fatigue",
  "Je veux maman",
  "Je veux aller aux toilettes",
];

const DEMO_SCENARIOS = [
  { id: "demo-routine", title: "Routine du matin", description: "Preparer la journee avec des pictogrammes simples.", level: "Debutant" },
  { id: "demo-aide", title: "Demander de l'aide", description: "Exprimer un besoin d'aide a un adulte.", level: "Debutant" },
  { id: "demo-emotion", title: "Exprimer une emotion", description: "Identifier une emotion et demander du soutien.", level: "Intermediaire" },
  { id: "demo-ecole", title: "Retour a l'ecole", description: "Preparer une activite scolaire avec confiance.", level: "Intermediaire" },
];

const DEMO_PROGRESS = [
  { label: "Score communication", value: "89%" },
  { label: "Pictogrammes maitrises", value: 74 },
  { label: "Phrases creees", value: 156 },
  { label: "Activites realisees", value: 48 },
];

const DEMO_FAVORITES = ["Boire", "Manger", "Jouer", "Maman", "Papa", "Aide", "Ecole", "Maison"];

const DEMO_TODAY_ACTIVITY = [
  { time: "09:15", text: "J'ai faim" },
  { time: "10:40", text: "Je veux boire" },
  { time: "12:10", text: "Routine du matin terminee" },
  { time: "14:32", text: "Je veux boire de l'eau" },
];

function ChildHome() {
  const childUser = getStoredUser();
  const [progress, setProgress] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    if (childUser?.id || childUser?._id || childUser?.kidId) {
      getKidProgressApi(childUser.id || childUser._id || childUser.kidId)
        .then((data) => {
          setProgress(data);
          setProgressLoaded(true);
        })
        .catch(() => {
          setProgress(null);
          setProgressLoaded(true);
        });
    }

    listScenariosApi({ isActive: "true", ...(childUser?.age ? { age: childUser.age } : {}) })
      .then(setScenarios)
      .catch(() => setScenarios([]));
  }, [childUser?.id, childUser?._id, childUser?.kidId, childUser?.age]);

  const topWords = useMemo(
    () => (progress?.topPictograms || []).slice(0, 3).map((item) => item.name).filter(Boolean),
    [progress],
  );
  const favoritePictograms = topWords.length >= 4 ? topWords : DEMO_FAVORITES;
  const assignedScenarios = (progress?.assignedScenarios?.length ? progress.assignedScenarios : scenarios.length ? scenarios : DEMO_SCENARIOS);
  const latestHistory = progress?.recentHistory?.[0];
  const recentPhrase = latestHistory?.correctedText || latestHistory?.generatedText || "Je veux boire de l'eau";
  const recentPhraseDate = latestHistory?.usedAt
    ? new Date(latestHistory.usedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "Aujourd'hui 14:32";
  const recentPhraseHistory = progress?.recentHistory?.length
    ? progress.recentHistory
        .slice(1, 6)
        .map((item) => item.correctedText || item.generatedText)
        .filter(Boolean)
    : DEMO_RECENT_PHRASES;
  const todayActivity = progress?.recentHistory?.length >= 4
    ? progress.recentHistory.slice(0, 4).map((item) => ({
        time: item.usedAt
          ? new Date(item.usedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "Maintenant",
        text: item.correctedText || item.generatedText || "Phrase construite",
      }))
    : DEMO_TODAY_ACTIVITY;

  return (
    <div className="space-y-6">
      <RoleOverview
        title="Espace enfant"
        description="Cet espace reprend les usages du role enfant du diagramme: choisir des pictogrammes, les rechercher, ecouter les phrases et pratiquer avec des scenarios."
        items={[
          { title: "Selectionner", text: "Construire une phrase en touchant de grands pictogrammes." },
          { title: "Rechercher", text: "Trouver rapidement un pictogramme a partir d'un mot simple." },
          { title: "Ecouter", text: "Reentendre ses phrases avec la synthese vocale du navigateur." },
          { title: "S'entrainer", text: "Suivre des scenarios guides adaptes a son niveau." },
        ]}
        ctaLabel="Commencer a communiquer"
        ctaTo="/child/board"
        accent="bg-softBlue/15"
      />
      <Card className="bg-hero-glow">
        <h1 className="font-display text-4xl font-extrabold text-ink">
          Bonjour {childUser?.firstName || childUser?.name?.split(" ")?.[0] || "Bilal"} 👋
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Aujourd'hui tu as deja realise 3 activites et construit 4 phrases.
        </p>
      </Card>
      <Card title="Objectif du jour">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">Communication : 80%</p>
            <p className="mt-1 text-sm text-slate-500">Progression actuelle : 68%</p>
          </div>
          <span className="rounded-full bg-softBlue/15 px-4 py-2 text-sm font-bold text-slateBlue">
            68%
          </span>
        </div>
        <div className="mt-4 h-4 rounded-full bg-slate-100">
          <div className="h-4 rounded-full bg-gradient-to-r from-softBlue to-slateBlue" style={{ width: "68%" }} />
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.to}
              className={`${action.color} rounded-[32px] p-8 shadow-card transition hover:-translate-y-1`}
            >
              <Icon className="h-14 w-14 text-slateBlue" />
              <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">{action.title}</h2>
            </Link>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Mes progres">
          <div className="grid gap-3 sm:grid-cols-2">
            {DEMO_PROGRESS.map((item) => (
              <div key={item.label} className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Mes pictogrammes favoris">
          <div className="flex flex-wrap gap-2">
            {favoritePictograms.slice(0, 8).map((word) => (
              <span key={word} className="rounded-full bg-softBlue/10 px-4 py-3 text-sm font-bold text-slateBlue">
                {word}
              </span>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Ma derniere phrase">
          <p className="font-display text-2xl font-extrabold text-ink">"{recentPhrase}"</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{recentPhraseDate}</p>
          <p className="mt-5 text-xs font-bold uppercase text-slate-400">Historique recent</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {recentPhraseHistory.map((phrase) => (
              <span
                key={phrase}
                className="rounded-full bg-softBlue/10 px-3 py-2 text-xs font-bold text-slateBlue"
              >
                {phrase}
              </span>
            ))}
          </div>
        </Card>
        <Card title="Scenarios a faire">
          <div className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm font-bold text-success">
            3 termines sur 4
          </div>
          <div className="grid gap-4">
            {assignedScenarios.slice(0, 4).map((scenario) => (
              <ActivityCard
                key={scenario.id || scenario._id || scenario.title}
                title={scenario.title}
                subtitle={scenario.description || "Scenario enfant disponible"}
                meta={scenario.level || scenario.targetLevel || "Niveau"}
              />
            ))}
          </div>
        </Card>
      </div>
      <Card title="Activite aujourd'hui">
        <div className="grid gap-3 md:grid-cols-2">
          {todayActivity.map((activity) => (
            <div key={`${activity.time}-${activity.text}`} className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm font-bold text-slateBlue">{activity.time} → {activity.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default ChildHome;
