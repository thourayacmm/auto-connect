import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppPreferences } from "../../context/AppPreferences";
import { getRedirectForRole } from "../../utils/helpers";
import { childSessionApi, loginApi } from "../../services/authApi";
import { ROLES } from "../../utils/roles";
import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";

const roleOptions = [
  { label: "Admin", value: ROLES.ADMIN },
  { label: "Therapeute", value: ROLES.THERAPIST },
  { label: "Parent", value: ROLES.PARENT },
  { label: "Enfant", value: ROLES.CHILD },
];

function LoginPanel({ compact = false, onSuccess }) {
  const { t } = useAppPreferences();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "admin@autoconnect.app",
    password: "demo123",
    childCode: "",
    role: ROLES.ADMIN,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChildLogin = form.role === ROLES.CHILD;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const user = isChildLogin
        ? await childSessionApi({ accessCode: form.childCode })
        : await loginApi({ email: form.email, password: form.password, role: form.role });

      localStorage.setItem("auto-connect-user", JSON.stringify(user));
      onSuccess?.(user);
      navigate(getRedirectForRole(user.role), { state: { welcome: true } });
    } catch (apiError) {
      setError(apiError.message || (isChildLogin ? t("loginChildCodeError") : t("loginError")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className={
        compact
          ? "border-0 bg-transparent p-0 shadow-none"
          : "mx-auto w-full max-w-[460px] p-7 md:p-8"
      }
    >
      <div className="mb-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-softBlue to-lilac text-2xl font-black text-white">
          AC
        </div>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-slateBlue">{t("loginTitle")}</h2>
        <p className="mt-2 text-sm text-slate-500">{t("loginSubtitle")}</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <span className="text-sm font-semibold text-ink">{t("loginRoleSection")}</span>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                type="button"
                className={`focus-ring rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  form.role === role.value
                    ? "border-slateBlue bg-slateBlue text-white"
                    : "border-softBlue/20 bg-white text-slate-600"
                }`}
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    role: role.value,
                    email: role.value === ROLES.CHILD ? "" : current.email,
                    password: role.value === ROLES.CHILD ? "" : current.password,
                    childCode: "",
                  }));
                }}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {isChildLogin ? (
          <Input
            id="child-code"
            label="Code enfant"
            value={form.childCode}
            onChange={(event) =>
              setForm((current) => ({ ...current, childCode: event.target.value }))
            }
            placeholder="KID-SAMI01"
          />
        ) : (
          <>
            <Input
              id="email"
              label={t("loginEmail")}
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="email@autoconnect.app"
            />
            <Input
              id="password"
              label={t("loginPassword")}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="demo123"
            />
          </>
        )}

        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : t("loginButton")}
        </Button>
      </form>
    </Card>
  );
}

export default LoginPanel;
