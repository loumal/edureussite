"use client";

import { useState, useRef, useCallback } from "react";

interface Options {
  voiceId: string;
  language?: "fr" | "en";
  onStart?: () => void;
  onEnd?: () => void;
}

interface Return {
  speak: (text: string, overrideLang?: "fr" | "en") => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
}

// ── AudioContext partagé — une fois resumed, reste actif toute la session ────
let sharedCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) sharedCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return sharedCtx;
}

// Appeler depuis n'importe quel clic utilisateur pour déverrouiller l'audio
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  } catch { /* ignore si AudioContext non dispo */ }
}

// Fallback TTS natif si l'API échoue
function browserSpeak(text: string, language: "fr" | "en", onStart?: () => void, onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === "en" ? "en-CA" : "fr-CA";
  utter.rate = 0.92;
  utter.pitch = 1.05;
  const trySetVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const lang = language === "en" ? "en-CA" : "fr-CA";
    const fallbackLang = language === "en" ? "en" : "fr";
    const v = voices.find((v) => v.lang === lang)
      ?? voices.find((v) => v.lang.startsWith(fallbackLang));
    if (v) utter.voice = v;
  };
  trySetVoice();
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      trySetVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function useAvatarVoice({ voiceId, language = "fr", onStart, onEnd }: Options): Return {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const usingFallbackRef = useRef(false);

  const stop = useCallback(() => {
    if (currentSource) {
      try { currentSource.stop(); } catch { /* déjà arrêté */ }
      currentSource = null;
    }
    if (usingFallbackRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    usingFallbackRef.current = false;
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string, overrideLang?: "fr" | "en") => {
    if (!text.trim()) return;
    stop();
    setIsLoading(true);

    try {
      const res = await fetch("/api/avatar/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, language: overrideLang ?? language }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();

      // AudioContext évite les restrictions autoplay — il reste actif après le 1er unlock
      const ctx = getCtx();
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch { /* ignore */ }
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSource = source;

      source.onended = () => {
        if (currentSource === source) currentSource = null;
        setIsSpeaking(false);
        onEnd?.();
      };

      setIsLoading(false);
      setIsSpeaking(true);
      onStart?.();
      source.start(0);

    } catch {
      // Fallback TTS natif (voix navigateur)
      setIsLoading(false);
      usingFallbackRef.current = true;
      setIsSpeaking(true);
      onStart?.();
      browserSpeak(
        text,
        overrideLang ?? language,
        undefined,
        () => { setIsSpeaking(false); usingFallbackRef.current = false; onEnd?.(); }
      );
    }
  }, [voiceId, language, stop, onStart, onEnd]);

  return { speak, stop, isSpeaking, isLoading };
}
