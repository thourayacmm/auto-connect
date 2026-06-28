import { useEffect, useMemo, useState } from "react";
import { Edit3, FileText, Trash2, UserCheck, UserX } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import SearchBar from "../../components/common/SearchBar";
import { createUserApi, deleteUserApi, listUsersApi, updateUserApi, updateUserStatusApi } from "../../services/usersApi";
import { ROLES } from "../../utils/roles";

const emptyForm = {
  name: "",
  email: "",
  specialty: "",
  password: "",
  confirmPassword: "",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("backend");

  useEffect(() => {
    listUsersApi({ role: ROLES.THERAPIST })
      .then((apiUsers) => {
        setUsers(apiUsers);
        setSourceLabel("backend");
      })
      .catch(() => {
        setUsers([]);
        setSourceLabel("backend indisponible");
      });
  }, []);

  const therapists = useMemo(
    () => users.filter((user) => user.role === ROLES.THERAPIST),
    [users],
  );

  const filtered = useMemo(
    () =>
      therapists.filter((user) =>
        `${user.name} ${user.email} ${user.specialty || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [therapists, search],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
  };

  const validateForm = () => {
    const passwordRequired = !editingUser;
    if (!form.name.trim() || !form.email.trim() || !form.specialty.trim() || (passwordRequired && !form.password)) {
      setError("Tous les champs sont obligatoires.");
      return false;
    }

    if (passwordRequired && form.password !== form.confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return false;
    }

    return true;
  };

  const addTherapist = async () => {
    if (!validateForm()) return;

    try {
      const created = await createUserApi({ ...form, role: ROLES.THERAPIST });
      setUsers((current) => [created, ...current]);
    } catch (error) {
      setError(error.message);
      return;
    }
    setOpenAdd(false);
    resetForm();
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      specialty: user.specialty || "",
      password: "",
      confirmPassword: "",
    });
    setError("");
  };

  const updateTherapist = async () => {
    if (!validateForm()) return;

    try {
      const updated = await updateUserApi(editingUser.id, form);
      setUsers((current) => current.map((user) => (user.id === editingUser.id ? updated : user)));
      setEditingUser(null);
      resetForm();
    } catch (error) {
      setError(error.message);
    }
  };

  const deleteTherapist = async () => {
    try {
      await deleteUserApi(deletingUser.id);
      setUsers((current) => current.filter((user) => user.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const updateTherapistStatus = async (user, isActive) => {
    try {
      const updated = await updateUserStatusApi(user.id, isActive);
      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
    } catch (error) {
      setError(error.message);
    }
  };

  const closeAddModal = () => {
    setOpenAdd(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingUser(null);
    resetForm();
  };

  const exportTherapistsPdf = () => {
    const rows = filtered
      .map(
        (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.specialty || "Non renseignee"}</td>
            <td>${user.isActive === false ? "Inactif" : "Actif"}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des therapeutes</title>
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
          <h1>Liste des therapeutes</h1>
          <p>Auto Connect - Export PDF</p>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Specialite</th>
                <th>Statut</th>
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

  const renderTherapistForm = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        id="therapist-name"
        label="Nom"
        value={form.name}
        onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
      />
      <Input
        id="therapist-email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
      />
      <Input
        id="therapist-specialty"
        label="Specialite"
        value={form.specialty}
        onChange={(e) => setForm((current) => ({ ...current, specialty: e.target.value }))}
      />
      <Input
        id="therapist-password"
        label="Mot de passe"
        type="password"
        value={form.password}
        onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
      />
      <Input
        id="therapist-confirm-password"
        label="Confirmer le mot de passe"
        type="password"
        value={form.confirmPassword}
        onChange={(e) =>
          setForm((current) => ({ ...current, confirmPassword: e.target.value }))
        }
        className="md:col-span-2"
      />
      {error ? <p className="text-sm font-semibold text-danger md:col-span-2">{error}</p> : null}
    </div>
  );

  return (
    <Card
      title="Gestion des therapeutes"
      action={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={exportTherapistsPdf}>
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => setOpenAdd(true)}>Ajouter therapeute</Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Dans ce flux, l'administrateur cree les comptes therapeutes qui pourront ensuite ajouter des parents.
      </p>
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un therapeute..." />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Nom</th>
              <th className="py-3">Email</th>
              <th className="py-3">Specialite</th>
              <th className="py-3">Role</th>
              <th className="py-3">Statut</th>
              <th className="py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="py-4 font-semibold">{user.name}</td>
                <td className="py-4 text-slate-500">{user.email}</td>
                <td className="py-4 text-slate-500">{user.specialty || "Non renseignee"}</td>
                <td className="py-4">
                  <Badge tone="secondary">THERAPIST</Badge>
                </td>
                <td className="py-4 text-slate-500">{user.isActive === false ? "Inactif" : "Actif"}</td>
                <td className="py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Modifier therapeute"
                      onClick={() => openEditModal(user)}
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={user.isActive === false ? "Activer therapeute" : "Desactiver therapeute"}
                      onClick={() => updateTherapistStatus(user, user.isActive === false)}
                      className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                        user.isActive === false
                          ? "bg-success/10 text-success hover:bg-success/15"
                          : "bg-warning/10 text-warning hover:bg-warning/15"
                      }`}
                    >
                      {user.isActive === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer therapeute"
                      onClick={() => setDeletingUser(user)}
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
        open={openAdd}
        title="Ajouter un therapeute"
        onClose={closeAddModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeAddModal}>
              Annuler
            </Button>
            <Button onClick={addTherapist}>Creer</Button>
          </>
        }
      >
        {renderTherapistForm()}
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        title="Modifier therapeute"
        onClose={closeEditModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeEditModal}>
              Annuler
            </Button>
            <Button onClick={updateTherapist}>Enregistrer</Button>
          </>
        }
      >
        {renderTherapistForm()}
      </Modal>

      <Modal
        open={Boolean(deletingUser)}
        title="Confirmer la suppression"
        onClose={() => setDeletingUser(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingUser(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={deleteTherapist}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            Voulez-vous vraiment supprimer le therapeute{" "}
            <span className="font-semibold text-ink">{deletingUser?.name}</span> ?
          </p>
        </div>
      </Modal>
    </Card>
  );
}

export default UserManagement;
