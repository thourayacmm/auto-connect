import { useEffect, useMemo, useState } from "react";
import { Clock3, Search, Volume2 } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { getKidHistoryApi } from "../../services/domainApi";
import { formatDateTime, speakText } from "../../utils/helpers";
import { getStoredUser } from "../../utils/helpers";

const normalizeHistoryItem = (item) => ({
  id: item.id || item._id,
  sentence:
    item.correctedText ||
    item.generatedText ||
    item.phraseText ||
    item.sentence ||
    item.text ||
    "",
  createdAt: item.usedAt || item.createdAt,
});

function ListenPhrases() {
  const [query, setQuery] = useState("");
  const [activePhrase, setActivePhrase] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const user = getStoredUser();
    const kidId = user?.kidId || user?._id || user?.id;
    if (!kidId) return;

    getKidHistoryApi(kidId)
      .then((items) => {
        const sourceItems = Array.isArray(items) ? items : items?.items || items?.data || [];
        const normalized = sourceItems
          .map(normalizeHistoryItem)
          .filter((item) => item.sentence.trim());
        setHistory(normalized);
        setActivePhrase((current) => current || normalized[0]?.sentence || "");
      })
      .catch(() => setHistory([]));
  }, []);

  const phrases = useMemo(
    () =>
      history.filter((item) =>
        item.sentence.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [history, query],
  );

  const playPhrase = (sentence) => {
    setActivePhrase(sentence);
    speakText(sentence);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#fff7f1]">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-softBlue/20 text-slateBlue">
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Lecture audio
                </p>
                <h1 className="font-display text-3xl font-extrabold text-ink">
                  Ecouter mes phrases
                </h1>
              </div>
            </div>

            <div className="mt-5 rounded-[30px] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Phrase selectionnee
              </p>
              <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                {activePhrase || "Choisis une phrase a ecouter"}
              </p>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              className="min-h-16 rounded-[26px] px-8"
              onClick={() => speakText(activePhrase)}
              disabled={!activePhrase}
            >
              <Volume2 className="h-5 w-5" />
              Lire maintenant
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <Card title="Recherche">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Chercher une phrase..."
                className="focus-ring min-h-14 w-full rounded-2xl border border-softBlue/20 bg-white pl-12 pr-4 text-sm font-semibold text-ink placeholder:text-slate-400"
              />
            </label>
          </Card>

        </aside>

        <Card title="Historique des phrases">
          <div className="grid gap-4">
            {phrases.map((item, index) => (
              <article
                key={item.id}
                className="rounded-[28px] bg-slate-50 p-5 transition hover:bg-softBlue/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-slateBlue shadow-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-extrabold text-ink">
                        {item.sentence}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Button className="rounded-2xl" onClick={() => playPhrase(item.sentence)}>
                    <Volume2 className="h-4 w-4" />
                    Lire
                  </Button>
                </div>
              </article>
            ))}

            {!phrases.length ? (
              <div className="rounded-[28px] bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-500">Aucune phrase trouvee.</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ListenPhrases;
