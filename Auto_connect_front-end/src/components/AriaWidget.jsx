import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown, Compass, Keyboard, Mic, MicOff,
  RotateCcw, Settings, Volume2, VolumeX, X, Zap,
} from "lucide-react";
import AriaAvatar from "./AriaAvatar";
import { useAria } from "../context/AriaContext";
import { useAriaVoice } from "../hooks/useAriaVoice";
import { callGroqLLM, resolveRoute, detectLocalIntent, ROUTES } from "../services/ariaBrain";
import { fetchAriaContext, invalidateAriaCache } from "../services/ariaDataFetcher";
import { getStoredUser } from "../utils/helpers";
import { useTheme } from "../context/ThemeContext";

const GROQ_KEY = () =>
  import.meta.env.VITE_GROQ_API_KEY ||
  localStorage.getItem("aria-groq-key") ||
  "";

// ─── Navigation shortcuts per role ───────────────────────────────────────────
const ROLE_SHORTCUTS = {
  ADMIN: [
    { label: "Dashboard", path: "/admin" },
    { label: "Utilisateurs", path: "/admin/users" },
    { label: "Permissions", path: "/admin/permissions" },
    { label: "Pictogrammes", path: "/admin/pictograms" },
    { label: "Demandes accès", path: "/admin/access-requests" },
  ],
  THERAPIST: [
    { label: "Dashboard", path: "/therapist" },
    { label: "Patients", path: "/therapist/patients" },
    { label: "Enfants suivis", path: "/therapist/followed-children" },
    { label: "Scénarios", path: "/therapist/scenarios" },
    { label: "Rapports IA", path: "/therapist/reports" },
  ],
  PARENT: [
    { label: "Dashboard", path: "/parent" },
    { label: "Session enfant", path: "/parent/child-session" },
    { label: "Progression", path: "/parent/progress" },
    { label: "Historique", path: "/parent/history" },
    { label: "Assistant IA", path: "/parent/ai-chat" },
  ],
  CHILD: [
    { label: "Accueil", path: "/child" },
    { label: "Communiquer", path: "/child/board" },
    { label: "Rechercher", path: "/child/search" },
    { label: "Écouter", path: "/child/listen" },
    { label: "S'entraîner", path: "/child/scenarios" },
  ],
};

const QUICK_PROMPTS = {
  ADMIN: ["Combien d'utilisateurs y a-t-il ?", "Montre les demandes d'accès", "Explique la gestion des permissions"],
  THERAPIST: ["Donne-moi un résumé de mes patients", "Montre les rapports IA", "Quoi faire pour motiver un enfant ?"],
  PARENT: ["Comment suit-on la progression ?", "Mon enfant fait des progrès ?", "Montre la session enfant"],
  CHILD: ["Je veux communiquer", "Cherche un pictogramme", "Je veux m'entraîner"],
  PUBLIC: ["Comment fonctionne Auto Connect ?", "Quels rôles existe-t-il ?", "Comment se connecter ?"],
};

