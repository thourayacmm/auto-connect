import { useEffect, useMemo, useState } from "react";
import { Check, FileKey2, Search, X } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { listAccessRequestsApi, updateAccessRequestStatusApi } from "../../services/accessRequestsApi";

const filters = [
  { id: "all", label: "Toutes" },
  { id: "En attente", label: "En attente" },
  { id: "Approuve", label: "Approuvees" },
  { id: "Refuse", label: "Non approuvees" },
];

const statusKey = (status = "") => {
  const normalized = String(status).trim().toLowerCase();
  if (["approved", "approuve", "approuvee"].includes(normalized)) return "Approuve";
  if (["rejected", "refuse", "refusee", "non approuvee"].includes(normalized)) return "Refuse";
  return "En attente";
};

const isTherapistRequest = (request) => String(request.role || "").trim().toLowerCase() === "therapist";

function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sourceLabel, setSourceLabel] = useState("base de donnees");

  useEffect(() => {
    listAccessRequestsApi()
      .then(({ requests: apiRequests }) => {
        setRequests(apiRequests);
        setSourceLabel("base de donnees");
      })
      .catch(() => {
        setRequests([]);
        setSourceLabel("base de donnees indisponible");
      });
  }, []);

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        if (!isTherapistRequest(request)) return false;

        const currentStatus = statusKey(request.status);
        const matchesFilter = activeFilter === "all" || currentStatus === activeFilter;
        const matchesSearch = `${request.requester} ${request.patient} ${request.role} ${request.permission} ${request.type}`
          .toLowerCase()
          .includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
      }),
    [activeFilter, requests, search],
  );

  const updateStatus = async (id, status) => {
    const previousRequests = requests;
    const nextRequests = requests.map((request) =>
      request.id === id ? { ...request, status } : request,
    );
    setRequests(nextRequests);
    try {
      const updated = await updateAccessRequestStatusApi(id, status);
      setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (_error) {
      setSourceLabel("base de donnees indisponible");
      setRequests(previousRequests);
    }
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

  const roleTone = (role) => {
    if (role === "THERAPIST") return "primary";
    if (role === "PARENT") return "secondary";
    if (role === "CHILD") return "neutral";
    return "danger";
  };

  return (
    <div className="space-y-6">
      <Card
        title={`Demandes d'acces par role et permission (${sourceLabel})`}
        action={
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher role, permission..."
              className="focus-ring w-full rounded-2xl border border-softBlue/20 bg-white py-3 pl-11 pr-4 text-sm text-ink placeholder:text-slate-400"
            />
          </div>
        }
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`focus-ring rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter.id
                  ? "bg-slateBlue text-white shadow-card"
                  : "bg-slate-50 text-slate-600 hover:bg-softBlue/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const currentStatus = statusKey(request.status);
            const isPending = currentStatus === "En attente" && isTherapistRequest(request);

            return (
            <article
              key={request.id}
              className="rounded-[28px] border border-softBlue/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                    <FileKey2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink">
                        {request.requester}
                      </h3>
                      <Badge tone={roleTone(request.role)}>{request.role}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Enfant concerne: {request.patient}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
              </div>

              <div className="mt-5 grid gap-4 rounded-[24px] bg-slate-50 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Role</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{request.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Permission demandee
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{request.permission}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Statut admin</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {statusLabel(request.status)}
                  </p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">Justification</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {request.justification}
                  </p>
                </div>
              </div>

              {isPending ? (
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <Button variant="success" onClick={() => updateStatus(request.id, "Approuve")}>
                    <Check className="h-4 w-4" />
                    Approuver
                  </Button>
                  <Button variant="danger" onClick={() => updateStatus(request.id, "Refuse")}>
                    <X className="h-4 w-4" />
                    Refuser
                  </Button>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-right text-sm font-semibold text-slate-500">
                  {statusLabel(currentStatus)}
                </div>
              )}
            </article>
            );
          })}
        </div>

        {!filteredRequests.length ? (
          <div className="rounded-[24px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            Aucune demande ne correspond au filtre.
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default AccessRequests;
