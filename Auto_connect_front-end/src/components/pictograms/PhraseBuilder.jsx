import { Bot, Eraser, Keyboard, Mic, Send, Sparkles, Trash2, Volume2 } from "lucide-react";
import Button from "../common/Button";

function PhraseBuilder({
  correctionText = "",
  isListening = false,
  phrase,
  textValue = "",
  onApplyCorrection,
  onClear,
  onCorrect,
  onNewPhrase,
  onRemoveLast,
  onSpeak,
  onStartDictation,
  onTextChange,
  onValidate,
  successText = "",
}) {
  const phraseItems = Array.isArray(phrase) ? phrase : [];
  const keyboardText = (Array.isArray(textValue) ? textValue.join("") : String(textValue || "")).trim();
  const hasOnlyDemoPhrase =
    phraseItems.length > 0 &&
    phraseItems.every((item) => String(item.id || "").startsWith("demo-") || item.category === "Demo");
  const visiblePhraseItems = keyboardText && hasOnlyDemoPhrase ? [] : phraseItems;
  const pictogramSentence = visiblePhraseItems.map((item) => item.label).join(" ");
  const fullSentence = [pictogramSentence, keyboardText].filter(Boolean).join(" ");

  return (
    <div className="section-shell overflow-hidden p-0">
      <div className="border-b border-softBlue/10 bg-white/80 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Assistant de phrase
            </p>
            <h2 className="font-display text-lg font-extrabold text-ink">
              Composer, corriger et ecouter
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-softBlue/10 px-3 py-2 text-xs font-bold text-slateBlue">
              Text to speech
            </span>
            <span className="rounded-full bg-lilac/20 px-3 py-2 text-xs font-bold text-slateBlue">
              Speech to text
            </span>
            <span className="rounded-full bg-success/10 px-3 py-2 text-xs font-bold text-success">
              Correction IA
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-[1fr_minmax(300px,340px)]">
        <div className="rounded-[24px] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Ma phrase
          </p>
          <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2">
            {visiblePhraseItems.map((item, index) => (
              <span
                key={`${item.id}-${index}`}
                className="inline-flex items-center rounded-2xl bg-softBlue/15 px-4 py-3 text-base font-bold text-slateBlue"
              >
                {item.label}
              </span>
            ))}
            {!fullSentence ? (
              <span className="text-sm font-semibold text-slate-400">
                Choisis ou ecris une phrase...
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="min-h-12 rounded-[18px] px-4 text-sm"
            onClick={() => onSpeak(fullSentence)}
            disabled={!fullSentence}
          >
            <Volume2 className="h-5 w-5" />
            Ecouter
          </Button>
          <Button
            className="min-h-12 rounded-[18px] px-4 text-sm"
            variant="secondary"
            onClick={onStartDictation}
          >
            <Mic className="h-5 w-5" />
            {isListening ? "Arreter" : "Dicter"}
          </Button>
          <Button
            className="min-h-12 rounded-[18px] px-4 text-sm"
            variant="secondary"
            onClick={onRemoveLast}
            disabled={!visiblePhraseItems.length}
          >
            <Trash2 className="h-5 w-5" />
            Retirer
          </Button>
          <Button
            className="min-h-12 rounded-[18px] px-4 text-sm"
            variant="ghost"
            onClick={onClear}
            disabled={!fullSentence}
          >
            <Eraser className="h-5 w-5" />
            Effacer
          </Button>
        </div>
      </div>

      <div className="grid gap-3 border-t border-softBlue/10 p-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Keyboard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={textValue}
            onChange={(event) => onTextChange?.(event.target.value)}
            placeholder="Ecrire au clavier..."
            className="focus-ring min-h-12 w-full rounded-[20px] border border-softBlue/20 bg-white pl-12 pr-4 text-sm font-semibold text-ink placeholder:text-slate-400"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 lg:w-[330px]">
          <Button
            variant="secondary"
            className="min-h-12 rounded-[18px] px-4 text-sm"
            onClick={onCorrect}
            disabled={!fullSentence}
          >
            <Bot className="h-4 w-4" />
            Corriger IA
          </Button>
          <Button
            variant="success"
            className="min-h-12 rounded-[18px] px-4 text-sm"
            onClick={() => onValidate?.(fullSentence)}
            disabled={!fullSentence}
          >
            <Send className="h-4 w-4" />
            Valider
          </Button>
        </div>
      </div>

      {correctionText ? (
        <div className="border-t border-softBlue/10 bg-success/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
                Proposition de correction
              </p>
              <p className="mt-2 text-lg font-extrabold text-ink">{correctionText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onSpeak(correctionText)}>
                <Volume2 className="h-4 w-4" />
                Ecouter
              </Button>
              <Button variant="success" onClick={onApplyCorrection}>
                <Sparkles className="h-4 w-4" />
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {successText ? (
        <div className="border-t border-softBlue/10 bg-success/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
                Phrase validee
              </p>
              <p className="mt-2 text-lg font-extrabold text-ink">{successText}</p>
            </div>
            <Button variant="secondary" onClick={onNewPhrase}>
              <Sparkles className="h-4 w-4" />
              Nouvelle phrase
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PhraseBuilder;