// ──────────────────────────────────────────────────────────────────────────────
// ARIA Widget
// ──────────────────────────────────────────────────────────────────────────────
export default function AriaWidget() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = getStoredUser();
  const userRole   = user?.role || "PUBLIC";
  const userName   = user?.name || "";
  const currentPath = location.pathname;
  const currentPageLabel = ROUTES[currentPath]?.label || currentPath;

  const {
    isOpen, setIsOpen,
    tab, setTab,
    mode, setMode,
    transcript,
    volume,
    messages, pushMessage,
    muted, setMuted,
    speak,
    stopSpeak,
  } = useAria();

  const { isDark } = useTheme();
  const [textInput, setTextInput]     = useState("");
  const [apiKey, setApiKey]           = useState(GROQ_KEY());
  const [showSettings, setShowSettings] = useState(false);
  const [isHolding, setIsHolding]     = useState(false);
  const [holdTimer, setHoldTimer]     = useState(null);
  const messagesEndRef                = useRef(null);
  const inputRef                      = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && tab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, tab]);

  // ── Core: process any text input ─────────────────────────────────────────
  const processInput = useCallback(
    async (text) => {
      if (!text?.trim()) return;
      const key = GROQ_KEY() || apiKey;
      if (!key) { setShowSettings(true); return; }

      pushMessage("user", text);
      setMode("thinking");

      try {
        // ── Step 1: local intent detection (0ms, no API) ──
        const local = detectLocalIntent(text);

        if (local?.type === "navigate") {
          const label = ROUTES[local.route]?.label || local.route;
          const reply = `Je vous emmène vers ${label}.`;
          pushMessage("aria", reply); speak(reply);
          setTimeout(() => navigate(local.route), 500);
          setMode("idle"); return;
        }
        if (local?.type === "create_kid") {
          await handleCreateKid(local.payload); return;
        }

        // ── Step 2: fetch real app data (cached 30s) ──
        let appData = null;
        try { appData = await fetchAriaContext(); } catch (_) {}

        // ── Step 3: Groq LLM with real data injected ──
        const { text: reply, route, action } = await callGroqLLM(
          text, key,
          { currentPath, userRole, userName, currentPageLabel },
          messages,
          appData   // ← real live data goes here
        );

        if (action?.type === "create_kid")  { await handleCreateKid(action.payload);  return; }
        if (action?.type === "create_user") { await handleCreateUser(action.payload); return; }

        pushMessage("aria", reply); speak(reply);
        if (route && route !== currentPath) setTimeout(() => navigate(route), 600);

      } catch (err) {
        const msg = err.message?.includes("401") ? "Clé API Groq invalide — régénérez-la sur console.groq.com."
          : err.message?.includes("429")         ? "Trop de requêtes — patientez quelques secondes."
          : err.message?.includes("Failed")      ? "Impossible de joindre Groq — vérifiez Internet."
          : `Erreur : ${err.message}`;
        pushMessage("aria", msg); setMode("error");
        setTimeout(() => setMode("idle"), 3000); return;
      }
      setMode("idle");
    },
    [apiKey, currentPath, currentPageLabel, messages, navigate, pushMessage, setMode, speak, userRole, userName]
  );

  // ── Helper: create kid ────────────────────────────────────────────────────
  const handleCreateKid = useCallback(async (payload) => {
    if (!payload?.name) {
      const msg = "Dites par exemple : « Ajoute un enfant nommé Sami, 7 ans ».";
      pushMessage("aria", msg); speak(msg); setMode("idle"); return;
    }
    try {
      const { createKidApi } = await import("../services/domainApi");
      const kid   = await createKidApi(payload);
      const name  = kid?.name || payload.name;
      const code  = kid?.childCode || kid?.sessionAccessCode || "—";
      const reply = `✅ Profil de ${name} créé avec succès ! Code d'accès enfant : ${code}.`;
      pushMessage("aria", reply); speak(`Profil de ${name} créé.`);
      invalidateAriaCache();
      if (currentPath === "/parent/child-session") window.location.reload();
    } catch (e) {
      const msg = `Impossible de créer le profil : ${e.message}`;
      pushMessage("aria", msg); speak("Erreur lors de la création.");
    }
    setMode("idle");
  }, [currentPath, pushMessage, setMode, speak]);

  // ── Helper: create user (thérapeute, parent…) ─────────────────────────────
  const handleCreateUser = useCallback(async (payload) => {
    if (!payload?.name || !payload?.email) {
      const msg = "Il me faut un nom et un email pour créer un utilisateur.";
      pushMessage("aria", msg); speak(msg); setMode("idle"); return;
    }
    try {
      const { createUserApi } = await import("../services/usersApi");
      const user  = await createUserApi(payload);
      const reply = `✅ Compte de ${user?.name || payload.name} (${payload.role || "utilisateur"}) créé ! Email : ${payload.email} · Mot de passe : ${payload.password || "demo123"}`;
      pushMessage("aria", reply); speak(`Compte de ${payload.name} créé.`);
      invalidateAriaCache();
    } catch (e) {
      const msg = `Impossible de créer le compte : ${e.message}`;
      pushMessage("aria", msg); speak("Erreur lors de la création du compte.");
    }
    setMode("idle");
  }, [pushMessage, setMode, speak]);

  // ── Voice hook ────────────────────────────────────────────────────────────
  const { startListening, stopListening } = useAriaVoice(processInput);

  // ── Hold-to-talk ──────────────────────────────────────────────────────────
  const handleMicPress = useCallback(() => {
    setIsHolding(true);
    const t = setTimeout(() => startListening(), 150);
    setHoldTimer(t);
  }, [startListening]);

  const handleMicRelease = useCallback(() => {
    clearTimeout(holdTimer);
    setIsHolding(false);
    if (mode === "listening") stopListening();
  }, [holdTimer, mode, stopListening]);

  // ── Text send ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const t = textInput.trim();
    if (!t || mode === "thinking") return;
    setTextInput("");
    processInput(t);
  }, [textInput, mode, processInput]);

  // ── Save key ──────────────────────────────────────────────────────────────
  const saveKey = () => {
    localStorage.setItem("aria-groq-key", apiKey);
    setShowSettings(false);
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = () => {
    pushMessage("aria", "Conversation réinitialisée. Comment puis-je vous aider ?");
  };

  // ── Navigate to shortcut ──────────────────────────────────────────────────
  const navTo = useCallback(
    (path) => {
      const label = ROUTES[path]?.label || path;
      const reply = `Navigation vers ${label}.`;
      pushMessage("aria", reply);
      speak(reply);
      navigate(path);
      setTab("chat");
    },
    [navigate, pushMessage, speak, setTab]
  );

  // ── Status label ──────────────────────────────────────────────────────────
  const statusLabel = {
    idle:      `Prête · ${currentPageLabel}`,
    listening: "Je vous écoute…",
    thinking:  "Je réfléchis…",
    speaking:  "En train de parler…",
    error:     "Une erreur est survenue",
  }[mode] || "Prête";

  const shortcuts = ROLE_SHORTCUTS[userRole] || ROLE_SHORTCUTS.CHILD;
  const quickPrompts = QUICK_PROMPTS[userRole] || QUICK_PROMPTS.PUBLIC;

  // ══════════════════════════════════════════════════════════════════════════
  // COLLAPSED BUBBLE
  // ══════════════════════════════════════════════════════════════════════════
  if (!isOpen) {
    return (
      <div
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
        }}
      >
        {/* Tooltip */}
        <div style={{
          background: isDark ? "rgba(30,40,55,0.95)" : "rgba(36,51,75,0.88)",
          color: "white",
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 12px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          fontFamily: "Inter, sans-serif",
          letterSpacing: 0.2,
          pointerEvents: "none",
          opacity: 0.95,
        }}>
          💬 Demandez n'importe quoi à ARIA
        </div>

        {/* Bubble */}
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir ARIA"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "none", cursor: "pointer", padding: 0, position: "relative",
            background: "transparent",
          }}
        >
          {/* Animated gradient ring */}
          <span style={{
            position: "absolute", inset: -5, borderRadius: "50%",
            background: "conic-gradient(from 0deg, #7bc8f6, #5e7ce2, #c9c2ff, #5cd4c8, #7bc8f6)",
            animation: "ariaRotate 4s linear infinite",
            zIndex: 0,
          }} />
          <span style={{
            position: "absolute", inset: -2, borderRadius: "50%",
            background: "white", zIndex: 1,
          }} />
          <span style={{
            position: "relative", zIndex: 2, width: 72, height: 72,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: isDark ? "linear-gradient(145deg, #161b22, #1c2333)" : "linear-gradient(145deg, #eef7ff, #f0eeff)",
            boxShadow: "0 8px 30px rgba(94,124,226,0.3), inset 0 1px 1px rgba(255,255,255,0.8)",
          }}>
            <AriaAvatar state={mode} size={58} />
          </span>

          {/* Notification dot */}
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 14, height: 14, borderRadius: "50%",
            background: "#5bbf8a", border: "2.5px solid white",
            zIndex: 3,
            animation: "ariaPing 2s infinite",
          }} />
        </button>

        <style>{`
          @keyframes ariaRotate { to { transform: rotate(360deg); } }
          @keyframes ariaPing {
            0%,100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.4); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPANDED PANEL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      role="dialog"
      aria-label="ARIA — Assistante Vocale Intelligente"
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 9999,
        width: 380, maxHeight: 580,
        borderRadius: 28,
        background: isDark ? "#161b22" : "white",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(88,166,255,0.15)" : "0 32px 80px rgba(36,51,75,0.18), 0 0 0 1px rgba(123,200,246,0.25)",
        fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ════ HEADER ════ */}
      <div style={{
        background: "linear-gradient(135deg, #5e7ce2 0%, #3d5cc8 100%)",
        padding: "15px 16px 13px",
        display: "flex", alignItems: "center", gap: 13, flexShrink: 0,
        position: "relative", overflow: "hidden",
      }}>
        {/* Background sparkle effect */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07,
          backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 60% 80%, #fff 1px, transparent 1px)",
          backgroundSize: "30px 30px, 40px 40px, 25px 25px",
        }} />

        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3)",
        }}>
          <AriaAvatar state={mode} size={48} />
          {/* Status dot */}
          <span style={{
            position: "absolute", bottom: 3, right: 3,
            width: 11, height: 11, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.9)",
            background: mode === "listening" ? "#5bbf8a"
              : mode === "thinking" ? "#f5a35c"
              : mode === "speaking" ? "#7bc8f6"
              : mode === "error" ? "#ef7d7d"
              : "#5bbf8a",
            transition: "background 0.3s",
          }} />
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 17, letterSpacing: 0.5 }}>ARIA</span>
            <Zap size={12} color="rgba(255,255,255,0.65)" />
            <span style={{
              background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)",
              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
              letterSpacing: 0.8, textTransform: "uppercase",
            }}>
              {userRole || "IA"}
            </span>
          </div>
          <p style={{
            margin: 0, color: "rgba(255,255,255,0.78)",
            fontSize: 11, fontWeight: 500, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {statusLabel}
          </p>
          {/* Thinking progress */}
          {mode === "thinking" && (
            <div style={{
              height: 2, background: "rgba(255,255,255,0.2)",
              borderRadius: 2, marginTop: 5, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", background: "rgba(255,255,255,0.8)",
                borderRadius: 2,
                animation: "ariaProgress 1.5s ease-in-out infinite",
              }} />
            </div>
          )}
        </div>

        {/* Header actions */}
        <div style={{ display: "flex", gap: 4, position: "relative" }}>
          <button onClick={() => setMuted(!muted)} title={muted ? "Son activé" : "Couper le son"} style={hdrBtn}>
            {muted ? <VolumeX size={14} color="rgba(255,255,255,0.85)" /> : <Volume2 size={14} color="rgba(255,255,255,0.85)" />}
          </button>
          <button onClick={clearChat} title="Effacer la conversation" style={hdrBtn}>
            <RotateCcw size={14} color="rgba(255,255,255,0.85)" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} title="Paramètres API" style={hdrBtn}>
            <Settings size={14} color="rgba(255,255,255,0.85)" />
          </button>
          <button onClick={() => setIsOpen(false)} title="Fermer" style={hdrBtn}>
            <ChevronDown size={16} color="rgba(255,255,255,0.85)" />
          </button>
        </div>
      </div>

      {/* ════ API KEY SETTINGS ════ */}
      {showSettings && (
        <div style={{
          padding: "14px 16px", background: isDark ? "#0d1117" : "#f0f7ff",
          borderBottom: isDark ? "1px solid rgba(48,54,61,0.8)" : "1px solid rgba(123,200,246,0.2)", flexShrink: 0,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 11.5, fontWeight: 700, color: "#5e7ce2" }}>
            🔑 Clé API Groq
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder="gsk_..."
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 12,
                border: "1.5px solid rgba(123,200,246,0.4)", fontSize: 12,
                outline: "none", fontFamily: "monospace", background: "white",
              }}
            />
            <button onClick={saveKey} style={{
              padding: "8px 14px", borderRadius: 12,
              background: "#5e7ce2", color: "white",
              border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Sauver</button>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 10, color: "#94a3b8" }}>
            console.groq.com · Stocké localement dans votre navigateur
          </p>
        </div>
      )}

      {/* ════ TABS ════ */}
      <div style={{
        display: "flex", background: isDark ? "#161b22" : "#f8faff",
        borderBottom: isDark ? "1px solid rgba(48,54,61,0.8)" : "1px solid rgba(123,200,246,0.18)", flexShrink: 0,
      }}>
        {[
          { id: "chat", icon: <Keyboard size={12} />, label: "Chat" },
          { id: "nav",  icon: <Compass size={12} />, label: "Navigation" },
        ].map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 8px", border: "none", background: "transparent",
            cursor: "pointer", fontSize: 11.5, fontWeight: 700,
            color: tab === id ? (isDark ? "#58a6ff" : "#5e7ce2") : (isDark ? "#6e7681" : "#94a3b8"),
            borderBottom: `2.5px solid ${tab === id ? "#5e7ce2" : "transparent"}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "all 0.2s",
          }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ════ CHAT TAB ════ */}
      {tab === "chat" && (
        <>
          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 8px",
            display: "flex", flexDirection: "column", gap: 10,
            background: isDark ? "linear-gradient(180deg, #0d1117 0%, #161b22 100%)" : "linear-gradient(180deg, #f8fbff 0%, #f5f9ff 100%)",
            minHeight: 0,
          }}>
            {messages.map((msg) => {
              const isAria = msg.sender === "aria";
              return (
                <div key={msg.id} style={{
                  display: "flex", gap: 8,
                  justifyContent: isAria ? "flex-start" : "flex-end",
                  alignItems: "flex-end",
                }}>
                  {isAria && (
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #eef7ff, #ece9ff)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(94,124,226,0.12)",
                    }}>
                      <AriaAvatar state="idle" size={26} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "76%",
                    padding: "10px 13px",
                    borderRadius: isAria ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                    background: isAria
                      ? "white"
                      : "linear-gradient(135deg, #6b94f5, #5e7ce2)",
                    color: isAria ? (isDark ? "#e6edf3" : "#24334b") : "white",
                    fontSize: 13, lineHeight: 1.55,
                    boxShadow: isAria
                      ? "0 2px 10px rgba(73,103,145,0.08)"
                      : "0 4px 14px rgba(94,124,226,0.3)",
                  }}>
                    {msg.text}
                    <div style={{
                      fontSize: 9, marginTop: 4, opacity: 0.5,
                      color: isAria ? "#64748b" : "rgba(255,255,255,0.7)",
                    }}>
                      {new Date(msg.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!isAria && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #c9c2ff, #7bc8f6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#3d2f7a",
                      boxShadow: "0 2px 8px rgba(94,124,226,0.2)",
                    }}>
                      {userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking indicator */}
            {mode === "thinking" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, #eef7ff, #ece9ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <AriaAvatar state="thinking" size={26} />
                </div>
                <div style={{
                  padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                  background: isDark ? "#1c2333" : "white", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 2px 10px rgba(73,103,145,0.08)",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#7bc8f6", display: "block",
                      animation: `ariaDot 1s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Transcript banner */}
          {(mode === "listening" || (transcript && transcript !== "Je vous écoute…")) && (
            <div style={{
              padding: "8px 14px", flexShrink: 0,
              background: "rgba(123,200,246,0.08)",
              borderTop: "1px solid rgba(123,200,246,0.2)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {mode === "listening" && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#ef7d7d", flexShrink: 0,
                  animation: "ariaPing 0.7s infinite",
                }} />
              )}
              <p style={{ margin: 0, fontSize: 11, color: "#5e7ce2", fontStyle: "italic", fontWeight: 500 }}>
                {transcript}
              </p>
            </div>
          )}

          {/* Volume bar */}
          {mode === "listening" && (
            <div style={{ height: 3, background: "#eef7ff", flexShrink: 0, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${Math.min(100, volume * 120)}%`,
                background: "linear-gradient(90deg, #7bc8f6, #5e7ce2)",
                transition: "width 0.05s ease-out",
                borderRadius: "0 2px 2px 0",
              }} />
            </div>
          )}

          {/* Quick prompts */}
          <div style={{
            padding: "8px 14px 0", flexShrink: 0,
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {quickPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => processInput(prompt)}
                disabled={mode === "thinking" || mode === "listening"}
                style={{
                  padding: "4px 10px", borderRadius: 20,
                  border: isDark ? "1.5px solid rgba(88,166,255,0.25)" : "1.5px solid rgba(123,200,246,0.35)",
                  background: isDark ? "#1c2333" : "white", color: isDark ? "#58a6ff" : "#5e7ce2",
                  fontSize: 10, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                  opacity: mode === "thinking" ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { e.target.style.background = "#e8f4ff"; e.target.style.borderColor = "#7bc8f6"; }}
                onMouseLeave={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "rgba(123,200,246,0.35)"; }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{
            padding: "10px 12px 12px", flexShrink: 0,
            borderTop: isDark ? "1px solid rgba(48,54,61,0.8)" : "1px solid rgba(123,200,246,0.15)",
            background: isDark ? "#161b22" : "white",
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <input
              ref={inputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={mode === "listening" ? "Parlez…" : "Écrivez ou maintenez le micro…"}
              disabled={mode === "listening"}
              style={{
                flex: 1, padding: "9px 13px", borderRadius: 16,
                border: isDark ? "1.5px solid rgba(48,54,61,0.8)" : "1.5px solid rgba(123,200,246,0.3)",
                fontSize: 12.5, outline: "none", color: isDark ? "#e6edf3" : "#24334b",
                background: isDark ? "#0d1117" : "#fafcff", transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#7bc8f6"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(123,200,246,0.3)"; }}
            />

            {/* Mic button */}
            <button
              onMouseDown={handleMicPress}
              onMouseUp={handleMicRelease}
              onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
              onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
              onMouseLeave={() => { if (mode === "listening") stopListening(); setIsHolding(false); }}
              aria-label={mode === "listening" ? "Arrêter" : "Maintenez pour parler"}
              disabled={mode === "thinking"}
              style={{
                width: 42, height: 42, borderRadius: "50%", border: "none",
                cursor: mode === "thinking" ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: mode === "listening"
                  ? "linear-gradient(135deg, #ef7d7d, #d05050)"
                  : isHolding
                  ? "linear-gradient(135deg, #5bbf8a, #3d9e6e)"
                  : "linear-gradient(135deg, #7bc8f6, #5e7ce2)",
                boxShadow: mode === "listening"
                  ? "0 0 0 6px rgba(239,125,125,0.22), 0 4px 14px rgba(239,125,125,0.4)"
                  : "0 4px 14px rgba(94,124,226,0.35)",
                transform: (mode === "listening" || isHolding) ? "scale(1.1)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                opacity: mode === "thinking" ? 0.5 : 1,
              }}
            >
              {mode === "listening"
                ? <MicOff size={17} color="white" />
                : <Mic size={17} color="white" />
              }
            </button>
          </div>
        </>
      )}

      {/* ════ NAVIGATION TAB ════ */}
      {tab === "nav" && (
        <div style={{
          flex: 1, overflowY: "auto", padding: 14,
          background: isDark ? "#0d1117" : "linear-gradient(180deg, #f8fbff, #f5f9ff)",
        }}>
          {/* Current location */}
          <div style={{
            background: isDark ? "#1c2333" : "white", borderRadius: 14, padding: "10px 14px",
            marginBottom: 14, boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 2px 10px rgba(73,103,145,0.08)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #eef7ff, #ece9ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Compass size={16} color="#5e7ce2" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Page actuelle
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#24334b", fontWeight: 700 }}>
                {currentPageLabel}
              </p>
            </div>
          </div>

          {/* Shortcut buttons */}
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Navigation rapide
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {shortcuts.map(({ label, path }) => {
              const isActive = currentPath === path;
              return (
                <button
                  key={path}
                  onClick={() => navTo(path)}
                  style={{
                    padding: "10px 12px", borderRadius: 13,
                    border: `1.5px solid ${isActive ? "#5e7ce2" : "rgba(123,200,246,0.3)"}`,
                    background: isActive ? (isDark ? "linear-gradient(135deg, #1f2f4a, #1c2333)" : "linear-gradient(135deg, #eef4ff, #ece9ff)") : (isDark ? "#161b22" : "white"),
                    color: isActive ? (isDark ? "#58a6ff" : "#5e7ce2") : (isDark ? "#e6edf3" : "#24334b"),
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                    boxShadow: isActive ? "0 2px 12px rgba(94,124,226,0.15)" : "0 1px 4px rgba(73,103,145,0.06)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "#f0f7ff"; e.currentTarget.style.borderColor = "#7bc8f6"; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "rgba(123,200,246,0.3)"; } }}
                >
                  {label}
                  {isActive && <span style={{ marginLeft: 4, fontSize: 9 }}>●</span>}
                </button>
              );
            })}
          </div>

          {/* Voice commands guide */}
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Commandes vocales
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Va sur les patients",
              "Ouvre le tableau de bord",
              "Montre les rapports",
              "Retour à l'accueil",
              "Navigue vers les scénarios",
            ].map((cmd) => (
              <div
                key={cmd}
                onClick={() => { processInput(cmd); setTab("chat"); }}
                style={{
                  padding: "8px 12px", borderRadius: 10,
                  background: "white", cursor: "pointer",
                  border: "1px solid rgba(123,200,246,0.2)",
                  fontSize: 12, color: "#24334b",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f7ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
              >
                <Mic size={11} color="#7bc8f6" style={{ flexShrink: 0 }} />
                <em style={{ fontStyle: "normal" }}>« {cmd} »</em>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ GLOBAL STYLES ════ */}
      <style>{`
        @keyframes ariaProgress {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 70%; }
          100% { width: 0%; transform: translateX(400px); }
        }
        @keyframes ariaDot {
          0%,100% { transform: scale(0.7); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes ariaPing {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared header button style ───────────────────────────────────────────────
const hdrBtn = {
  width: 30, height: 30, borderRadius: 8, border: "none",
  background: "rgba(255,255,255,0.15)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
  backdropFilter: "blur(4px)",
};
