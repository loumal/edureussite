"use client";

/**
 * useMicInput — gestion unifiée du micro pour Mira
 *
 * Stratégie :
 *  1. Web Speech API avec fr-CA (Chrome / Edge / Safari)
 *  2. Si fr-CA n'est pas supporté → retry avec fr-FR
 *  3. Si la Speech API échoue pour tout autre raison → MediaRecorder + /api/avatar/transcribe
 *  4. Firefox (pas de Speech API) → MediaRecorder directement
 */

import { useState, useRef, useCallback } from "react";
import { unlockAudio } from "@/hooks/useAvatarVoice";

interface UseMicInputOptions {
  /** Clé window pour la reconnaissance (évite les conflits entre instances) */
  windowKey: string;
  /** Callback déclenché quand la transcription finale est prête */
  onTranscript: (text: string) => void;
  /** Callback optionnel pour afficher le texte intermédiaire (interim) */
  onInterim?: (text: string) => void;
}

interface UseMicInputReturn {
  isListening: boolean;
  isTranscribing: boolean;
  micError: string | null;
  toggleMic: () => Promise<void>;
  clearMicError: () => void;
}

export function useMicInput({
  windowKey,
  onTranscript,
  onInterim,
}: UseMicInputOptions): UseMicInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMicError = useCallback(() => setMicError(null), []);

  // ── MediaRecorder (Firefox / fallback) ─────────────────────────────────────
  const startMediaRecorder = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      setMicError("Ton navigateur ne supporte pas le micro. Utilise Chrome, Edge ou Safari.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 500) {
          setMicError("Enregistrement trop court. Parle un peu plus longtemps.");
          return;
        }

        setIsTranscribing(true);
        try {
          const ext = recorder.mimeType?.includes("mp4")
            ? "mp4"
            : recorder.mimeType?.includes("ogg")
            ? "ogg"
            : "webm";

          const form = new FormData();
          form.append("audio", blob, `audio.${ext}`);

          const res = await fetch("/api/avatar/transcribe", { method: "POST", body: form });
          const data = await res.json();

          if (data.text?.trim()) {
            onTranscript(data.text.trim());
          } else if (!res.ok || data.error) {
            setMicError("Problème de transcription. Réessaie dans un instant.");
          } else {
            setMicError("Je n'ai rien compris. Parle plus fort et plus près du micro.");
          }
        } catch {
          setMicError("Erreur lors de la transcription.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      autoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state !== "inactive") {
          mediaRecorderRef.current?.stop();
        }
      }, 30_000);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicError("Autorise l'accès au microphone dans ton navigateur.");
      } else if (name === "NotFoundError") {
        setMicError("Aucun micro détecté sur cet appareil.");
      } else {
        setMicError("Erreur micro. Recharge la page.");
      }
    }
  }, [onTranscript]);

  // ── Web Speech API pour une langue donnée ──────────────────────────────────
  const startWebSpeech = useCallback(
    (lang: string, onFallback: () => void) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionCtor =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        onFallback();
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognitionCtor() as any;
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any)[windowKey] = recognition;

        recognition.onstart = () => setIsListening(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = Array.from(e.results as any[]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transcript = results.map((r: any) => r[0].transcript).join("");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isFinal = (e.results[e.results.length - 1] as any).isFinal;

          if (isFinal) {
            setIsListening(false);
            onInterim?.("");
            if (transcript.trim()) onTranscript(transcript.trim());
          } else {
            onInterim?.(transcript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (e: any) => {
          if (e.error === "not-allowed") {
            setIsListening(false);
            setMicError("Autorise l'accès au microphone dans ton navigateur.");
            return;
          }
          if (e.error === "no-speech" || e.error === "aborted") {
            setIsListening(false);
            return;
          }
          // language-not-supported ou autre → fallback
          setIsListening(false);
          onFallback();
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
        autoStopRef.current = setTimeout(() => {
          try { recognition.stop(); } catch { /* ok */ }
        }, 30_000);
      } catch {
        onFallback();
      }
    },
    [windowKey, onTranscript, onInterim]
  );

  // ── toggleMic principal ────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    // Arrêter si déjà en écoute
    if (isListening) {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = (window as any)[windowKey];
      if (recognition) { try { recognition.stop(); } catch { /* ok */ } }
      setIsListening(false);
      return;
    }

    setMicError(null);
    unlockAudio();

    // Chaîne : fr-CA → fr-FR → MediaRecorder
    startWebSpeech("fr-CA", () => {
      startWebSpeech("fr-FR", () => {
        startMediaRecorder();
      });
    });
  }, [isListening, windowKey, startWebSpeech, startMediaRecorder]);

  return { isListening, isTranscribing, micError, toggleMic, clearMicError };
}
