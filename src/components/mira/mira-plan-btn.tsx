"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAvatarVoice, unlockAudio } from "@/hooks/useAvatarVoice";
import { MIRA } from "@/lib/avatarVoices";
import {
  EnseignantIaBubble,
  ThinkingBubble,
  type Message,
} from "@/components/cours/enseignant-ia-bubble";
import {
  useSessionTimer,
  SessionTimerBadge,
} from "@/components/cours/enseignant-ia-timer";

const MIRA_COLOR = "#5b4fcf"; // purple — différencie du mode cours (gold)

interface PlanContext {
  notionActive: string;
  matiere: string;
  matiereLabel: string;
  matiereEmoji: string;
  nbNotions: number;
  nbMaitrisees: number;
}

interface MiraPlanPanelProps {
  planContext: PlanContext;
  onClose: () => void;
}

function MiraPlanPanel({ planContext, onClose }: MiraPlanPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [welcomed, setWelcomed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessageRef = useRef<any>(null);

  const contextQuery = trpc.eleve.getMiraLibreContext.useQuery();
  const ctx = contextQuery.data;
  const timer = useSessionTimer(ctx?.secsUsed ?? 0, ctx?.secsMax ?? 30 * 60);
  const saveUsage = trpc.eleve.saveMiraUsage.useMutation();
  const saveMessage = trpc.eleve.saveMiraMessage.useMutation();

  // Message d'accueil contextuel — affiché immédiatement, pas stocké en DB
  useEffect(() => {
    if (!ctx?.prenom || welcomed) return;
    const progression = planContext.nbNotions > 0
      ? Math.round((planContext.nbMaitrisees / planContext.nbNotions) * 100)
      : 0;
    const welcomeText = planContext.nbMaitrisees > 0
      ? `Allo ${ctx.prenom} ! Je vois que tu travailles sur "${planContext.notionActive}" en ce moment ${planContext.matiereEmoji}. T'as déjà maîtrisé ${planContext.nbMaitrisees} notion${planContext.nbMaitrisees > 1 ? "s" : ""} — ${progression}% de ton plan, c'est vraiment super ! Tu veux qu'on révise ça ensemble, ou t'as une question sur ton plan ?`
      : `Allo ${ctx.prenom} ! Je vois que tu commences à travailler sur "${planContext.notionActive}" en ${planContext.matiereLabel} ${planContext.matiereEmoji}. C'est quoi que tu veux qu'on pratique ensemble aujourd'hui ?`;
    setMessages([{ id: "welcome", role: "assistant", content: welcomeText }]);
    setWelcomed(true);
  }, [ctx?.prenom, welcomed, planContext]);

  const { speak, stop, isSpeaking, isLoading } = useAvatarVoice({
    voiceId: MIRA.voiceId,
    onEnd: () => inputRef.current?.focus(),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      if (timer.secsAddedThisSession > 0) saveUsage.mutate({ secs: timer.secsAddedThisSession });
      timer.stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking || timer.isExpired) return;
    if (!ctx) return;

    timer.startTimer();
    unlockAudio();
    stop();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);
    saveMessage.mutate({ role: "user", content: text.trim() });

    const recentHistory = [...messages, userMsg];

    try {
      const res = await fetch("/api/avatar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: recentHistory.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          prenom: ctx.prenom,
          niveauLabel: ctx.niveauLabel,
          profilExtra: ctx.profilExtra,
          mode: "plan",
          planContext: {
            notionActive: planContext.notionActive,
            matiere: planContext.matiere,
            matiereLabel: planContext.matiereLabel,
            nbNotions: planContext.nbNotions,
            nbMaitrisees: planContext.nbMaitrisees,
          },
        }),
      });

      const data = await res.json();
      const reply: string = data.message ?? "Je n'ai pas bien compris. Tu peux répéter ?";

      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      saveMessage.mutate({ role: "assistant", content: reply });
      if (!isMuted) speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Oups, j'ai eu un petit problème ! Peux-tu répéter ?" },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [ctx, isThinking, isMuted, messages, planContext, timer, speak, stop, saveMessage]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  const toggleMic = useCallback(async () => {
    if (isListening) {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = (window as any).__miraPlanRecognition;
      if (recognition) { try { recognition.stop(); } catch { /* ok */ } }
      setIsListening(false);
      return;
    }

    setMicError(null);
    unlockAudio();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognitionCtor() as any;
        recognition.lang = "fr-CA";
        recognition.interimResults = true;
        recognition.continuous = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__miraPlanRecognition = recognition;
        recognition.onstart = () => setIsListening(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = Array.from(e.results as any[]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transcript = results.map((r: any) => r[0].transcript).join("");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isFinal = (e.results[e.results.length - 1] as any).isFinal;
          if (isFinal) { setInputText(""); setIsListening(false); if (transcript.trim()) sendMessageRef.current?.(transcript.trim()); }
          else setInputText(transcript);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (e: any) => {
          setIsListening(false);
          if (e.error === "not-allowed") setMicError("Autorise l'accès au microphone dans ton navigateur.");
          else if (e.error !== "no-speech" && e.error !== "aborted") setMicError("Erreur micro. Recharge la page.");
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
        autoStopRef.current = setTimeout(() => { try { recognition.stop(); } catch { /* ok */ } }, 30000);
        return;
      } catch { /* fallback */ }
    }

    if (typeof MediaRecorder === "undefined") {
      setMicError("Ton navigateur ne supporte pas le micro. Utilise Chrome, Edge ou Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 500) return;
        setIsTranscribing(true);
        try {
          const ext = recorder.mimeType?.includes("mp4") ? "mp4" : recorder.mimeType?.includes("ogg") ? "ogg" : "webm";
          const form = new FormData();
          form.append("audio", blob, `audio.${ext}`);
          const res = await fetch("/api/avatar/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text?.trim()) sendMessageRef.current?.(data.text.trim());
          else setMicError("Je n'ai rien compris. Réessaie.");
        } catch { setMicError("Erreur lors de la transcription."); }
        finally { setIsTranscribing(false); }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      autoStopRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop(); }, 30000);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") setMicError("Autorise l'accès au microphone dans ton navigateur.");
      else if (name === "NotFoundError") setMicError("Aucun micro détecté sur cet appareil.");
      else setMicError("Erreur micro. Recharge la page.");
    }
  }, [isListening]);

  const handleClose = () => {
    if (timer.secsAddedThisSession > 0) saveUsage.mutate({ secs: timer.secsAddedThisSession });
    timer.stopTimer();
    stop();
    onClose();
  };

  const isLoaderActive = isSpeaking || isLoading || isThinking || isTranscribing;
  const canSend = !isThinking && !timer.isExpired;

  // Suggestions contextuelles liées au plan
  const suggestions = [
    `Explique-moi "${planContext.notionActive}"`,
    "C'est quoi la prochaine étape ?",
    "Je ne comprends pas, aide-moi",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div
        className="pointer-events-auto flex flex-col w-full max-w-md h-[90vh] max-h-[700px] rounded-2xl bg-[var(--color-paper)] shadow-2xl border border-[rgba(91,79,207,0.25)] overflow-hidden"
        onClick={() => unlockAudio()}
      >
        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-rule)] bg-gradient-to-r from-[rgba(91,79,207,0.08)] to-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-purple)] text-sm font-black text-white shadow-sm">
              ✦
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)] leading-none">Mira</p>
              <p className="text-[11px] text-[var(--color-purple)] mt-0.5 font-medium">
                {planContext.matiereEmoji} {planContext.notionActive}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ctx && <SessionTimerBadge secsLeft={timer.secsLeft} maxSecs={timer.maxSecs} />}
            <button onClick={() => setIsMuted((m) => !m)}
              className="rounded-lg p-1.5 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              title={isMuted ? "Activer la voix" : "Désactiver la voix"}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button onClick={handleClose}
              className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Bandeau progression plan */}
        {planContext.nbNotions > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[rgba(91,79,207,0.04)] border-b border-[var(--color-rule)] flex-shrink-0">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-rule)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-purple)] transition-all"
                style={{ width: `${Math.round((planContext.nbMaitrisees / planContext.nbNotions) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-[var(--color-purple)] flex-shrink-0">
              {planContext.nbMaitrisees}/{planContext.nbNotions} notions ✅
            </p>
          </div>
        )}

        {/* Quota expiré */}
        {timer.isExpired && (
          <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex-shrink-0">
            <p className="text-xs font-semibold text-amber-700">
              Tu as utilisé ton quota de Mira pour cette semaine. Il se renouvelle lundi !
            </p>
          </div>
        )}

        {/* Historique */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--color-paper-warm)]">
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 pt-1">
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} disabled={!canSend}
                  className="rounded-xl border border-[rgba(91,79,207,0.2)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[rgba(91,79,207,0.06)] transition-colors text-left">
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <EnseignantIaBubble key={msg.id} message={msg} primaryColor={MIRA_COLOR} prenom={ctx?.prenom ?? "Toi"} />
          ))}
          {isThinking && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>

        {/* Barre d'état */}
        {(isLoaderActive || isListening) && (
          <div className="px-4 py-1.5 flex-shrink-0 bg-white border-t border-[var(--color-rule)]">
            <p className="text-[11px] text-[var(--color-ink-soft)] text-center animate-pulse">
              {isListening ? "🎙 Mira t'écoute…" : isTranscribing ? "Transcription en cours…" : isSpeaking ? "Mira parle…" : "Mira réfléchit…"}
            </p>
          </div>
        )}

        {micError && (
          <div className="px-4 py-2 flex-shrink-0 bg-red-50 border-t border-red-100">
            <p className="text-[11px] text-red-600 text-center">{micError}</p>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="px-3 py-3 border-t border-[var(--color-rule)] bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={toggleMic} disabled={!canSend && !isListening}
              className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                isListening ? "border-red-400 bg-red-50 text-red-500 animate-pulse" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"
              }`}
              title={isListening ? "Arrêter l'écoute" : "Parler à Mira"}>
              🎙
            </button>
            <input ref={inputRef} type="text" value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
              placeholder={timer.isExpired ? "Quota épuisé pour cette semaine" : "Écris ta question à Mira…"}
              disabled={!canSend}
              className="flex-1 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm outline-none focus:border-[var(--color-purple)] transition-colors placeholder:text-[var(--color-ink-soft)] disabled:opacity-50"
            />
            <button onClick={() => sendMessage(inputText)} disabled={!canSend || !inputText.trim()}
              className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-purple)] text-white hover:opacity-90 disabled:opacity-30 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bouton d'entrée dans le plan ──────────────────────────────────────────────

