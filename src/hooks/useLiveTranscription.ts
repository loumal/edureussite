"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseLiveTranscriptionReturn {
  texteAccumule: string;
  texteInterim: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
}

export function useLiveTranscription(lang = "fr-FR"): UseLiveTranscriptionReturn {
  const [texteAccumule, setTexteAccumule] = useState("");
  const [texteInterim, setTexteInterim] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldRunRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ("SpeechRecognition" in (window as any) || "webkitSpeechRecognition" in (window as any));

  const createAndStart = useCallback(() => {
    if (!isSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript + " ";
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) setTexteAccumule((prev) => prev + finalChunk);
      setTexteInterim(interimChunk);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;
      setError(`Micro : ${event.error}`);
    };

    // Auto-restart si toujours actif (le navigateur coupe parfois après le silence)
    rec.onend = () => {
      setTexteInterim("");
      if (shouldRunRef.current) {
        setTimeout(() => { if (shouldRunRef.current) createAndStart(); }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* déjà démarré */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    if (!isSupported) { setError("Microphone non supporté dans ce navigateur"); return; }
    setError(null);
    shouldRunRef.current = true;
    createAndStart();
  }, [isSupported, createAndStart]);

  const stopListening = useCallback(() => {
    shouldRunRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignoré */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTexteInterim("");
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTexteAccumule("");
    setTexteInterim("");
    setError(null);
  }, [stopListening]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      shouldRunRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignoré */ }
      }
    };
  }, []);

  return { texteAccumule, texteInterim, isListening, isSupported, error, startListening, stopListening, reset };
}
