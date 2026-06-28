import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Trash2, UserPlus } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { childSessionApi } from "../../services/authApi";
import { createKidApi, deleteKidApi, listKidsApi } from "../../services/domainApi";
import { AUTH_STORAGE_KEY, PARENT_SHADOW_SESSION_KEY } from "../../utils/constants";
import { getStoredUser } from "../../utils/helpers";

const emptyForm = {
  firstName: "",
  lastName: "",
  age: "",
  level: "Debutant",
};

function ChildSession() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [deletingChild, setDeletingChild] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const children = useMemo(
    () => patients,
    [patients],
  );

  useEffect(() => {
    listKidsApi()
      .then((items) => {
        setPatients(items);
      })
      .catch(() => setPatients([]));
  }, []);

  const refresh = () => {
    listKidsApi().then(setPatients).catch(() => setPatients([]));
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setOpen(false);
    setForm(emptyForm);
    setError("");
  };

  const addChild = async () => {
    if (isSubmitting) return;

    const age = Number(form.age);
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    if (!firstName || !lastName || !form.age) {
      setError("Le prenom, le nom et l'age sont obligatoires.");
      return;
    }

    if (firstName.length < 2 || lastName.length < 2) {
      setError("Le prenom et le nom doivent contenir au moins 2 caracteres.");
      return;
    }

    if (Number.isNaN(age) || age < 2 || age > 25) {
      setError("L'age doit etre entre 2 et 25 ans.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const created = await createKidApi({
        firstName,
        lastName,
        age,
        level: form.level,
      });
      setPatients((current) => [created, ...current]);
      setOpen(false);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.message || "Impossible d'ajouter cet enfant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChildInterface = async (patient) => {
    const currentSession = getStoredUser();
    if (currentSession?.role === "PARENT") {
      localStorage.setItem(PARENT_SHADOW_SESSION_KEY, JSON.stringify(currentSession));
    }
    const account = await childSessionApi({ accessCode: patient.childCode || patient.sessionAccessCode });
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
    navigate("/child", { state: { welcome: true } });
  };

  const deleteChild = async () => {
    await deleteKidApi(deletingChild.id);
    setPatients((current) => current.filter((patient) => patient.id !== deletingChild.id));
    setDeletingChild(null);
  };

  return (
    <div className="grid gap-6">
      <Card
        title="Gestion des enfants"
        action={
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Ajouter enfant
          </Button>
        }
      >
        {children.length ? (
          <div className="overflow-hidden rounded-[24px] border border-softBlue/15 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-softBlue/10 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Enfant</th>
                    <th className="px-4 py-4">Age</th>
                    <th className="px-4 py-4">Niveau</th>
                    <th className="px-4 py-4">Acces enfant</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-softBlue/10">
                  {children.map((patient) => {
                    return (
                      <tr key={patient.id} className="bg-white transition hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-display text-base font-bold text-ink">
                            {patient.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-600">
                          {patient.age} ans
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone="secondary">{patient.level || patient.currentLevel}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Code enfant
                          </p>
                          <p className="mt-1 font-semibold text-slateBlue">
                            {patient.childCode || patient.sessionAccessCode}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              aria-label="Ouvrir interface enfant"
                              onClick={() => openChildInterface(patient)}
                              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue transition hover:bg-softBlue/25"
                            >
                              <LogIn className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Supprimer enfant"
                              onClick={() => setDeletingChild(patient)}
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
          </div>
        ) : (
          <div className="rounded-[28px] bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            Aucun enfant ajoute pour ce parent.
          </div>
        )}
      </Card>

      <Modal
        open={open}
        title="Ajouter un enfant"
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={addChild} disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="child-first-name"
            label="Prenom"
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({ ...current, firstName: event.target.value }))
            }
          />
          <Input
            id="child-last-name"
            label="Nom"
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
          />
          <Input
            id="child-age"
            label="Age"
            type="number"
            min="2"
            max="25"
            value={form.age}
            onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
          />
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Niveau</span>
            <select
              className="focus-ring w-full rounded-2xl border border-softBlue/20 px-4 py-3"
              value={form.level}
              onChange={(event) =>
                setForm((current) => ({ ...current, level: event.target.value }))
              }
            >
              <option>Debutant</option>
              <option>Intermediaire</option>
              <option>Avance</option>
            </select>
          </label>

          <Input
            id="child-code-preview"
            label="Code enfant"
            value="Genere automatiquement par le backend"
            readOnly
            wrapperClassName="md:col-span-2"
            className="bg-softBlue/10 text-slateBlue"
          />

          {error ? <p className="text-sm font-semibold text-danger md:col-span-2">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingChild)}
        title="Confirmer la suppression"
        onClose={() => setDeletingChild(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingChild(null)}>
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
            Voulez-vous vraiment supprimer{" "}
            <span className="font-semibold text-ink">{deletingChild?.name}</span> ?
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default ChildSession;
