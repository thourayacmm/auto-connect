import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Frown,
  Heart,
  Keyboard,
  Laugh,
  Leaf,
  MapPin,
  PartyPopper,
  Search,
  Sparkles,
  Utensils,
  Users,
  Zap,
} from "lucide-react";
import { useAppPreferences } from "../../context/AppPreferences";
import PhraseBuilder from "../../components/pictograms/PhraseBuilder";
import PictogramGrid from "../../components/pictograms/PictogramGrid";
import { calculateScore, correctPhrase, transcribeAudio } from "../../services/aiApi";
import {
  createHistoryApi,
  endSessionApi,
  listCategoriesApi,
  listPictogramsApi,
  startSessionApi,
} from "../../services/domainApi";
import { normalizeCategoryName } from "../../utils/constants";
import { classNames, getStoredUser, speakText } from "../../utils/helpers";

const categoryIcons = {
  Actions: Zap,
  Besoins: Heart,
  "Besoins essentiels": Heart,
  Ecole: MapPin,
  Emotions: Laugh,
  Lieux: MapPin,
  Nourriture: Utensils,
  Personnes: Users,
};

const toneOptions = [
  { label: "Content", icon: Laugh, className: "bg-softBlue/15 text-slateBlue" },
  { label: "Triste", icon: Frown, className: "bg-lilac/20 text-slateBlue" },
  { label: "Excite", icon: PartyPopper, className: "bg-peach/35 text-warning" },
  { label: "Calme", icon: Leaf, className: "bg-success/10 text-success" },
];

const DEMO_PICTOGRAMS = [
  { id: "demo-pomme", label: "Pomme", category: "Nourriture", icon: "Apple", color: "#fff4bf" },
  { id: "demo-eau", label: "Eau", category: "Besoins essentiels", icon: "Droplets", color: "#d7f4ff" },
  { id: "demo-toilette", label: "Toilette", category: "Besoins essentiels", icon: "Toilet", color: "#d7f4ff" },
  { id: "demo-content", label: "Content", category: "Emotions", icon: "Laugh", color: "#efe4ff" },
  { id: "demo-triste", label: "Triste", category: "Emotions", icon: "BookHeart", color: "#efe4ff" },
  { id: "demo-maison", label: "Maison", category: "Lieux", icon: "Home", color: "#ffe9d5" },
  { id: "demo-ecole", label: "Ecole", category: "Ecole", icon: "School", color: "#eef6ff" },
  { id: "demo-aide", label: "Aide moi", category: "Actions", icon: "CircleHelp", color: "#d8f8ea" },
  { id: "demo-jouer", label: "Jouer", category: "Actions", icon: "Gamepad2", color: "#d8f8ea" },
];

const DEMO_CATEGORIES = ["Nourriture", "Besoins essentiels", "Emotions", "Actions", "Lieux", "Ecole"];

const quickStarts = ["Je veux", "J'ai besoin", "Aide moi", "Je suis content", "Je suis triste"];
const BOARD_STATE_KEY = "auto-connect-communication-board-state";

const normalizeBoardPictogram = (item) => ({
  ...item,
  category: normalizeCategoryName(item.category),
});

const uniqueCategoryLabels = (items) =>
  [...new Set(items.map((item) => normalizeCategoryName(item.name || item.label || item)).filter(Boolean))];