interface MiraPlanBtnProps {
  planContext: PlanContext;
  variant?: "inline" | "floating";
}

export function MiraPlanBtn({ planContext, variant = "inline" }: MiraPlanBtnProps) {
  const [open, setOpen] = useState(false);

  if (variant === "floating") {
    return (
      <>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-[var(--color-purple)] px-4 py-3 text-white shadow-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 md:bottom-6 bottom-24"
            aria-label="Demander de l'aide à Mira pour mon plan"
          >
            <span className="font-black text-base">✦</span>
            <span className="text-sm font-bold">Mira — mon plan</span>
          </button>
        )}
        {open && <MiraPlanPanel planContext={planContext} onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.04)] px-4 py-3.5 hover:bg-[rgba(91,79,207,0.08)] transition-all group"
        aria-label="Demander de l'aide à Mira"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-purple)] text-white text-sm font-black shadow-sm group-hover:scale-105 transition-transform">
          ✦
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Mira peut t'aider ! 💬
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
            Bloqué(e) sur {planContext.matiereEmoji} {planContext.notionActive} ? Pose-lui ta question.
          </p>
        </div>
        <span className="text-[var(--color-purple)] font-bold text-lg group-hover:translate-x-1 transition-transform">→</span>
      </button>

      {open && <MiraPlanPanel planContext={planContext} onClose={() => setOpen(false)} />}
    </>
  );
}
