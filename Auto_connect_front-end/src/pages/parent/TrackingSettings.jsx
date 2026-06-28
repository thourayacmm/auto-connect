import { useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Droplets,
  Gamepad2,
  Grid3X3,
  HeartHandshake,
  Home,
  School,
  Soup,
  Toilet,
  Palette,
  Sparkles,
  UserRound,
  Volume2,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { useAppPreferences } from "../../context/AppPreferences";

const gridChoices = [
  { id: "small", label: "Petite", text: "Moins de pictogrammes, plus grands" },
  { id: "medium", label: "Moyenne", text: "Equilibre pour la plupart des enfants" },
  { id: "large", label: "Grande", text: "Plus de vocabulaire visible" },
];

const childProfile = [
  { label: "Nom", value: "Bilal Sara" },
  { label: "Age", value: "8 ans" },
  { label: "Niveau", value: "Debutant" },
  { label: "Derniere activite", value: "Aujourd'hui 14:30" },
  { label: "Score actuel", value: "89/100" },
];

const quickStats = [
  { label: "Pictogrammes favoris", value: 12 },
  { label: "Scenarios actifs", value: 4 },
  { label: "Sessions cette semaine", value: 18 },
  { label: "Temps moyen par session", value: "12 min" },
];

const previewPictograms = [
  { label: "J'ai faim", icon: Soup },
  { label: "Je veux boire", icon: Droplets },
  { label: "Toilettes", icon: Toilet },
  { label: "Maman", icon: HeartHandshake },
  { label: "Papa", icon: UserRound },
  { label: "Je veux jouer", icon: Gamepad2 },
  { label: "Aide", icon: CircleHelp },
  { label: "Maison", icon: Home },
  { label: "Ecole", icon: School },
];

const modificationHistory = [
  "18/06/2026 : Taille des pictogrammes modifiee",
  "16/06/2026 : Couleur changee vers Peche",
  "15/06/2026 : Activation des suggestions IA",
  "12/06/2026 : Passage a la grille Moyenne",
];

function TrackingSettings() {
  const {
    childLevel,
    childPictogramSize,
    childSuggestions,
    childTheme,
    childThemes,
    childVoice,
    gridSize,
    setChildLevel,
    setChildPictogramSize,
    setChildSuggestions,
    setChildTheme,
    setChildVoice,
    setGridSize,
    savePreferences,
    voiceOptions,
  } = useAppPreferences();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const currentThemeName = childThemes[childTheme]?.name || "Peche";
  const currentGridLabel = gridChoices.find((choice) => choice.id === gridSize)?.label || "Moyenne";
  const currentVoiceLabel = voiceOptions[childVoice]?.label || "Francais";
  const suggestionsLabel = childSuggestions === "on" ? "Activees" : "Desactivees";

  const saveSettings = async () => {
    try {
      await savePreferences();
      setError("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (_error) {
      setSaved(false);
      setError("Impossible de sauvegarder les parametres pour le moment.");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Profil de l'enfant">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {childProfile.map((item) => (
            <div key={item.label} className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
              <p className="mt-2 font-display text-xl font-extrabold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <div key={item.label} className="rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <Card title="Parametres de l'interface enfant">
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-[28px] bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-slateBlue" />
              <h3 className="font-display text-lg font-bold text-ink">Grille</h3>
            </div>
            <div className="grid gap-3">
              {gridChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setGridSize(choice.id)}
                  className={`focus-ring rounded-2xl border p-4 text-left transition ${
                    gridSize === choice.id
                      ? "border-slateBlue bg-softBlue/15 text-slateBlue"
                      : "border-transparent bg-white text-slate-600 hover:bg-softBlue/10"
                  }`}
                >
                  <span className="font-semibold">{choice.label}</span>
                  <span className="mt-1 block text-xs">{choice.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-slateBlue" />
              <h3 className="font-display text-lg font-bold text-ink">Couleur de fond</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(childThemes).map(([id, theme]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChildTheme(id)}
                  className={`focus-ring rounded-2xl border p-3 text-left transition ${
                    childTheme === id ? "border-slateBlue bg-white" : "border-transparent bg-white"
                  }`}
                >
                  <span className={`mb-3 block h-12 rounded-2xl ${theme.previewClass}`} />
                  <span className="text-sm font-semibold text-ink">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <Card title="Voix et accompagnement">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Volume2 className="h-4 w-4 text-slateBlue" />
              Voix de synthese
            </span>
            <select
              value={childVoice}
              onChange={(event) => setChildVoice(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              {Object.entries(voiceOptions).map(([id, voice]) => (
                <option key={id} value={id}>
                  {voice.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Niveau recommande</span>
            <select
              value={childLevel}
              onChange={(event) => setChildLevel(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              <option>Debutant</option>
              <option>Intermediaire</option>
              <option>Avance</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Taille des pictogrammes</span>
            <input
              type="range"
              min="1"
              max="5"
              value={childPictogramSize}
              onChange={(event) => setChildPictogramSize(event.target.value)}
              className="w-full"
            />
            <span className="block text-xs font-semibold text-slate-500">
              Taille actuelle: {childPictogramSize}/5
            </span>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-slateBlue" />
              Suggestions automatiques
            </span>
            <select
              value={childSuggestions}
              onChange={(event) => setChildSuggestions(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              <option value="on">Activees</option>
              <option value="off">Desactivees</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Preferences actuelles">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Grille", value: currentGridLabel },
              { label: "Couleur", value: currentThemeName },
              { label: "Voix", value: currentVoiceLabel },
              { label: "Taille pictogrammes", value: `${childPictogramSize}/5` },
              { label: "Suggestions IA", value: suggestionsLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recommandations IA">
          <p className="text-sm leading-7 text-slate-600">
            Pour ameliorer la communication quotidienne, il est recommande d'utiliser une grille moyenne avec des pictogrammes de taille 4/5. L'enfant repond bien aux couleurs douces et aux scenarios visuels.
          </p>
        </Card>
      </div>

      <Card title="Apercu enfant">
        <div className={`rounded-[28px] p-5 ${childThemes[childTheme]?.boardClass}`}>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {previewPictograms.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[24px] bg-white/80 p-3 text-center font-display font-bold text-ink shadow-card"
                style={{ fontSize: `${13 + Number(childPictogramSize)}px` }}
              >
                <Icon className="h-7 w-7 text-slateBlue" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Button onClick={saveSettings}>Sauvegarder</Button>
          {saved ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              Parametres sauvegardes et appliques a l'interface enfant.
            </span>
          ) : null}
          {error ? <span className="text-sm font-semibold text-danger">{error}</span> : null}
        </div>
      </Card>

      <Card title="Historique des modifications">
        <div className="grid gap-3">
          {modificationHistory.map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default TrackingSettings;
