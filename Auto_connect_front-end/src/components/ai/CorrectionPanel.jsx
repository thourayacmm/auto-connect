import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { correctPhrase } from "../../services/aiApi";
import Button from "../common/Button";
import Card from "../common/Card";

function CorrectionPanel({ history = [] }) {
  const [correction, setCorrection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const latestPhrase = useMemo(
    () =>
      history.find((item) => item?.generatedText?.trim() || item?.correctedText?.trim()) || null,
    [history],
  );

  const sourceText = latestPhrase?.generatedText?.trim() || latestPhrase?.correctedText?.trim() || "";

  const runCorrection = async () => {
    if (!sourceText) {
      setCorrection(null);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const result = await correctPhrase({ text: sourceText, pictogramLabels: [] });
      setCorrection(result);
    } catch (_error) {
      setCorrection(null);
      setError("Le service de correction IA n'est pas disponible pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCorrection();
  }, [sourceText]);

  return (
    <Card title="Correction IA">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Derniere phrase reelle
          </p>
          <Button
            variant="secondary"
            className="min-h-9 rounded-2xl px-3 text-xs"
            onClick={runCorrection}
            disabled={!sourceText || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Relancer
          </Button>
        </div>

        <div className="rounded-2xl bg-peach/30 p-4">
          <p className="font-semibold text-ink">Texte original</p>
          <p className="mt-2 text-slate-600">
            {sourceText || "Aucune phrase recente disponible dans l'historique."}
          </p>
        </div>

        <div className="rounded-2xl bg-success/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-success" />
            Correction IA
          </div>
          <p className="mt-2 text-slate-600">
            {isLoading
              ? "Analyse et correction en cours..."
              : correction?.correctedText || correction?.corrected_text || "Aucune correction disponible."}
          </p>
          {correction?.explanation ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">{correction.explanation}</p>
          ) : null}
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default CorrectionPanel;
