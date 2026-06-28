import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import SearchBar from "../../components/common/SearchBar";
import { deleteKidApi, getKidProgressApi, listKidsApi } from "../../services/domainApi";
import { buildKidMetrics } from "../../utils/therapistMetrics";

function FollowedChildren() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);

  useEffect(() => {
    let mounted = true;

    listKidsApi()
      .then(async (items) => {
        const progressEntries = await Promise.allSettled(
          items.map(async (patient) => ({
            id: patient.id,
            progress: await getKidProgressApi(patient.id),
          })),
        );

        if (!mounted) return;

        const progressMap = progressEntries.reduce((acc, entry) => {
          if (entry.status === "fulfilled") {
            acc[entry.value.id] = entry.value.progress;
          }
          return acc;
        }, {});

        setPatients(items.map((patient) => buildKidMetrics(patient, progressMap[patient.id])));
      })
      .catch(() => {
        if (mounted) setPatients([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const therapistPatients = useMemo(() => patients, [patients]);

  const filteredPatients = useMemo(
    () =>
      therapistPatients.filter((patient) => {
        const haystack = [
          patient.name,
          patient.age,
          patient.level,
          patient.parentName,
          patient.currentScore,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesAge =
          ageFilter === "all" ||
          (ageFilter === "5-7" && patient.age >= 5 && patient.age <= 7) ||
          (ageFilter === "8-10" && patient.age >= 8 && patient.age <= 10);
        const matchesLevel = levelFilter === "all" || patient.level === levelFilter;

        return matchesSearch && matchesAge && matchesLevel;
      }),
    [ageFilter, levelFilter, search, therapistPatients],
  );

  const deleteChild = async () => {
    await deleteKidApi(deletingPatient.id);
    setPatients((items) => items.filter((patient) => patient.id !== deletingPatient.id));
    setDeletingPatient(null);
    setSelectedPatient((current) => (current?.id === deletingPatient.id ? null : current));
  };

  const exportChildrenPdf = () => {
    const rows = filteredPatients
      .map(
        (patient) => `
          <tr>
            <td>${patient.name}</td>
            <td>${patient.age ?? "-"}</td>
            <td>${patient.level || "-"}</td>
            <td>${patient.parentName || "-"}</td>
            <td>${typeof patient.progressPercent === "number" ? `${patient.progressPercent}%` : "—"}</td>
            <td>${patient.totalSessions}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Enfants suivis</title>
          <style>
            body { font-family: Arial, sans-serif; color: #24334b; padding: 32px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 0 0 24px; color: #536179; }
            table { border-collapse: collapse; width: 100%; font-size: 13px; }
            th, td { border: 1px solid #dbeafe; padding: 12px; text-align: left; }
            th { background: #eef6ff; }
          </style>
        </head>
        <body>
          <h1>Enfants suivis</h1>
          <p>Auto Connect - Export dynamique backend</p>
          <table>
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Age</th>
                <th>Niveau</th>
                <th>Parent</th>
                <th>Score actuel</th>
                <th>Sessions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card
      title="Enfants suivis"
      action={
        <Button variant="secondary" onClick={exportChildrenPdf}>
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un enfant..." />
        <select
          value={ageFilter}
          onChange={(event) => setAgeFilter(event.target.value)}
          className="focus-ring rounded-2xl border border-softBlue/20 px-4 py-3"
        >
          <option value="all">Tous les ages</option>
          <option value="5-7">5-7 ans</option>
          <option value="8-10">8-10 ans</option>
        </select>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          className="focus-ring rounded-2xl border border-softBlue/20 px-4 py-3"
        >
          <option value="all">Tous les niveaux</option>
          <option value="Debutant">Debutant</option>
          <option value="Intermediaire">Intermediaire</option>
          <option value="Avance">Avance</option>
        </select>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Enfant</th>
              <th className="py-3">Age</th>
              <th className="py-3">Niveau</th>
              <th className="py-3">Parent</th>
              <th className="py-3">Score actuel</th>
              <th className="py-3">Sessions</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="border-t border-slate-100">
                <td className="py-4 font-semibold">{patient.name}</td>
                <td className="py-4">{patient.age || "-"}</td>
                <td className="py-4">
                  <Badge tone="secondary">{patient.level || "Niveau non defini"}</Badge>
                </td>
                <td className="py-4 text-slate-500">{patient.parentName || "-"}</td>
                <td className="py-4 text-slate-500">{typeof patient.progressPercent === "number" ? `${patient.progressPercent}%` : "—"}</td>
                <td className="py-4 text-slate-500">{patient.totalSessions}</td>
                <td className="py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Voir details enfant"
                      onClick={() => setSelectedPatient(patient)}
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer enfant"
                      onClick={() => setDeletingPatient(patient)}
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger transition hover:bg-danger/15"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selectedPatient)}
        title="Details enfant"
        onClose={() => setSelectedPatient(null)}
        panelClassName="max-w-xl"
      >
        <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Nom</p>
            <p className="mt-1 font-semibold text-ink">{selectedPatient?.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Parent</p>
            <p className="mt-1 font-semibold text-ink">{selectedPatient?.parentName || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Age</p>
            <p className="mt-1 text-slate-600">{selectedPatient?.age || "-"} ans</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Niveau</p>
            <p className="mt-1 text-slate-600">{selectedPatient?.level || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Score actuel</p>
            <p className="mt-1 text-slate-600">{typeof selectedPatient?.currentScore === "number" ? `${selectedPatient.currentScore}%` : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Sessions</p>
            <p className="mt-1 text-slate-600">{selectedPatient?.totalSessions ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Duree moyenne</p>
            <p className="mt-1 text-slate-600">
              {selectedPatient?.averageSessionDuration ?? 0} min
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Code enfant</p>
            <p className="mt-1 text-slate-600">{selectedPatient?.childCode || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-400">Pictogrammes frequents</p>
            <p className="mt-1 text-slate-600">
              {selectedPatient?.frequentWords?.join(", ") || "Aucun pictogramme remonte"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-400">Phrases recentes</p>
            <p className="mt-1 text-slate-600">
              {selectedPatient?.recentPhrases?.join(" | ") || "Aucune phrase remontee"}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingPatient)}
        title="Confirmer la suppression"
        onClose={() => setDeletingPatient(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingPatient(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={deleteChild}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Voulez-vous vraiment supprimer l'enfant{" "}
            <span className="font-semibold text-ink">{deletingPatient?.name}</span> du suivi ?
          </p>
        </div>
      </Modal>
    </Card>
  );
}

export default FollowedChildren;
