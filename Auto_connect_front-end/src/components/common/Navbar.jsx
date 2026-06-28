import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAppPreferences } from "../../context/AppPreferences";
import { listNotificationsApi } from "../../services/notificationsApi";
import Button from "./Button";
import Modal from "./Modal";
import ThemeToggle from "./ThemeToggle";

function Navbar({ user }) {
  const { t } = useAppPreferences();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const showNotifications = Boolean(user?.role);

  const refreshNotifications = () => {
    if (!user?.role) return;
    listNotificationsApi()
      .then((items) => setNotifications(items))
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    refreshNotifications();
  }, [user?.role]);

  return (
    <>
      <header className="glass-panel sticky top-0 z-20 mb-6 flex items-center justify-between rounded-[28px] border border-themed px-4 py-3 shadow-card md:px-6">
        <div>
          <p className="font-display text-lg font-extrabold text-slateBlue dark:text-dark-accent">
            Auto Connect
          </p>
          <p className="text-xs text-themed-muted">{t("navbarSubtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 🌙 Dark/Light Toggle */}
          <ThemeToggle />

          {/* 🔔 Notifications */}
          {showNotifications ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setOpenNotifications((current) => !current);
                  refreshNotifications();
                }}
                className="focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-themed-surface text-slateBlue dark:text-dark-accent shadow-card transition hover:bg-themed-subtle"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white dark:ring-dark-surface" />
              </button>

              {openNotifications ? (
                <div className="absolute right-0 top-14 z-40 w-[340px] rounded-[24px] border border-themed bg-themed-elevated p-3 shadow-soft">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <p className="font-display text-base font-bold text-themed-primary">
                      Notifications
                    </p>
                    <span className="rounded-full bg-softBlue/15 dark:bg-dark-accent/15 px-2 py-1 text-xs font-semibold text-slateBlue dark:text-dark-accent">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setOpenNotifications(false);
                        }}
                        className="focus-ring w-full rounded-2xl bg-themed-subtle p-3 text-left transition hover:bg-softBlue/10 dark:hover:bg-dark-accent/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-themed-primary">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slateBlue dark:text-dark-accent">
                              {notification.patient}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-themed-faint">
                            {String(notification.time || "").slice(0, 10)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-themed-muted">
                          {notification.message}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* User info */}
          <div className="text-right">
            <p className="text-sm font-semibold text-themed-primary">{user?.name}</p>
            <p className="text-xs text-themed-muted">
              {t(`role${user?.role?.[0] || ""}${user?.role?.slice(1)?.toLowerCase() || ""}`)}
            </p>
          </div>
        </div>
      </header>

      <Modal
        open={Boolean(selectedNotification)}
        title="Détail notification"
        onClose={() => setSelectedNotification(null)}
        panelClassName="max-w-lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
            Fermer
          </Button>
        }
      >
        <div className="rounded-[24px] bg-themed-subtle p-5">
          <p className="text-xs font-semibold uppercase text-themed-faint">
            {selectedNotification?.time}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-themed-primary">
            {selectedNotification?.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slateBlue dark:text-dark-accent">
            {selectedNotification?.patient}
          </p>
          <p className="mt-4 text-sm leading-7 text-themed-muted">
            {selectedNotification?.detail}
          </p>
        </div>
      </Modal>
    </>
  );
}

export default Navbar;
