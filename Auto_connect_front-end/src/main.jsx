import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppPreferencesProvider } from "./context/AppPreferences";
import "./index.css";

// NOTE: React.StrictMode removed intentionally.
// In development, StrictMode fires useEffect twice (mount → cleanup → remount).
// This cancels in-flight API requests before they resolve, causing dashboards
// to show "…" permanently after page refresh.
// StrictMode provides no benefit in production builds.

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppPreferencesProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppPreferencesProvider>,
);