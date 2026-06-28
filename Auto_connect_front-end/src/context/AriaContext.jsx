import { createContext, useCallback, useContext, useRef, useState } from "react";
import { speakText, stopSpeech } from "../services/ariaBrain";

const Ctx = createContext(null);

export function AriaProvider({ children }) {
  // ── Panel state ────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen]         = useState(false);
  const [tab, setTab]               = useState("chat");

  // ── Interaction states ─────────────────────────────────────────────────────
  const [mode, setMode]             = useState("idle"); // idle | listening | thinking | speaking | error
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume]         = useState(0);

  // ── Conversation memory (persisted for the session) ────────────────────────
  const [messages, setMessages]     = useState([
    {
      id: "init",
      sender: "aria",
      text: "Bonjour ! Je suis ARIA, votre assistante intelligente. Je peux vous aider à naviguer, répondre à vos questions et bien plus. Appuyez sur le micro ou écrivez pour commencer.",
      ts: Date.now(),
    },
  ]);

  // ── Settings ───────────────────────────────────────────────────────────────
  const [muted, setMuted]           = useState(false);
  const [lang, setLang]             = useState("fr-FR");

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const analyserRef       = useRef(null);
  const animFrameRef      = useRef(null);
  const audioCtxRef       = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pushMessage = useCallback((sender, text, extra = {}) => {
    const msg = { id: `${sender}-${Date.now()}-${Math.random()}`, sender, text, ts: Date.now(), ...extra };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const speak = useCallback(
    (text) => {
      if (muted || !text) return;
      setMode("speaking");
      speakText(text, {
        lang,
        onStart: () => setMode("speaking"),
        onEnd:   () => setMode("idle"),
      });
    },
    [muted, lang]
  );

  const stopSpeak = useCallback(() => {
    stopSpeech();
    setMode("idle");
  }, []);

  const value = {
    // panel
    isOpen, setIsOpen,
    tab, setTab,
    // state
    mode, setMode,
    transcript, setTranscript,
    volume, setVolume,
    // messages
    messages, setMessages, pushMessage,
    // settings
    muted, setMuted,
    lang, setLang,
    // speech
    speak, stopSpeak,
    // refs
    mediaRecorderRef, audioChunksRef, analyserRef, animFrameRef, audioCtxRef,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAria = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAria must be used inside AriaProvider");
  return ctx;
};