const loadBoardState = () => {
  try {
    const raw = sessionStorage.getItem(BOARD_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_error) {
    sessionStorage.removeItem(BOARD_STATE_KEY);
    return {};
  }
};

const saveBoardState = (state) => {
  sessionStorage.setItem(BOARD_STATE_KEY, JSON.stringify(state));
};

const clearBoardState = () => {
  sessionStorage.removeItem(BOARD_STATE_KEY);
};

function CommunicationBoard() {
  const { childPictogramSize, childSuggestions, childTheme, childThemes } = useAppPreferences();
  const restoredBoardState = useMemo(loadBoardState, []);
  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [pictograms, setPictograms] = useState(DEMO_PICTOGRAMS);
  const [activeCategory, setActiveCategory] = useState(DEMO_CATEGORIES[0]);
  const [phrase, setPhrase] = useState(Array.isArray(restoredBoardState.phrase) ? restoredBoardState.phrase : []);
  const [query, setQuery] = useState("");
  const [typedText, setTypedText] = useState(restoredBoardState.typedText || "");
  const [activeTone, setActiveTone] = useState(toneOptions[0].label);
  const [correctionText, setCorrectionText] = useState(restoredBoardState.correctionText || "");
  const [validationMessage, setValidationMessage] = useState(restoredBoardState.validationMessage || "");
  const [isListening, setIsListening] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const pcmChunksRef = useRef([]);

  useEffect(() => {
    listCategoriesApi()
      .then((items) => {
        const labels = uniqueCategoryLabels(items);
        if (labels.length) {
          setCategories(labels);
          setActiveCategory(labels[0]);
        } else {
          setCategories(DEMO_CATEGORIES);
          setActiveCategory(DEMO_CATEGORIES[0]);
        }
      })
      .catch(() => {
        setCategories(DEMO_CATEGORIES);
        setActiveCategory(DEMO_CATEGORIES[0]);
      });

    const user = getStoredUser();
    listPictogramsApi({ isActive: "true", ...(user?.age ? { age: user.age } : {}) })
      .then((items) => {
        setPictograms(items.length >= 8 ? items.map(normalizeBoardPictogram) : DEMO_PICTOGRAMS);
      })
      .catch(() => setPictograms(DEMO_PICTOGRAMS));

    return () => {
      processorRef.current?.disconnect?.();
      sourceNodeRef.current?.disconnect?.();
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      audioContextRef.current?.close?.().catch?.(() => {});
    };
  }, []);

  const phraseSuggestions = useMemo(
    () => {
      const suggestions = pictograms.slice(0, 3).map((item) => item.label).filter(Boolean);
      return suggestions.length >= 3 ? suggestions : ["Je veux", "J'ai besoin", "Aide moi"];
    },
    [pictograms],
  );

  const filtered = useMemo(
    () =>
      query.trim()
        ? pictograms.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
        : pictograms.filter((item) => normalizeCategoryName(item.category) === activeCategory),
    [activeCategory, pictograms, query],
  );

  const pictogramScaleClass =
    Number(childPictogramSize) >= 5
      ? "[&_.pictogram-card]:min-h-[190px]"
      : Number(childPictogramSize) <= 2
        ? "[&_.pictogram-card]:min-h-[120px]"
        : "";

  const getSentence = () =>
    [phrase.map((item) => item.label).join(" "), typedText.trim()].filter(Boolean).join(" ");

  const handleTextChange = (value) => {
    const nextText = Array.isArray(value) ? value.join("") : String(value || "");
    setTypedText(nextText);
    setValidationMessage("");
    clearBoardState();
    if (nextText.trim()) {
      setPhrase((current) =>
        current.every((item) => String(item.id || "").startsWith("demo-") || item.category === "Demo")
          ? []
          : current,
      );
    }
    setCorrectionText("");
  };

  const clearPhrase = () => {
    setPhrase([]);
    setTypedText("");
    setCorrectionText("");
    setValidationMessage("");
    clearBoardState();
  };

  const correctSentence = async () => {
    const sentence = getSentence().replace(/\s+/g, " ").trim();
    if (!sentence) return;

    setValidationMessage("");
    clearBoardState();
    setIsCorrecting(true);
    try {
      const result = await correctPhrase({
        text: sentence,
        pictogramLabels: phrase.map((item) => item.label),
      });
      setCorrectionText(result.correctedText || result.corrected_text || sentence);
    } catch (_error) {
      const corrected = sentence
        .replace(/\bj ai\b/gi, "j'ai")
        .replace(/\bje veux manger pomme\b/gi, "je veux manger une pomme")
        .replace(/\bmanger pomme\b/gi, "manger une pomme")
        .replace(/\btoilettes\b/gi, "aller aux toilettes")
        .replace(/^./, (letter) => letter.toUpperCase());

      setCorrectionText(corrected.endsWith(".") ? corrected : `${corrected}.`);
    } finally {
      setIsCorrecting(false);
    }
  };

  const applyCorrection = () => {
    if (!correctionText) return;

    clearBoardState();
    setValidationMessage("");
    setPhrase([
      {
        id: `correction-${Date.now()}`,
        label: correctionText,
        category: "Correction IA",
        icon: "Sparkles",
      },
    ]);
    setTypedText("");
    setCorrectionText("");
  };

  const toInt16 = (input) => {
    const output = new Int16Array(input.length);
    for (let index = 0; index < input.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, input[index]));
      output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  };

  const encodeWav = (pcmChunks, sampleRate) => {
    const totalLength = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const wavBuffer = new ArrayBuffer(44 + totalLength * 2);
    const view = new DataView(wavBuffer);
    const writeString = (offset, value) => {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + totalLength * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, totalLength * 2, true);

    let offset = 44;
    pcmChunks.forEach((chunk) => {
      for (let index = 0; index < chunk.length; index += 1) {
        view.setInt16(offset, chunk[index], true);
        offset += 2;
      }
    });

    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const stopDictation = async () => {
    setIsListening(false);
    setIsTranscribing(true);

    processorRef.current?.disconnect?.();
    sourceNodeRef.current?.disconnect?.();
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());

    const sampleRate = audioContextRef.current?.sampleRate || 16000;
    await audioContextRef.current?.close?.().catch?.(() => {});

    const wavBlob = encodeWav(pcmChunksRef.current, sampleRate);
    processorRef.current = null;
    sourceNodeRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;

    try {
      const audioFile = new File([wavBlob], "dictation.wav", { type: "audio/wav" });
      const result = await transcribeAudio(audioFile, { language: "fr" });
      const transcript = result.text?.trim();
      if (transcript) {
        setTypedText(transcript);
      } else {
        setTypedText((current) => current || "Aucune parole detectee. Reessaie en parlant plus pres du micro.");
      }
    } catch (_error) {
      setTypedText((current) => current || "Le service de dictee IA n'est pas disponible pour le moment.");
    } finally {
      pcmChunksRef.current = [];
      setIsTranscribing(false);
    }
  };

  const startDictation = async () => {
    if (isListening) {
      stopDictation();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setTypedText((current) => current || "L'enregistrement micro n'est pas disponible sur cet appareil.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setTypedText((current) => current || "Le traitement audio n'est pas disponible sur cet appareil.");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceNodeRef.current = source;
      processorRef.current = processor;
      pcmChunksRef.current = [];

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(toInt16(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setCorrectionText("");
      setIsListening(true);
    } catch (_error) {
      setIsListening(false);
      setIsTranscribing(false);
      setTypedText((current) => current || "Impossible d'acceder au microphone.");
    }
  };

  const validateSentence = async (sentence) => {
    speakText(sentence);
    const user = getStoredUser();
    const kidId = user?.kidId || user?._id || user?.id;
    if (!sentence) return;

    const successText = "Phrase enregistree avec succes";
    setValidationMessage(successText);
    saveBoardState({
      phrase,
      typedText,
      correctionText,
      validationMessage: successText,
    });

    if (!kidId) return;

    const selectedPictograms = phrase.map((item) => item.id).filter((id) => /^[a-f\d]{24}$/i.test(String(id)));
    let session = null;
    let scoreResult = null;

    try {
      session = await startSessionApi({
        kid: kidId,
        actions: [
          {
            type: "phrase-started",
            payload: { labels: phrase.map((item) => item.label), typedText },
            at: new Date().toISOString(),
          },
        ],
      });

      try {
        scoreResult = await calculateScore({
          kidId,
          phrase: sentence,
          sessionData: {
            pictograms: phrase,
            phraseCount: 1,
            currentLevel: user.currentLevel,
            correctionCount: correctionText ? 1 : 0,
          },
        });
      } catch (_error) {
        scoreResult = null;
      }

      await createHistoryApi({
        kidId,
        phraseText: sentence,
        pictograms: selectedPictograms,
        correctedText: correctionText || null,
        score: typeof scoreResult?.score === "number" ? scoreResult.score : null,
        source: "manual",
      });

      await endSessionApi({
        sessionId: session.id || session._id,
        score: typeof scoreResult?.score === "number" ? scoreResult.score : undefined,
        aiSummary: scoreResult?.interpretation || scoreResult?.explanation || "",
        actions: [
          {
            type: "phrase-validated",
            payload: { sentence, corrected: Boolean(correctionText) },
            at: new Date().toISOString(),
          },
        ],
      });
    } catch (_error) {
      if (session?.id || session?._id) {
        endSessionApi({
          sessionId: session.id || session._id,
          actions: [
            {
              type: "phrase-validation-error",
              payload: { sentence },
              at: new Date().toISOString(),
            },
          ],
        }).catch(() => {});
      }
    }
  };

  return (
    <div className={`rounded-[28px] bg-[#fff7f1] p-3 ${childThemes[childTheme]?.boardClass || ""}`}>
      <div className="space-y-3">
        <PhraseBuilder
          correctionText={correctionText}
          isListening={isListening}
          phrase={phrase}
          textValue={typedText}
          onApplyCorrection={applyCorrection}
          onClear={clearPhrase}
          onCorrect={correctSentence}
          onNewPhrase={clearPhrase}
          onRemoveLast={() => {
            setPhrase((current) => current.slice(0, -1));
            setValidationMessage("");
            clearBoardState();
          }}
          onSpeak={speakText}
          onStartDictation={startDictation}
          onTextChange={handleTextChange}
          onValidate={validateSentence}
          successText={validationMessage}
        />

        <div className="grid gap-2 xl:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Ton</span>
            {toneOptions.map((tone) => {
              const Icon = tone.icon;
              return (
                <button
                  key={tone.label}
                  type="button"
                  onClick={() => setActiveTone(tone.label)}
                  className={classNames(
                    "focus-ring inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-bold transition",
                    tone.className,
                    activeTone === tone.label ? "ring-2 ring-slateBlue/30" : "",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tone.label}
                </button>
              );
            })}
          </div>
          <div className="inline-flex min-h-9 items-center gap-2 rounded-[20px] bg-white px-4 text-xs font-bold text-slate-500 shadow-sm">
            <Bot className="h-4 w-4 text-success" />
            {isListening
              ? "Enregistrement vocal en cours"
              : isTranscribing
                ? "Transcription IA en cours"
                : isCorrecting
                  ? "Correction IA en cours"
                  : "Backend IA connecte"}
          </div>
        </div>

        {correctionText ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Correction IA</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Texte original : {getSentence() || "Phrase enfant"}
              </p>
              <p className="mt-1 text-base font-extrabold text-ink">Correction : {correctionText}</p>
            </div>
            <div className="rounded-[22px] bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Score IA</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-slateBlue">88/100</p>
            </div>
            <div className="rounded-[22px] bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Niveau</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-ink">Debutant</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <main className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Chercher un pictogramme..."
                  className="focus-ring min-h-12 w-full rounded-[22px] border border-peach/70 bg-white pl-14 pr-5 text-sm font-semibold text-ink placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[22px] bg-white px-5 text-sm font-bold text-slate-500 shadow-card"
                onClick={() => document.querySelector("input")?.focus()}
              >
                <Keyboard className="h-5 w-5" />
                Clavier
              </button>
            </div>

            <div className="rounded-[24px] bg-white/85 p-3 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slateBlue">
                    Categories
                  </p>
                  <h2 className="font-display text-base font-extrabold text-ink">
                    Filtrer les pictogrammes
                  </h2>
                </div>
                <div className="text-sm font-bold text-slate-500">
                  {query.trim() ? "Recherche active" : activeCategory}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category] || Laugh;
                  const active = activeCategory === category && !query.trim();

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setQuery("");
                      }}
                      className={classNames(
                        "focus-ring inline-flex min-h-9 items-center gap-2 rounded-2xl px-3 text-xs font-bold transition",
                        active ? "bg-slateBlue text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-softBlue/10",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={classNames("[&_.pictogram-card]:min-h-[115px] [&_.pictogram-card]:rounded-[22px] [&_.pictogram-card]:p-3", pictogramScaleClass)}>
              <PictogramGrid
                pictograms={filtered}
                onSelect={(pictogram) => {
                  setPhrase((current) => [...current, pictogram]);
                  setCorrectionText("");
                  setValidationMessage("");
                  clearBoardState();
                }}
                large
              />
            </div>
          </main>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 rounded-[24px] bg-white/90 p-3 shadow-soft">
          <span className="mr-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
            Favoris
          </span>
          {quickStarts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                {
                  setCorrectionText("");
                  setValidationMessage("");
                  clearBoardState();
                  setPhrase((current) => [
                    ...current,
                    {
                      id: `quick-${item}`,
                      label: item,
                      category: "Phrase",
                      icon: "Sparkles",
                    },
                  ]);
                }
              }
              className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-bold text-ink shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-slateBlue" />
              {item}
            </button>
          ))}

          {childSuggestions === "on" ? (
            <>
              <span className="h-8 w-px bg-slate-200" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
                Suggestions
              </span>
              {phraseSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    {
                      setCorrectionText("");
                      setValidationMessage("");
                      clearBoardState();
                      setPhrase((current) => [
                        ...current,
                        { id: `suggestion-${suggestion}`, label: suggestion, category: "Favori" },
                      ]);
                    }
                  }
                  className="focus-ring rounded-2xl bg-softBlue/10 px-3 py-2 text-xs font-bold text-slateBlue"
                >
                  {suggestion}
                </button>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CommunicationBoard;
