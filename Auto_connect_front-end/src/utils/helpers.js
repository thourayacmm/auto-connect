import {
  Activity,
  AlarmClock,
  Ambulance,
  Apple,
  Baby,
  Bath,
  Bed,
  Bike,
  BookHeart,
  Bot,
  Bus,
  Cake,
  Calendar,
  Camera,
  Car,
  CircleHelp,
  Coffee,
  Cookie,
  Dumbbell,
  Droplets,
  Gamepad2,
  Gift,
  HeartHandshake,
  Home,
  Joystick,
  Laugh,
  Map,
  MapPin,
  MessageCircle,
  MoonStar,
  Music,
  Palette,
  Pencil,
  Phone,
  Pill,
  Pizza,
  Plane,
  Salad,
  School,
  ShowerHead,
  Smile,
  Sparkles,
  Soup,
  Star,
  Stethoscope,
  Sun,
  Toilet,
  ToyBrick,
  Train,
  Trees,
  Trophy,
  UserRound,
  Utensils,
  Volume2,
} from "lucide-react";
import { AUTH_STORAGE_KEY, CHILD_VOICE_STORAGE_KEY, PARENT_SHADOW_SESSION_KEY, ROLE_REDIRECTS } from "./constants";
import { ROLE_LABELS } from "./roles";

const iconMap = {
  Activity,
  AlarmClock,
  Ambulance,
  Apple,
  Baby,
  Bath,
  Bed,
  Bike,
  BookHeart,
  Bot,
  Bus,
  Cake,
  Calendar,
  Camera,
  Car,
  CircleHelp,
  Coffee,
  Cookie,
  Dumbbell,
  Droplets,
  Gamepad2,
  Gift,
  HeartHandshake,
  Home,
  Joystick,
  Laugh,
  Map,
  MapPin,
  MessageCircle,
  MoonStar,
  Music,
  Palette,
  Pencil,
  Phone,
  Pill,
  Pizza,
  Plane,
  Salad,
  School,
  ShowerHead,
  Smile,
  Sparkles,
  Soup,
  Star,
  Stethoscope,
  Sun,
  Toilet,
  ToyBrick,
  Train,
  Trees,
  Trophy,
  UserRound,
  Utensils,
  Volume2,
};

export const getIconComponent = (name) => iconMap[name] || Bot;

export const classNames = (...classes) => classes.filter(Boolean).join(" ");

export const getStoredUser = () => {
  let user = null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    user = JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  if (user.firstName || user.lastName || user.fullName) {
    return {
      ...user,
      name: user.name || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    };
  }
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(PARENT_SHADOW_SESSION_KEY);
};

export const getParentShadowSession = () => {
  try {
    const raw = localStorage.getItem(PARENT_SHADOW_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    localStorage.removeItem(PARENT_SHADOW_SESSION_KEY);
    return null;
  }
};

export const restoreParentShadowSession = () => {
  const parentSession = getParentShadowSession();
  if (!parentSession) return null;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parentSession));
  localStorage.removeItem(PARENT_SHADOW_SESSION_KEY);
  return parentSession;
};

export const getRedirectForRole = (role) => ROLE_REDIRECTS[role] || "/login";

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const speakText = (text) => {
  if (!text || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const childVoice = localStorage.getItem(CHILD_VOICE_STORAGE_KEY) || "fr";
  utterance.lang = childVoice === "en" ? "en-US" : "fr-FR";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const getProgressTone = (value) => {
  if (value >= 80) return "text-success";
  if (value >= 50) return "text-warning";
  return "text-danger";
};
