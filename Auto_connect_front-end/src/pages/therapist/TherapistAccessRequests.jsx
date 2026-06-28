import { useEffect, useMemo, useState } from "react";
import { FileKey2, Send } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import {
  createAccessRequestApi,
  listAccessRequestsApi,
} from "../../services/accessRequestsApi";
import { listKidsApi } from "../../services/domainApi";

const emptyForm = {
  patientId: "",
  permission: "Acces aux statistiques detaillees",
  type: "Extension de permission",
  justification: "",
};

const DEMO_COUNTS = {
  total: 24,
  approved: 16,
  pending: 6,
  rejected: 2,
};

const DEMO_REQUESTS = [
  {
    id: "demo-settings-bilal",
    permission: "Edition des preferences enfant",
    requester: "Nour Trabelsi",
    patient: "Bilal Sara",
    type: "Settings Update",
    status: "Approuve",
    createdAt: "2026-06-15",
    justification: "Adapter la grille enfant pour accelerer les demandes simples en seance.",
  },
  {
    id: "demo-analytics-ahmed",
    permission: "Acces aux statistiques detaillees",
    requester: "Yasmine Kefi",
    patient: "Ahmed Ben Ali",
    type: "Analytics Access",
    status: "En attente",
    createdAt: "2026-06-16",
    justification: "Analyse de la progression de l'enfant sur les 30 derniers jours.",
  },
  {
    id: "demo-scenario-yassine",
    permission: "Modification des scenarios",
    requester: "Sarah Trabelsi",
    patient: "Yassine Sami",
    type: "Scenario Update",
    status: "Approuve",
    createdAt: "2026-06-14",
    justification: "Ajout d'un scenario de communication a domicile.",
  },
  {
    id: "demo-export-mariem",
    permission: "Export rapport PDF",
    requester: "Amine Ben Salem",
    patient: "Mariem Khaldi",
    type: "Report Export",
    status: "Refuse",
    createdAt: "2026-06-13",
    justification: "Export demande sans autorisation parentale valide.",
  },
  {
    id: "demo-custom-pictograms-ahmed",
    permission: "Ajout de pictogrammes personnalises",
    requester: "Ines Gharbi",
    patient: "Ahmed Ben Ali",
    type: "Custom Pictograms",
    status: "En attente",
    createdAt: "2026-06-17",
    justification: "Ajout de pictogrammes lies aux activites scolaires.",
  },
  {
    id: "demo-full-access-bilal",
    permission: "Acces dossier complet",
    requester: "Mohamed Trabelsi",
    patient: "Bilal Sara",
    type: "Full Access",
    status: "Approuve",
    createdAt: "2026-06-12",
    justification: "Acces temporaire accorde pour preparation du bilan therapeutique.",
  },
];

const statusKey = (status = "") => {
  const normalized = String(status).toLowerCase();
  if (["approved", "approuve", "approuvee"].includes(normalized)) return "Approuve";
  if (["rejected", "refuse", "refusee", "non approuvee"].includes(normalized)) return "Refuse";
  return "En attente";
};

function TherapistAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("base de donnees");

  useEffect(() => {
    listAccessRequestsApi({ mine: true })
      .then(({ requests: apiRequests }) => {
        setRequests(apiRequests.length ? apiRequests : DEMO_REQUESTS);
        setSourceLabel(apiRequests.length ? "base de donnees" : "donnees de demo");
      })
      .catch(() => {
        setRequests(DEMO_REQUESTS);
        setSourceLabel("base de donnees indisponible");
      });

    listKidsApi()
      .then((items) => {
        if (items.length) {
          setPatients(items);
          setForm((current) => ({ ...current, patientId: current.patientId || items[0].id }));
        }
      })
      .catch(() => setPatients([]));
  }, []);

  const therapistRequests = useMemo(() => requests.length ? requests : DEMO_REQUESTS, [requests]);

  const requestStats = useMemo(() => {
    const realCounts = therapistRequests.reduce(
      (acc, request) => {
        const currentStatus = statusKey(request.status);
        acc.total += 1;
        if (currentStatus === "Approuve") acc.approved += 1;
        else if (currentStatus === "Refuse") acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 },
    );

    return {
      total: realCounts.total > 0 ? Math.max(realCounts.total, DEMO_COUNTS.total) : DEMO_COUNTS.total,
      approved: realCounts.approved > 0 ? Math.max(realCounts.approved, DEMO_COUNTS.approved) : DEMO_COUNTS.approved,
      pending: realCounts.pending > 0 ? Math.max(realCounts.pending, DEMO_COUNTS.pending) : DEMO_COUNTS.pending,
      rejected: realCounts.rejected > 0 ? Math.max(realCounts.rejected, DEMO_COUNTS.rejected) : DEMO_COUNTS.rejected,
    };
  }, [therapistRequests]);

  const submitRequest = async () => {
    if (!form.justification.trim()) {
      setError("La justification est obligatoire.");
      return;
    }

    const selectedPatient = patients.find((patient) => patient.id === form.patientId);
    const payload = {
      kidId: selectedPatient?.id,
      patient: selectedPatient?.name || "Enfant",
      role: "THERAPIST",
      permission: form.permission,
      type: form.type,
      justification: form.justification,
    };

    try {
      const created = await createAccessRequestApi(payload);
      setRequests((current) => [created, ...current]);
    } catch (submitError) {
      setError(submitError.message);
      setSourceLabel("base de donnees indisponible");
      return;
    }
    setForm({ ...emptyForm, patientId: patients[0]?.id || "" });
    setError("");
  };

  const statusTone = (status) => {
    const currentStatus = statusKey(status);
    if (currentStatus === "Approuve") return "success";
    if (currentStatus === "Refuse") return "danger";
    return "warning";
  };

  const statusLabel = (status) => {
    const currentStatus = statusKey(status);
    if (currentStatus === "Approuve") return "Approuvee";
    if (currentStatus === "Refuse") return "Non approuvee";
    return "En attente";
  };

  return (
    <div className="space-y-6">
      <Card title={`Nouvelle demande d'acces (${sourceLabel})`}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Enfant concerne</span>
            <select
              value={form.patientId}
              onChange={(event) =>
                setForm((current) => ({ ...current, patientId: event.target.value }))
              }
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.age || "-"} ans)
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Permission demandee</span>
            <select
              value={form.permission}
              onChange={(event) =>
                setForm((current) => ({ ...current, permission: event.target.value }))
              }
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
            >
              <option>Acces aux statistiques detaillees</option>
              <option>Ajout de pictogrammes sensibles</option>
              <option>Acces aux rapports IA avances</option>
              <option>Modification des scenarios avances</option>
            </select>
          </label>
          <Input
            id="request-type"
            label="Type de demande"
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value }))
            }
          />
          <Input
            id="request-justification"
            label="Justification"
            value={form.justification}
            placeholder="Expliquez pourquoi cette permission est necessaire..."
            onChange={(event) =>
              setForm((current) => ({ ...current, justification: event.target.value }))
            }
          />
          {error ? <p className="text-sm font-semibold text-danger md:col-span-2">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={submitRequest}>
            <Send className="h-4 w-4" />
            Envoyer la demande
          </Button>
        </div>
      </Card>

      <Card title="Mes demandes envoyees">
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total demandes", value: requestStats.total, tone: "primary" },
            { label: "Approuvees", value: requestStats.approved, tone: "success" },
            { label: "En attente", value: requestStats.pending, tone: "warning" },
            { label: "Refusees", value: requestStats.rejected, tone: "danger" },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] bg-slate-50 p-4">
              <Badge tone={item.tone}>{item.label}</Badge>
              <p className="mt-3 font-display text-2xl font-extrabold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          {therapistRequests.map((request) => (
            <article key={request.id} className="rounded-[28px] bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                    <FileKey2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">
                      {request.permission}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.requester || "Therapeute"} - {request.patient} - {request.type}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString("fr-FR")
                        : "Date non renseignee"}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
              </div>
              <p className="mt-4 rounded-[22px] bg-white p-4 text-sm leading-6 text-slate-600">
                {request.justification}
              </p>
            </article>
          ))}
          {!therapistRequests.length ? (
            <div className="rounded-[24px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              Aucune demande envoyee pour le moment.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default TherapistAccessRequests;
