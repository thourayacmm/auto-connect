import { useEffect, useMemo, useState } from "react";
import { useAppPreferences } from "../../context/AppPreferences";
import Card from "../../components/common/Card";
import SearchBar from "../../components/common/SearchBar";
import PictogramGrid from "../../components/pictograms/PictogramGrid";
import { createHistoryApi, listPictogramsApi } from "../../services/domainApi";
import { getStoredUser, speakText } from "../../utils/helpers";

function SearchPictograms() {
  const { t } = useAppPreferences();
  const [query, setQuery] = useState("");
  const [pictograms, setPictograms] = useState([]);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    listPictogramsApi({ isActive: "true", ...(user?.age ? { age: user.age } : {}) })
      .then((items) => {
        setPictograms(items);
      })
      .catch(() => setPictograms([]));
  }, []);

  const results = useMemo(
    () =>
      pictograms.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [pictograms, query],
  );

  const addPictogramToHistory = async (pictogram) => {
    const user = getStoredUser();
    const kidId = user?.kidId || user?._id || user?.id;
    const sentence = pictogram.label?.trim();
    if (!kidId || !sentence) return;

    setSavingId(pictogram.id);
    setMessage("");
    speakText(sentence);

    try {
      await createHistoryApi({
        kidId,
        phraseText: sentence,
        pictograms: /^[a-f\d]{24}$/i.test(String(pictogram.id)) ? [pictogram.id] : [],
        source: "manual",
      });
      setMessage(`${sentence} ajoute a l'historique.`);
    } catch (error) {
      setMessage(error.message || "Impossible d'ajouter ce pictogramme.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card title={t("childSearchTitle")}>
        <SearchBar value={query} onChange={setQuery} placeholder={t("childSearchPlaceholder")} />
        {message ? (
          <p className="mt-3 rounded-2xl bg-softBlue/10 px-4 py-3 text-sm font-bold text-slateBlue">
            {message}
          </p>
        ) : null}
      </Card>
      <PictogramGrid
        pictograms={results.length ? results : pictograms.slice(0, 6)}
        onSelect={addPictogramToHistory}
        large
      />
      {savingId ? (
        <p className="text-center text-sm font-bold text-slate-500">Ajout en cours...</p>
      ) : null}
    </div>
  );
}

export default SearchPictograms;
