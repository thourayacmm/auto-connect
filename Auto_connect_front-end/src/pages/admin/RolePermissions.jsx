import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import { listAccessControlApi, updateAccessControlApi } from "../../services/adminApi";

const ROLE_ORDER = ["admin", "therapist", "parent", "child"];

const ROLE_LABELS = {
  admin: "Admin",
  therapist: "Therapeute",
  parent: "Parent",
  child: "Enfant",
};

const ACTION_LABELS = {
  "users:read": "Lire les utilisateurs",
  "users:write": "Modifier les utilisateurs",
  "kids:read": "Lire les enfants",
  "kids:write": "Modifier les enfants",
  "pictograms:read": "Lire les pictogrammes",
  "pictograms:write": "Modifier les pictogrammes",
  "categories:read": "Lire les categories",
  "categories:write": "Modifier les categories",
  "scenarios:read": "Lire les scenarios",
  "scenarios:write": "Modifier les scenarios",
  "history:read": "Lire l'historique",
  "history:write": "Modifier l'historique",
  "sessions:read": "Lire les sessions",
  "sessions:write": "Modifier les sessions",
  "analytics:read": "Voir les statistiques",
  "ai:use": "Utiliser l'IA",
  "access-control:write": "Modifier les permissions",
};

const FALLBACK_ACTIONS = [
  "users:read",
  "users:write",
  "kids:read",
  "kids:write",
  "pictograms:read",
  "pictograms:write",
  "categories:read",
  "categories:write",
  "scenarios:read",
  "scenarios:write",
  "history:read",
  "history:write",
  "sessions:read",
  "sessions:write",
  "analytics:read",
  "ai:use",
  "access-control:write",
];

const RESOURCE_LABELS = {
  users: "Utilisateurs",
  kids: "Enfants",
  pictograms: "Pictogrammes",
  categories: "Categories",
  scenarios: "Scenarios",
  history: "Historique",
  sessions: "Sessions",
  analytics: "Statistiques",
  ai: "Assistant IA",
  "access-control": "Controle d'acces",
};

const buildFallbackEntries = () =>
  ROLE_ORDER.flatMap((role) => {
    const actionsByResource = FALLBACK_ACTIONS.reduce((acc, action) => {
      const resource = action.split(":")[0];
      acc[resource] = [...(acc[resource] || []), action];
      return acc;
    }, {});

    return Object.entries(actionsByResource).map(([resource, actions]) => ({
      role,
      resource,
      actions: role === "admin" ? actions : [],
    }));
  });

const normalizeEntries = (entries) =>
  [...entries]
    .map((entry) => ({
      role: String(entry.role || "").toLowerCase(),
      resource: String(entry.resource || "").toLowerCase(),
      actions: [...new Set((entry.actions || []).map((action) => String(action).trim()).filter(Boolean))].sort(),
    }))
    .filter((entry) => entry.role && entry.resource)
    .sort((left, right) => {
      const roleDiff = ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role);
      if (roleDiff !== 0) return roleDiff;
      return left.resource.localeCompare(right.resource);
    });

function RolePermissions() {
  const [entries, setEntries] = useState(buildFallbackEntries());
  const [savedEntries, setSavedEntries] = useState(buildFallbackEntries());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("backend");

  useEffect(() => {
    listAccessControlApi()
      .then((items) => {
        const normalized = normalizeEntries(items);
        const nextEntries = normalized.length ? normalized : buildFallbackEntries();
        setEntries(nextEntries);
        setSavedEntries(nextEntries);
        setSourceLabel("backend");
      })
      .catch(() => {
        const fallbackEntries = buildFallbackEntries();
        setEntries(fallbackEntries);
        setSavedEntries(fallbackEntries);
        setSourceLabel("backend indisponible");
      });
  }, []);

  const groupedEntries = useMemo(
    () =>
      ROLE_ORDER.map((role) => ({
        role,
        items: entries.filter((entry) => entry.role === role),
      })).filter((group) => group.items.length),
    [entries],
  );

  const toggleAction = (role, resource, action) => {
    setSaved(false);
    setEntries((current) =>
      current.map((entry) => {
        if (entry.role !== role || entry.resource !== resource) return entry;
        const hasAction = entry.actions.includes(action);
        const nextActions = hasAction
          ? entry.actions.filter((item) => item !== action)
          : [...entry.actions, action].sort();
        return { ...entry, actions: nextActions };
      }),
    );
  };

  const confirmSave = async () => {
    const normalizedEntries = normalizeEntries(entries);

    try {
      const response = await updateAccessControlApi(normalizedEntries);
      const nextEntries = normalizeEntries(response.length ? response : normalizedEntries);
      setEntries(nextEntries);
      setSavedEntries(nextEntries);
      setSaved(true);
      setSourceLabel("backend");
    } catch (_error) {
      setEntries(savedEntries);
      setSourceLabel("backend indisponible");
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card
        title={`Roles et permissions (${sourceLabel})`}
        action={<Button onClick={() => setConfirmOpen(true)}>Sauvegarder</Button>}
      >
        {saved ? (
          <div className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            Les permissions ont ete mises a jour depuis le backend.
          </div>
        ) : null}

        <div className="space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.role} className="rounded-[28px] bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-ink">
                  {ROLE_LABELS[group.role] || group.role}
                </h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {group.items.length} ressources
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {group.items.map((entry) => {
                  const resourceActions = FALLBACK_ACTIONS.filter((action) =>
                    action.startsWith(`${entry.resource}:`),
                  );
                  const availableActions = [...new Set([...resourceActions, ...entry.actions])].sort();

                  return (
                    <div key={`${entry.role}-${entry.resource}`} className="rounded-[24px] bg-white p-4">
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Ressource
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-ink">
                          {RESOURCE_LABELS[entry.resource] || entry.resource}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {availableActions.map((action) => (
                          <label
                            key={action}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={entry.actions.includes(action)}
                              onChange={() => toggleAction(entry.role, entry.resource, action)}
                            />
                            <span className="text-sm font-semibold text-ink">
                              {ACTION_LABELS[action] || action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        title="Confirmer la modification"
        onClose={() => setConfirmOpen(false)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEntries(savedEntries);
                setConfirmOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button onClick={confirmSave}>Confirmer</Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Les permissions seront enregistrees avec le format reel du backend:
            role, ressource et actions autorisees.
          </p>
        </div>
      </Modal>
    </>
  );
}

export default RolePermissions;
