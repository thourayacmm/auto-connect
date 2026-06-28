// ══════════════════════════════════════════════════════════════════════════════
// Auto Connect — App.jsx  (with Dark/Light mode + ARIA fixed)
// ══════════════════════════════════════════════════════════════════════════════
import AppRoutes from "./routes/AppRoutes";
import { AriaProvider } from "./context/AriaContext";
import { ThemeProvider } from "./context/ThemeContext";
import AriaWidget from "./components/AriaWidget";

function App() {
  return (
    // ThemeProvider: manages dark/light class on <html>, persists to localStorage
    <ThemeProvider>
      {/* AriaProvider: global state for the voice assistant */}
      <AriaProvider>
        <AppRoutes />
        {/* ARIA floats above all pages, auto-detects user/role/route */}
        <AriaWidget />
      </AriaProvider>
    </ThemeProvider>
  );
}

export default App;
