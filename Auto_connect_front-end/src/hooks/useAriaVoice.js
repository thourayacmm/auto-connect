import { useCallback, useEffect, useRef } from "react";
import { useAria } from "../context/AriaContext";
import { transcribeAudio } from "../services/ariaBrain";

const GROQ_KEY = () =>
  import.meta.env.VITE_GROQ_API_KEY ||
  localStorage.getItem("aria-groq-key") ||
  "";

export function useAriaVoice(onTranscript) {
  const {
    mode, setMode,
    setTranscript,
    setVolume,
    mediaRecorderRef,
    audioChunksRef,
    analyserRef,
    animFrameRef,
    audioCtxRef,
  } = useAria();

  // Volume visualizer loop
  const startVolumeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      setVolume(Math.min(1, avg / 100));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [analyserRef, animFrameRef, setVolume]);

  const stopVolumeLoop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setVolume(0);
  }, [animFrameRef, setVolume]);

  // ── Start recording ─────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    const key = GROQ_KEY();
    if (!key) return { error: "no-key" };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      // Audio context for volume analysis
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine best supported codec
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        stopVolumeLoop();

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          setTranscript("");
          setMode("idle");
          return;
        }

        setMode("thinking");
        setTranscript("Transcription en cours…");

        try {
          const text = await transcribeAudio(blob, key);
          if (!text.trim()) {
            setTranscript("Rien détecté — réessayez.");
            setTimeout(() => setTranscript(""), 2000);
            setMode("idle");
            return;
          }
          setTranscript(text);
          await onTranscript(text);
        } catch (err) {
          console.error("STT error:", err);
          setTranscript("Erreur de transcription.");
          setTimeout(() => setTranscript(""), 2500);
          setMode("error");
          setTimeout(() => setMode("idle"), 2000);
        }
      };

      recorder.start(250); // collect every 250ms for lower latency
      mediaRecorderRef.current = recorder;
      setMode("listening");
      setTranscript("Je vous écoute…");
      startVolumeLoop();
      return { ok: true };
    } catch (err) {
      console.error("Mic error:", err);
      setMode("error");
      setTimeout(() => setMode("idle"), 2000);
      return { error: "mic-denied" };
    }
  }, [audioChunksRef, audioCtxRef, analyserRef, mediaRecorderRef, onTranscript, setMode, setTranscript, startVolumeLoop, stopVolumeLoop]);

  // ── Stop recording ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopVolumeLoop();
  }, [mediaRecorderRef, stopVolumeLoop]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [animFrameRef, audioCtxRef]);

  return { startListening, stopListening, isListening: mode === "listening" };
}
