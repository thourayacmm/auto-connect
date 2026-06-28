import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // 1. Check localStorage first
    const stored = localStorage.getItem("ac-theme");
    if (stored) return stored === "dark";
    // 2. Fall back to OS preference
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Apply/remove 'dark' class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("ac-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Listen for OS preference changes
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => {
      // Only follow OS if user hasn't explicitly set a preference
      if (!localStorage.getItem("ac-theme")) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => setIsDark((d) => !d), []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
