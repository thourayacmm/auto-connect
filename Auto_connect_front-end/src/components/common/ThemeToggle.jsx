import { useTheme } from "../../context/ThemeContext";

/**
 * ThemeToggle — compact sun/moon pill toggle
 * Drop anywhere in your layout (Navbar, Sidebar, Settings page, etc.)
 */
export default function ThemeToggle({ className = "" }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`theme-toggle-btn focus-ring ${className}`}
    >
      <span className="theme-toggle-knob">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
