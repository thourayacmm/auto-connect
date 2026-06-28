import { LogOut, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppPreferences } from "../../context/AppPreferences";
import { NAV_ITEMS } from "../../utils/constants";
import { classNames } from "../../utils/helpers";
import Button from "./Button";

function Sidebar({ role, onLogout, mobileOpen, onToggleMobile }) {
  const { t } = useAppPreferences();
  const items = NAV_ITEMS[role] || [];

  return (
    <>
      {/* Mobile top bar */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="font-display text-xl font-extrabold text-slateBlue dark:text-dark-accent">
          Auto Connect
        </p>
        <Button variant="secondary" aria-label={t("openMenu")} onClick={onToggleMobile}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar panel */}
      <aside
        className={classNames(
          "glass-panel fixed inset-y-4 left-4 z-30 w-[280px] rounded-[32px] border border-themed p-5 shadow-soft transition lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]",
          mobileOpen ? "block" : "hidden lg:block",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-softBlue to-lilac text-xl font-black text-white shadow-soft">
              AC
            </div>
            <h1 className="font-display text-2xl font-extrabold text-themed-primary">
              Auto Connect
            </h1>
            <p className="mt-0.5 text-xs text-themed-faint">CAA · IA · Accessibilité</p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1.5">
            {items.map(({ labelKey, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={mobileOpen ? onToggleMobile : undefined}
                className={({ isActive }) =>
                  classNames(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-softBlue/15 text-slateBlue dark:bg-dark-accent/15 dark:text-dark-accent"
                      : "text-themed-muted hover:bg-themed-subtle hover:text-themed-primary",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={classNames(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-slateBlue dark:text-dark-accent" : "",
                      )}
                    />
                    {t(labelKey)}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <Button
            className="mt-6 w-full border border-themed text-themed-muted hover:text-danger"
            variant="ghost"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          aria-label={t("closeMenu")}
          className="fixed inset-0 z-20 bg-ink/20 dark:bg-black/40 lg:hidden"
          onClick={onToggleMobile}
        />
      ) : null}
    </>
  );
}

export default Sidebar;
