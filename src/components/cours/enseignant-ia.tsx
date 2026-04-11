"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAvatarVoice, unlockAudio } from "@/hooks/useAvatarVoice";
import { MIRA } from "@/lib/avatarVoices";
import { trpc } from "@/lib/trpc/client";
import {
  EnseignantIaBubble,
  ThinkingBubble,
  type Message,
} from "./enseignant-ia-bubble";
import {
  useSessionTimer,
  SessionTimerBadge,
} from "./enseignant-ia-timer";

// ── Suggestions rapides de début de session ───────────────────────────────────
const SUGGESTIONS = [
  "Je ne comprends pas ce sujet",
  "Donne-moi un exemple concret",
  "Explique-moi étape par étape",
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  prenom: string;
  niveauLabel: string;
  subjectContext: string;
  profilExtra?: string;    // Ex: "Centres d'intérêt : hockey, jeux vidéo"
  miraSecsAlreadyUsed?: number; // secondes déjà utilisées cette semaine (depuis DB)
  miraSecsMax?: number;         // quota total en secondes (30 min + bonus admin)
  onClose: () => void;
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EnseignantIA({
  prenom,
  niveauLabel,
  subjectContext,
  profilExtra,
  miraSecsAlreadyUsed = 0,
  miraSecsMax = 30 * 60,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [imageOk, setImageOk] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const saveUsage = trpc.eleve.saveMiraUsage.useMutation();
  const timer = useSessionTimer(miraSecsAlreadyUsed, miraSecsMax);

  const { speak, stop, isSpeaking, isLoading } = useAvatarVoice({
    voiceId: MIRA.voiceId,
    onEnd: () => inputRef.current?.focus(),
  });

  const isAvatarAnimated = isSpeaking || isLoading || isThinking;

  // ── Message d'accueil au montage ──────────────────────────────────────────
  useEffect(() => {
    if (timer.isExpired) {
      const expMsg: Message = {
        id: "expired",
        role: "assistant",
        content: `Bonjour ${prenom} ! Tu as déjà utilisé ta session complète d'aujourd'hui. Reviens demain — je t'attendrai avec plaisir !`,
      };
      setMessages([expMsg]);
      return;
    }

    const greeting = `Bonjour ${prenom} ! Je suis Mira, ton enseignante IA. On travaille ensemble sur ${subjectContext} aujourd'hui. Comment tu te sens ?`;
    const welcome: Message = { id: "welcome", role: "assistant", content: greeting };
    setMessages([welcome]);
    timer.startTimer();

    if (!isMuted) {
      setTimeout(() => speak(greeting), 600);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fin de session quand timer expire ─────────────────────────────────────
  useEffect(() => {
    if (timer.isExpired && !sessionEnded && messages.length > 1) {
      handleSessionEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // ── Envoyer un message ────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking || sessionEnded || timer.isExpired) return;

      stop();
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsThinking(true);

      try {
        const res = await fetch("/api/avatar/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.slice(-10),
            prenom,
            niveauLabel,
            subjectContext,
            profilExtra,
          }),
        });

        const data = await res.json();
        const reply: string = data.message ?? "Je n'ai pas bien compris. Tu peux répéter ?";

        const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply };
        setMessages((prev) => [...prev, assistantMsg]);

        if (!isMuted) await speak(reply);
      } catch {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Oups, j'ai eu un petit problème ! Peux-tu répéter ta question ?",
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, sessionEnded, timer.isExpired, messages, prenom, niveauLabel, subjectContext, profilExtra, stop, speak, isMuted]
  );

  // Ref stable pour éviter le stale closure dans recognition.onresult
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ── Fin de session : résumé + notification parents ────────────────────────
  const handleSessionEnd = useCallback(async () => {
    setSessionEnded(true);
    timer.stopTimer();
    stop();
    // Sauvegarder les secondes consommées cette session en base
    if (timer.secsAddedThisSession > 0) {
      saveUsage.mutate({ secs: timer.secsAddedThisSession });
    }

    // Annonce de fin à voix haute
    const farewell = `Super travail ${prenom} ! Ta session d'aujourd'hui est terminée. Tu as fait de beaux progrès !`;
    const farewellMsg: Message = { id: "farewell", role: "assistant", content: farewell };
    setMessages((prev) => [...prev, farewellMsg]);

    if (!isMuted) await speak(farewell);

    // Générer résumé et notifier les parents (non bloquant)
    try {
      const res = await fetch("/api/avatar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generateSummary: true,
          history: messages.slice(-10),
          prenom,
          subjectContext,
        }),
      });
      const data = await res.json();
      if (data.summary) setSummaryText(data.summary);
    } catch {
      // Non bloquant
    }
  }, [timer, stop, speak, isMuted, messages, prenom, subjectContext]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ── Micro : Web Speech API (auto-stop) → fallback MediaRecorder (Firefox) ──
  const stopRecording = useCallback(() => {
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleMic = useCallback(async () => {
    if (isListening) {
      stopRecording();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = (window as any).__miraRecognition;
      if (recognition) { try { recognition.stop(); } catch { /* ok */ } }
      return;
    }

    setMicError(null);
    unlockAudio();
    stop();

    // ── MÉTHODE 1 : Web Speech API (Chrome, Edge, Safari) — auto-stop sur silence ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognitionCtor() as any;
        recognition.lang = "fr-CA";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__miraRecognition = recognition;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
          const results = Array.from(event.results) as SpeechRecognitionResult[];
          const transcript = results.map((r) => r[0].transcript).join("");
          const isFinal = results[results.length - 1].isFinal;
          if (isFinal) {
            setInputText("");
            setIsListening(false);
            if (transcript.trim()) sendMessageRef.current(transcript.trim());
          } else {
            setInputText(transcript);
          }
        };

        recognition.onerror = (event: { error: string }) => {
          setIsListening(false);
          if (event.error === "not-allowed") {
            setMicError("Permission micro refusée. Clique sur le cadenas 🔒 → Microphone → Autoriser.");
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            setMicError(`Erreur micro (${event.error}). Recharge la page.`);
          }
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
        autoStopRef.current = setTimeout(() => { try { recognition.stop(); } catch { /* ok */ } }, 20000);
        return;
      } catch {
        // Speech API déclarée mais en erreur → fallback MediaRecorder
      }
    }

    // ── MÉTHODE 2 : MediaRecorder + transcription serveur (Firefox) ──
    if (typeof MediaRecorder === "undefined") {
      setMicError("Ton navigateur ne supporte pas le micro. Utilise Chrome, Edge ou Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        setMicError("Erreur d'enregistrement. Recharge la page et réessaie.");
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 500) return;
        setIsTranscribing(true);
        setInputText("⏳ Transcription en cours…");
        try {
          const ext = mr.mimeType?.includes("mp4") ? "mp4" : mr.mimeType?.includes("ogg") ? "ogg" : "webm";
          const fd = new FormData();
          fd.append("audio", blob, `rec.${ext}`);
          const res = await fetch("/api/avatar/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text?.trim()) {
            setInputText(""); sendMessageRef.current(data.text.trim());
          } else if (data.error) {
            setInputText(""); setMicError(`Erreur transcription : ${data.error}`);
          } else {
            setInputText(""); setMicError("Aucune parole détectée. Réessaie en parlant plus fort.");
          }
        } catch {
          setInputText(""); setMicError("Transcription échouée. Réessaie ou utilise le clavier.");
        } finally { setIsTranscribing(false); }
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setIsListening(true);
      setInputText("");
      autoStopRef.current = setTimeout(stopRecording, 20000);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicError("Permission micro refusée. Clique sur le cadenas 🔒 dans la barre d'adresse → Microphone → Autoriser.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setMicError("Micro utilisé par une autre application. Ferme les autres onglets.");
      } else if (name === "NotFoundError") {
        setMicError("Aucun micro détecté sur cet appareil.");
      } else {
        setMicError(`Erreur micro (${name || "inconnue"}). Recharge la page.`);
      }
    }
  }, [isListening, stop, stopRecording]);

  // ── Interface ─────────────────────────────────────────────────────────────
  return (
    // onClick sur le conteneur déverrouille AudioContext dès le 1er clic — nécessaire pour autoplay Chrome
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl bg-[var(--color-paper-warm)]" onClick={unlockAudio}>

      {/* ── En-tête ── */}
      <div className="flex items-center gap-3 bg-[var(--color-ink)] px-5 py-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)]">
            ✦ Enseignant IA
          </span>
          <span className="text-xs text-white/60">Session avec {prenom}</span>
        </div>
        <SessionTimerBadge secsLeft={timer.secsLeft} maxSecs={timer.maxSecs} />
        {!sessionEnded && (
          <button
            onClick={handleSessionEnd}
            className="rounded-lg px-3 py-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Terminer
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="ml-1 rounded p-1 text-white/40 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* ── Zone principale ── */}
      <div className="flex flex-1 overflow-hidden max-sm:flex-col">

        {/* ── Colonne avatar ── */}
        <div className="flex w-52 flex-shrink-0 flex-col items-center gap-3 border-r border-black/5 bg-white px-4 py-6 max-sm:w-full max-sm:flex-row max-sm:border-r-0 max-sm:border-b max-sm:px-4 max-sm:py-3">

          {/* Image avatar avec halo pulsé */}
          <div className="relative flex-shrink-0">
            <div
              className={`relative h-36 w-36 overflow-hidden rounded-full border-3 transition-all duration-300 max-sm:h-14 max-sm:w-14 ${
                isAvatarAnimated
                  ? "border-[var(--color-success)] shadow-[0_0_0_6px_rgba(42,124,111,0.15)]"
                  : "border-black/8"
              }`}
              style={
                isAvatarAnimated
                  ? { animation: "avatarHalo 2s ease-in-out infinite" }
                  : undefined
              }
            >
              <Image
                src={MIRA.imagePath}
                alt="Mira — Enseignante IA"
                fill
                className="object-cover object-top"
                priority
                onLoad={() => setImageOk(true)}
                onError={() => setImageOk(false)}
              />
              {/* Fallback emoji — visible seulement si l'image n'a pas chargé */}
              {!imageOk && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(42,124,111,0.08)] text-5xl max-sm:text-2xl">
                  👩‍🏫
                </div>
              )}
            </div>

            {/* Indicateur vocal (3 barres) quand Mira parle */}
            {isAvatarAnimated && (
              <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-end gap-0.5 rounded-full bg-[var(--color-success)] px-2 py-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="speak-bar inline-block w-0.5 rounded-full bg-white"
                    style={{ height: 12 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Nom + titre */}
          <div className="text-center max-sm:text-left">
            <p className="font-semibold text-[var(--color-ink)]">{MIRA.name}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">{MIRA.title}</p>
          </div>

          {/* Contrôles audio */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsMuted((m) => { if (!m) stop(); return !m; });
              }}
              title={isMuted ? "Activer le son" : "Couper le son"}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors ${
                isMuted
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-black/10 bg-white hover:bg-[var(--color-paper-warm)]"
              }`}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            {isSpeaking && (
              <button
                onClick={stop}
                title="Arrêter la lecture"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm hover:bg-[var(--color-paper-warm)] transition-colors"
              >
                ⏹
              </button>
            )}
          </div>
        </div>

        {/* ── Zone de conversation ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <EnseignantIaBubble
                key={msg.id}
                message={msg}
                primaryColor={MIRA.primaryColor}
                prenom={prenom}
              />
            ))}
            {isThinking && <ThinkingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* Résumé fin de session */}
          {summaryText && (
            <div className="mx-4 mb-3 rounded-xl border border-[rgba(42,124,111,0.25)] bg-[rgba(42,124,111,0.06)] px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                📋 Résumé envoyé à tes parents
              </p>
              <p className="text-xs text-[var(--color-ink)] leading-relaxed">{summaryText}</p>
            </div>
          )}

          {/* Suggestions rapides (premiers messages seulement) */}
          {messages.length <= 2 && !sessionEnded && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Erreur micro */}
          {micError && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <span>🎤</span>
              <span>{micError}</span>
              <button onClick={() => setMicError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Zone de saisie */}
          {!sessionEnded && !timer.isExpired && (
            <div className="flex flex-col gap-1.5 border-t border-black/6 bg-white px-4 py-3">
              {/* Bandeau état micro / transcription */}
              {isListening && (
                <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs text-red-600 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {"🎤 Enregistrement… Clique ⏹ quand tu as fini de parler."}
                </div>
              )}
              {isTranscribing && (
                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  ✨ Mira analyse ta voix…
                </div>
              )}
              <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKey}
                placeholder={isListening ? "🎤 Parle maintenant…" : "Écris ta question ici…"}
                maxLength={500}
                disabled={isThinking || isListening || isTranscribing}
                className="flex-1 rounded-full border border-black/10 bg-[var(--color-paper)] px-4 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-success)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              />
              {/* Bouton micro */}
              <button
                onClick={toggleMic}
                disabled={isThinking || isTranscribing}
                aria-label={isListening ? "Arrêter l'enregistrement" : "Parler à Mira"}
                title={isListening ? "Arrêter l'enregistrement" : "Parler à Mira"}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-base transition-all ${
                  isListening
                    ? "border-red-400 bg-red-100 text-red-500 animate-pulse"
                    : isTranscribing
                    ? "border-blue-200 bg-blue-50 text-blue-400 cursor-not-allowed"
                    : "border-black/10 bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
                }`}
              >
                {isListening ? "⏹" : isTranscribing ? "⏳" : "🎤"}
              </button>

              {/* Bouton envoyer */}
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isThinking || isListening || isTranscribing}
                aria-label="Envoyer"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white transition-all hover:bg-[var(--color-success)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                →
              </button>
              </div>
            </div>
          )}

          {/* Message session terminée */}
          {(sessionEnded || timer.isExpired) && (
            <div className="border-t border-black/6 bg-white px-4 py-3 text-center text-sm text-[var(--color-ink-soft)]">
              {timer.isExpired && !sessionEnded
                ? "⏱ Quota quotidien atteint — reviens demain !"
                : "✅ Session terminée — à bientôt !"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
