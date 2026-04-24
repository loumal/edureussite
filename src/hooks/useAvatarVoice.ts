"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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

export function unlockAudio() {
  // <audio> ne nécessite pas de déverrouillage AudioContext
}

function browserSpeak(text: string, language: "fr" | "en", onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === "en" ? "en-CA" : "fr-CA";
  utter.rate = 0.92;
  utter.pitch = 1.05;
  const trySetVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.lang === (language === "en" ? "en-CA" : "fr-CA"))
      ?? voices.find((v) => v.lang.startsWith(language === "en" ? "en" : "fr"));
    if (v) utter.voice = v;
  };
  trySetVoice();
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => { trySetVoice(); window.speechSynthesis.onvoiceschanged = null; };
  }
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function useAvatarVoice({ voiceId, language = "fr", onStart, onEnd }: Options): Return {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs par instance — isolation complète entre composants
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const usingFallbackRef = useRef(false);

  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      audioRef.current = null;
      revokeBlobUrl();
      if (usingFallbackRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [revokeBlobUrl]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    revokeBlobUrl();
    if (usingFallbackRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    usingFallbackRef.current = false;
    setIsSpeaking(false);
    setIsLoading(false);
  }, [revokeBlobUrl]);

  const speak = useCallback(async (text: string, overrideLang?: "fr" | "en") => {
    if (!text.trim()) return;

    // Annule tout ce qui est en cours sur cette instance
    abortRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    revokeBlobUrl();
    if (usingFallbackRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    usingFallbackRef.current = false;
    setIsSpeaking(false);

    const abort = new AbortController();
    abortRef.current = abort;
    setIsLoading(true);

    try {
      const res = await fetch("/api/avatar/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, language: overrideLang ?? language }),
        signal: abort.signal,
      });

      if (abort.signal.aborted) return;
      if (!res.ok) throw new Error(`TTS ${res.status}`);

      // Blob URL — rapide, fiable, aucun décodage manuel
      const blob = await res.blob();
      if (abort.signal.aborted) return;

      revokeBlobUrl();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = audioRef.current;
      if (!audio || abort.signal.aborted) { revokeBlobUrl(); return; }

      audio.src = url;

      audio.onplaying = () => {
        if (!abort.signal.aborted) {
          setIsLoading(false);
          setIsSpeaking(true);
          onStartRef.current?.();
        }
      };

      audio.onended = () => {
        revokeBlobUrl();
        setIsSpeaking(false);
        onEndRef.current?.();
      };

      audio.onerror = () => {
        revokeBlobUrl();
        setIsLoading(false);
        setIsSpeaking(false);
        onEndRef.current?.();
      };

      await audio.play();

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      revokeBlobUrl();
      setIsLoading(false);
      usingFallbackRef.current = true;
      setIsSpeaking(true);
      onStartRef.current?.();
      browserSpeak(text, overrideLang ?? language, () => {
        setIsSpeaking(false);
        usingFallbackRef.current = false;
        onEndRef.current?.();
      });
    }
  }, [voiceId, language, revokeBlobUrl]);

  return { speak, stop, isSpeaking, isLoading };
}
