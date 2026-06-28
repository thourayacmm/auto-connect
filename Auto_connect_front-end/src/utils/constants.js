import {
  BarChart3,
  Baby,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  History,
  Home,
  KeyRound,
  LayoutGrid,
  LibraryBig,
  MessageCircleMore,
  MessagesSquare,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ROLES } from "./roles";

export const AUTH_STORAGE_KEY = "auto-connect-user";
export const PARENT_SHADOW_SESSION_KEY = "auto-connect-parent-shadow-session";
export const USERS_STORAGE_KEY = "auto-connect-users";
export const PATIENTS_STORAGE_KEY = "auto-connect-patients";
export const LANGUAGE_STORAGE_KEY = "auto-connect-language";
export const GRID_STORAGE_KEY = "auto-connect-grid";
export const ACCESS_REQUESTS_STORAGE_KEY = "auto-connect-access-requests";
export const CHILD_THEME_STORAGE_KEY = "auto-connect-child-theme";
export const CHILD_VOICE_STORAGE_KEY = "auto-connect-child-voice";
export const CHILD_PICTOGRAM_SIZE_STORAGE_KEY = "auto-connect-child-pictogram-size";
export const CHILD_SUGGESTIONS_STORAGE_KEY = "auto-connect-child-suggestions";
export const CHILD_LEVEL_STORAGE_KEY = "auto-connect-child-level";

export const ROLE_REDIRECTS = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.THERAPIST]: "/therapist",
  [ROLES.PARENT]: "/parent",
  [ROLES.CHILD]: "/child",
};

export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { labelKey: "navDashboard", to: "/admin", icon: Home },
    { labelKey: "navUsers", to: "/admin/users", icon: Users },
    { labelKey: "navPermissions", to: "/admin/permissions", icon: ShieldCheck },
    { labelKey: "navPictogramDatabase", to: "/admin/pictograms", icon: LibraryBig },
    { labelKey: "navAccessRequests", to: "/admin/access-requests", icon: KeyRound },
  ],
  [ROLES.THERAPIST]: [
    { labelKey: "navDashboard", to: "/therapist", icon: Home },
    { labelKey: "navPatients", to: "/therapist/patients", icon: Users },
    { labelKey: "navFollowedChildren", to: "/therapist/followed-children", icon: Baby },
    { labelKey: "navScenarios", to: "/therapist/scenarios", icon: ClipboardList },
    { labelKey: "navLevels", to: "/therapist/levels", icon: Sparkles },
    { labelKey: "navPictograms", to: "/therapist/pictograms", icon: LayoutGrid },
    { labelKey: "navReports", to: "/therapist/reports", icon: BrainCircuit },
    { labelKey: "navAccessRequests", to: "/therapist/access-requests", icon: KeyRound },
  ],
  [ROLES.PARENT]: [
    { labelKey: "navDashboard", to: "/parent", icon: Home },
    { labelKey: "navChildSession", to: "/parent/child-session", icon: MessageCircleMore },
    { labelKey: "navProgress", to: "/parent/progress", icon: BarChart3 },
    { labelKey: "navChildHistory", to: "/parent/history", icon: History },
    { labelKey: "navSettings", to: "/parent/settings", icon: Settings2 },
    { labelKey: "navAssistant", to: "/parent/ai-chat", icon: BrainCircuit },
  ],
  [ROLES.CHILD]: [
    { labelKey: "navHome", to: "/child", icon: Home },
    { labelKey: "navCommunicate", to: "/child/board", icon: MessagesSquare },
    { labelKey: "navSearch", to: "/child/search", icon: ScanSearch },
    { labelKey: "navListen", to: "/child/listen", icon: BookOpen },
    { labelKey: "navTraining", to: "/child/scenarios", icon: Sparkles },
  ],
};

export const CHILD_CATEGORY_COLORS = {
  Besoins: "bg-[#d7f4ff] text-[#155c7d]",
  "Besoins essentiels": "bg-[#d7f4ff] text-[#155c7d]",
  Emotions: "bg-[#efe4ff] text-[#6442a6]",
  Actions: "bg-[#d8f8ea] text-[#1c7c53]",
  Lieux: "bg-[#ffe9d5] text-[#b86d20]",
  Personnes: "bg-[#ffe2ec] text-[#aa4867]",
  Nourriture: "bg-[#fff4bf] text-[#8b6c00]",
  Ecole: "bg-[#eef6ff] text-[#27548a]",
  Famille: "bg-[#ffe2ec] text-[#aa4867]",
  Sante: "bg-[#e7f8ef] text-[#1c7c53]",
  Transport: "bg-[#e8f1ff] text-[#2859b8]",
  Activites: "bg-[#fff0df] text-[#a85d18]",
  General: "bg-[#eef6ff] text-[#27548a]",
};

export const normalizeCategoryName = (category) => {
  const value = String(category || "")
    .trim()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase();

  if (value.includes("motion")) {
    return "Emotions";
  }

  if (value === "mange" || value === "general") {
    return "General";
  }

  if (value.includes("besoin")) {
    return "Besoins essentiels";
  }

  if (value.includes("ecole")) {
    return "Ecole";
  }

  if (value.includes("sante")) {
    return "Sante";
  }

  if (value.includes("activite")) {
    return "Activites";
  }

  return category;
};
