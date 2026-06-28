import { useEffect, useMemo, useState } from "react";
import { Edit3, FileText, Trash2, UserCheck, UserX } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import SearchBar from "../../components/common/SearchBar";
import { createUserApi, deleteUserApi, listUsersApi, updateUserApi, updateUserStatusApi } from "../../services/usersApi";
import { getKidProgressApi, listKidsApi } from "../../services/domainApi";
import { ROLES } from "../../utils/roles";
import {
  buildKidMetrics,
  getEntityId,
  getChildrenForParent,
} from "../../utils/therapistMetrics";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

function PatientAccounts() {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deletingParent, setDeletingParent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    listUsersApi({ role: ROLES.PARENT })
      .then((apiUsers) => {
        setUsers(apiUsers);
      })
      .catch(() => {
        setUsers([]);
      });
    listKidsApi()
      .then(async (kids) => {
        const kidsWithProgress = await Promise.all(
          kids.map(async (kid) => {
            try {
              const progress = await getKidProgressApi(kid.id);
              return buildKidMetrics(kid, progress);
            } catch (_error) {
              return buildKidMetrics(kid);
            }
          }),
        );
        setPatients(kidsWithProgress);
      })
      .catch(() => setPatients([]));
  }, []);

  const parents = useMemo(
    () => users.filter((user) => user.role === ROLES.PARENT),
    [users],
  );

  const filteredParents = useMemo(
    () =>
      parents.filter((parent) =>
        `${parent.name} ${parent.email} ${parent.phone || ""} ${parent.address || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [parents, search],
  );

  const formatChildSummary = (child) => {
    const scoreLabel = typeof child.score === "number" ? `Score ${child.score}%` : "Score non disponible";
    return `${child.name} - ${scoreLabel} - ${child.scenarioCount || 0} scenario(s)`;
  };

  const getDisplayChildrenForParent = (parent) => {
    const childrenById = new Map();
    [...(parent.children || []), ...getChildrenForParent(parent, patients)].forEach((child) => {
      const childKey = String(child.name || getEntityId(child) || "").trim().toLowerCase();
      if (!childKey) return;
      childrenById.set(childKey, { ...childrenById.get(childKey), ...child });
    });
    return [...childrenById.values()];
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
  };

  const validateForm = () => {
    const passwordRequired = !editingParent;
    if (!form.name.trim() || !form.email.trim() || (passwordRequired && !form.password)) {
      setError("Le nom, l'email et le mot de passe sont obligatoires.");
      return false;
    }

    if (passwordRequired && form.password !== form.confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return false;
    }

    return true;
  };

  const addParent = async () => {
    if (!validateForm()) return;

    try {
      const created = await createUserApi({ ...form, role: ROLES.PARENT });
      setUsers((current) => [created, ...current]);
    } catch (error) {
      setError(error.message);
      return;
    }
    setOpenAdd(false);
    resetForm();
  };

  const openEditModal = (parent) => {
    setEditingParent(parent);
    setForm({
      name: parent.name,
      email: parent.email,
      phone: parent.phone || "",
      address: parent.address || "",
      password: "",
      confirmPassword: "",
    });
    setError("");
  };

  const updateParent = async () => {
    if (!validateForm()) return;

    try {
      const updated = await updateUserApi(editingParent.id, form);
      setUsers((current) => current.map((user) => (user.id === editingParent.id ? updated : user)));
      setEditingParent(null);
      resetForm();
    } catch (error) {
      setError(error.message);
    }
  };

  const deleteParent = async () => {
    try {
      await deleteUserApi(deletingParent.id);
      setUsers((current) => current.filter((user) => user.id !== deletingParent.id));
      setDeletingParent(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const updateParentStatus = async (parent, isActive) => {
    try {
      const updated = await updateUserStatusApi(parent.id, isActive);
      setUsers((current) => current.map((user) => (user.id === parent.id ? updated : user)));
    } catch (error) {
      setError(error.message);
    }
  };

  const closeAddModal = () => {
    setOpenAdd(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingParent(null);
    resetForm();
  };

  const exportParentsPdf = () => {
    const rows = filteredParents
      .map((parent) => {
        const childNames = getDisplayChildrenForParent(parent).map(formatChildSummary);
        return `
          <tr>
            <td>${parent.name}</td>
            <td>${parent.email}</td>
            <td>${parent.phone || "Non renseigne"}</td>
            <td>${parent.address || "Non renseignee"}</td>
            <td>${parent.isActive === false ? "Inactif" : "Actif"}</td>
            <td>${childNames.length}</td>
            <td>${childNames.join(", ") || "Aucun"}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des parents</title>
          <style>
            body { font-family: Arial, sans-serif; color: #24334b; padding: 32px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 0 0 24px; color: #536179; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #dbeafe; padding: 10px; text-align: left; vertical-align: top; }
            th { background: #eef6ff; }
          </style>
        </head>
        <body>
          <h1>Liste des parents</h1>
          <p>Auto Connect - Export PDF</p>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Adresse</th>
                <th>Statut</th>
                <th>Nombre enfants</th>
                <th>Enfants</th>
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

  const renderParentForm = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        id="parent-name"
        label="Nom"
        value={form.name}
        onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
      />
      <Input
        id="parent-email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
      />
      <Input
        id="parent-phone"
        label="Telephone"
        value={form.phone}
        onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
      />
      <Input
        id="parent-address"
        label="Adresse"
        value={form.address}
        onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
      />
      <Input
        id="parent-password"
        label="Mot de passe"
        type="password"
        value={form.password}
        onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
      />
      <Input
        id="parent-confirm-password"
        label="Confirmer le mot de passe"
        type="password"
        value={form.confirmPassword}
        onChange={(e) =>
          setForm((current) => ({ ...current, confirmPassword: e.target.value }))
        }
      />
      {error ? <p className="text-sm font-semibold text-danger md:col-span-2">{error}</p> : null}
    </div>
  );

  return (
    <Card
      title="Gestion des parents"
      action={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={exportParentsPdf}>
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => setOpenAdd(true)}>Ajouter parent</Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Le therapeute cree et gere ici les comptes parents. Chaque parent pourra ensuite
        ajouter ses enfants et se connecter depuis le login.
      </p>
      <div className="max-w-xl">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un parent..." />
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Nom</th>
              <th className="py-3">Email</th>
              <th className="py-3">Telephone</th>
              <th className="py-3">Adresse</th>
              <th className="py-3">Statut</th>
              <th className="py-3">Enfants</th>
              <th className="py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => {
              const childNames = getDisplayChildrenForParent(parent).map(formatChildSummary);

              return (
                <tr key={parent.id} className="border-t border-slate-100">
                  <td className="py-4 font-semibold">{parent.name}</td>
                  <td className="py-4 text-slate-500">{parent.email}</td>
                  <td className="py-4 text-slate-500">{parent.phone || "Non renseigne"}</td>
                  <td className="py-4 text-slate-500">{parent.address || "Non renseignee"}</td>
                  <td className="py-4 text-slate-500">{parent.isActive === false ? "Inactif" : "Actif"}</td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <Badge tone="secondary">{childNames.length} enfant(s)</Badge>
                      <p className="max-w-[220px] text-xs text-slate-500">
                        {childNames.join(", ") || "Aucun enfant"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Modifier parent"
                        onClick={() => openEditModal(parent)}
                        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={parent.isActive === false ? "Activer parent" : "Desactiver parent"}
                        onClick={() => updateParentStatus(parent, parent.isActive === false)}
                        className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                          parent.isActive === false
                            ? "bg-success/10 text-success hover:bg-success/15"
                            : "bg-warning/10 text-warning hover:bg-warning/15"
                        }`}
                      >
                        {parent.isActive === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        aria-label="Supprimer parent"
                        onClick={() => setDeletingParent(parent)}
                        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger transition hover:bg-danger/15"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={openAdd}
        title="Ajouter un parent"
        onClose={closeAddModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeAddModal}>
              Annuler
            </Button>
            <Button onClick={addParent}>Creer</Button>
          </>
        }
      >
        {renderParentForm()}
      </Modal>

      <Modal
        open={Boolean(editingParent)}
        title="Modifier parent"
        onClose={closeEditModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeEditModal}>
              Annuler
            </Button>
            <Button onClick={updateParent}>Enregistrer</Button>
          </>
        }
      >
        {renderParentForm()}
      </Modal>

      <Modal
        open={Boolean(deletingParent)}
        title="Confirmer la suppression"
        onClose={() => setDeletingParent(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingParent(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={deleteParent}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Voulez-vous vraiment supprimer le parent{" "}
            <span className="font-semibold text-ink">{deletingParent?.name}</span> ? Les
            enfants lies a ce parent seront aussi retires du suivi.
          </p>
        </div>
      </Modal>
    </Card>
  );
}

export default PatientAccounts;
