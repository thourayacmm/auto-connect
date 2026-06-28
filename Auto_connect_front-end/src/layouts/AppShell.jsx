import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferences";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { DATA_CHANGED_EVENT } from "../utils/dataRefresh";
import {
  getParentShadowSession,
  getRoleLabel,
  getStoredUser,
  logoutUser,
  restoreParentShadowSession,
} from "../utils/helpers";

function AppShell({ role, user }) {
  const { t } = useAppPreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser() || user);
  const [parentShadowSession, setParentShadowSession] = useState(() => getParentShadowSession());
  const [dataVersion, setDataVersion] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCurrentUser(getStoredUser() || user);
    setParentShadowSession(getParentShadowSession());

    if (location.state?.welcome) {
      setShowWelcomeModal(true);
      const timer = window.setTimeout(() => {
        setShowWelcomeModal(false);
        navigate(location.pathname, { replace: true, state: {} });
      }, 2500);

      return () => window.clearTimeout(timer);
    }
  }, [location.pathname, location.state, navigate, user]);

  useEffect(() => {
    const handleDataChanged = () => {
      setCurrentUser(getStoredUser() || user);
      setParentShadowSession(getParentShadowSession());
      setDataVersion((current) => current + 1);
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged);
  }, [user]);

  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    navigate("/");
  };

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleRestoreParentSession = () => {
    const restored = restoreParentShadowSession();
    if (!restored) return;
    setCurrentUser(restored);
    setParentShadowSession(null);
    navigate("/parent", { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-4 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
      <Sidebar
        role={role}
        onLogout={() => setShowLogoutModal(true)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((current) => !current)}
      />
      <main className="lg:pl-0">
        <Navbar key={`nav-${dataVersion}`} user={currentUser} />
        {role === "CHILD" && parentShadowSession?.role === "PARENT" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-softBlue/20 bg-white px-4 py-3 shadow-card">
            <div>
              <p className="text-sm font-semibold text-ink">Session enfant ouverte depuis le compte parent</p>
              <p className="text-xs text-slate-500">
                Retour rapide vers {parentShadowSession.name || parentShadowSession.email || "le parent"} sans perdre son acces.
              </p>
            </div>
            <Button variant="secondary" onClick={handleRestoreParentSession}>
              Revenir au parent
            </Button>
          </div>
        ) : null}
        <Outlet key={location.pathname} />
      </main>

      <Modal
        open={showLogoutModal}
        title={t("logoutConfirmTitle")}
        onClose={() => setShowLogoutModal(false)}
        panelClassName="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              {t("logoutStay")}
            </Button>
            <Button variant="danger" onClick={handleConfirmLogout}>
              {t("logoutLeave")}
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            {t("logoutConfirmText")} {getRoleLabel(role).toLowerCase()}.
          </p>
        </div>
      </Modal>

      <Modal
        open={showWelcomeModal}
        title={t("welcomeTitle")}
        onClose={handleCloseWelcome}
        panelClassName="max-w-lg"
      >
        <div className="rounded-[24px] bg-hero-glow p-5">
          <p className="font-display text-3xl font-extrabold text-slateBlue">
            {t("welcomeTitle")} {currentUser?.name || ""}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {t("welcomeText")} {getRoleLabel(role).toLowerCase()}.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default AppShell;
