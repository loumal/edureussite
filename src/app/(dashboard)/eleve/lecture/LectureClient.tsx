"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useLiveTranscription } from "@/hooks/useLiveTranscription";
import type { NiveauScolaire } from "@/generated/prisma";

// ── Types ──────────────────────────────────────────────────────────────────
type EtapeLecture =
  | "selection" | "form_livre" | "generation"
  | "lecture_texte" | "lecture_livre"
  | "questions" | "analyse" | "historique";

type ModeLecture = "TEXTE_GENERE" | "LIVRE_PERSO";

interface QuestionLecture {
  id: string;
  niveau: string;
  question: string;
  reponseEleve?: string;
  scoreQuestion?: number;
  feedbackQuestion?: string;
}

interface SessionData {
  id: string;
  mode: ModeLecture;
  statut: string;
  texteGenere?: string | null;
  titreLivre?: string | null;
  auteurLivre?: string | null;
  questions?: QuestionLecture[] | null;
  scoreGlobal?: number | null;
  analyseIA?: string | null;
  niveauPrecision?: string | null;
  vitesseMots?: number | null;
  dureeEffectiveSec?: number | null;
  nbMotsTexte?: number | null;
}

interface HistoriqueEntry {
  id: string;
  mode: ModeLecture;
  titreLivre?: string | null;
  auteurLivre?: string | null;
  vitesseMots?: number | null;
  scoreGlobal?: number | null;
  niveauPrecision?: string | null;
  dureeEffectiveSec?: number | null;
  createdAt: Date;
  analyseIA?: string | null;
}

interface Props {
  sessionActive: SessionData | null;
  historique: HistoriqueEntry[];
  prenom: string;
  niveauScolaire: NiveauScolaire;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const NIVEAUX_GIASSON: Record<string, string> = {
  MICROPROCESSUS: "Lecture directe",
  INTEGRATION: "Intégration",
  MACROPROCESSUS: "Idée principale",
  ELABORATION_CAUSAL: "Inférence causale",
  ELABORATION_PREDICTIF: "Prédiction",
};

function formatDuree(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function niveauPrecisionStyle(n?: string | null) {
  if (n === "INDEPENDANT") return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Indépendant" };
  if (n === "FONCTIONNEL") return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Fonctionnel" };
  return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "En développement" };
}

// ── Composant principal ───────────────────────────────────────────────────
export function LectureClient({ sessionActive, historique: historiqueInitial, prenom, niveauScolaire: _niveauScolaire }: Props) {
  const getInitialEtape = (): EtapeLecture => {
    if (!sessionActive) return "selection";
    if (sessionActive.statut === "QUESTIONS") return "questions";
    if (sessionActive.mode === "TEXTE_GENERE") return "lecture_texte";
    return "lecture_livre";
  };

  const [etape, setEtape] = useState<EtapeLecture>(getInitialEtape);
  const [session, setSession] = useState<SessionData | null>(sessionActive);

  // Form LIVRE_PERSO
  const [formTitre, setFormTitre] = useState("");
  const [formAuteur, setFormAuteur] = useState("");
  const [formNiveau, setFormNiveau] = useState<"FACILE" | "MOYEN" | "DIFFICILE">("MOYEN");

  // Timer
  const [dureeEffectiveSec, setDureeEffectiveSec] = useState(0);
  const [isPause, setIsPause] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Questions
  const [questionIndex, setQuestionIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [modeReponse, setModeReponse] = useState<Record<string, "ecrit" | "oral">>({});
  const [isRecordingQ, setIsRecordingQ] = useState<string | null>(null);

  // Transcription en direct (LIVRE_PERSO)
  const transcription = useLiveTranscription("fr-FR");

  // Mutations
  const creerSession = trpc.eleve.creerSessionLecture.useMutation();
  const terminerSession = trpc.eleve.terminerSessionLecture.useMutation();
  const soumettreReponses = trpc.eleve.soumettreReponsesLecture.useMutation();

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const enLecture = etape === "lecture_texte" || etape === "lecture_livre";
    if (!enLecture || isPause) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const last = { t: Date.now() };
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = Math.round((now - last.t) / 1000);
      last.t = now;
      setDureeEffectiveSec((p) => p + delta);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [etape, isPause]);

  // ── Pause/Reprise ──────────────────────────────────────────────────────
  const togglePause = () => {
    const next = !isPause;
    setIsPause(next);
    if (etape === "lecture_livre") {
      if (next) transcription.stopListening();
      else transcription.startListening();
    }
  };

  // ── Démarrer TEXTE_GENERE ──────────────────────────────────────────────
  const demarrerTexteGenere = async () => {
    setEtape("generation");
    try {
      const result = await creerSession.mutateAsync({ mode: "TEXTE_GENERE" });
      setSession(result as SessionData);
      setDureeEffectiveSec(0);
      setIsPause(false);
      setEtape("lecture_texte");
    } catch { setEtape("selection"); }
  };

  // ── Démarrer LIVRE_PERSO ──────────────────────────────────────────────
  const demarrerLivrePerso = async () => {
    if (!formTitre.trim()) return;
    try {
      const result = await creerSession.mutateAsync({
        mode: "LIVRE_PERSO",
        titreLivre: formTitre.trim(),
        auteurLivre: formAuteur.trim() || undefined,
        niveauLecture: formNiveau,
      });
      setSession(result as SessionData);
      setDureeEffectiveSec(0);
      setIsPause(false);
      transcription.reset();
      setEtape("lecture_livre");
      setTimeout(() => transcription.startListening(), 500);
    } catch { /* erreur gérée par creerSession.isError */ }
  };

  // ── Terminer la lecture ────────────────────────────────────────────────
  const terminerLecture = useCallback(async () => {
    if (!session) return;
    transcription.stopListening();
    try {
      const texteTranscrit = etape === "lecture_livre" && transcription.texteAccumule.trim()
        ? transcription.texteAccumule.trim()
        : undefined;
      const result = await terminerSession.mutateAsync({
        sessionId: session.id,
        dureeEffectiveSec,
        texteTranscrit,
      });
      setSession(result as SessionData);
      setQuestionIndex(0);
      setReponses({});
      setEtape("questions");
    } catch { /* erreur réseau */ }
  }, [session, etape, transcription, dureeEffectiveSec, terminerSession]);

  // ── Reconnaissance vocale pour les questions ───────────────────────────
  const startRecordingQuestion = (qId: string) => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setIsRecordingQ(qId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      setReponses((p) => ({ ...p, [qId]: e.results[0][0].transcript }));
      setIsRecordingQ(null);
    };
    rec.onerror = () => setIsRecordingQ(null);
    rec.onend = () => setIsRecordingQ(null);
    rec.start();
  };

  // ── Soumettre toutes les réponses ──────────────────────────────────────
  const soumettre = async () => {
    if (!session) return;
    const questions = (session.questions as QuestionLecture[]) ?? [];
    const payload = questions
      .map((q) => ({ questionId: q.id, reponse: reponses[q.id] ?? "" }))
      .filter((r) => r.reponse.trim());
    try {
      const result = await soumettreReponses.mutateAsync({ sessionId: session.id, reponses: payload });
      setSession(result as SessionData);
      setEtape("analyse");
    } catch { /* erreur réseau */ }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ÉCRANS
  // ═══════════════════════════════════════════════════════════════════════

  // ── Sélection du mode ──────────────────────────────────────────────────
  if (etape === "selection") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-3xl mb-1">📚</p>
          <h1 className="text-lg font-bold text-[var(--color-ink)]">Module Lecture</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Comment veux-tu commencer ?</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={demarrerTexteGenere}
            className="group rounded-2xl border border-[var(--color-rule)] bg-white p-5 text-left transition-all hover:border-blue-400 hover:shadow-md active:scale-95"
          >
            <div className="text-3xl mb-3">✨</div>
            <h2 className="font-bold text-[var(--color-ink)] mb-1">Texte du jour</h2>
            <p className="text-sm text-[var(--color-ink-soft)]">Mira génère un texte adapté à ton niveau et tes intérêts</p>
          </button>

          <button
            onClick={() => setEtape("form_livre")}
            className="group rounded-2xl border border-[var(--color-rule)] bg-white p-5 text-left transition-all hover:border-emerald-400 hover:shadow-md active:scale-95"
          >
            <div className="text-3xl mb-3">📖</div>
            <h2 className="font-bold text-[var(--color-ink)] mb-1">Mon livre</h2>
            <p className="text-sm text-[var(--color-ink-soft)]">Tu lis ton livre à voix haute — le système t'écoute et pose des questions sur ce que tu as lu</p>
          </button>
        </div>

        {historiqueInitial.length > 0 && (
          <button
            onClick={() => setEtape("historique")}
            className="w-full text-center text-sm text-[var(--color-ink-soft)] underline underline-offset-2"
          >
            Voir mes sessions passées ({historiqueInitial.length})
          </button>
        )}
      </div>
    );
  }

  // ── Formulaire LIVRE_PERSO ─────────────────────────────────────────────
  if (etape === "form_livre") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEtape("selection")} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">← Retour</button>
          <h1 className="font-bold text-[var(--color-ink)]">Ton livre</h1>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          🎤 Lis ton livre <strong>à voix haute</strong> — le système transcrit ta lecture pour générer des questions précises sur ce que tu as lu.
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">Titre du livre *</label>
            <input
              type="text" value={formTitre} onChange={(e) => setFormTitre(e.target.value)}
              placeholder="ex : Le Petit Prince"
              className="w-full rounded-xl border border-[var(--color-rule)] px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">Auteur (optionnel)</label>
            <input
              type="text" value={formAuteur} onChange={(e) => setFormAuteur(e.target.value)}
              placeholder="ex : Antoine de Saint-Exupéry"
              className="w-full rounded-xl border border-[var(--color-rule)] px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Niveau de difficulté</label>
            <div className="grid grid-cols-3 gap-2">
              {(["FACILE", "MOYEN", "DIFFICILE"] as const).map((n) => (
                <button
                  key={n} onClick={() => setFormNiveau(n)}
                  className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${formNiveau === n ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-emerald-300"}`}
                >
                  {n === "FACILE" ? "🟢 Facile" : n === "MOYEN" ? "🟡 Moyen" : "🔴 Difficile"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {creerSession.isError && (
          <p className="text-xs text-red-600">Erreur lors de la création. Réessaie.</p>
        )}

        <button
          onClick={demarrerLivrePerso}
          disabled={!formTitre.trim() || creerSession.isPending}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {creerSession.isPending ? "Préparation…" : "Commencer la lecture →"}
        </button>
      </div>
    );
  }

  // ── Génération en cours ────────────────────────────────────────────────
  if (etape === "generation") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="text-4xl animate-bounce">✨</div>
        <p className="font-bold text-[var(--color-ink)]">Mira prépare ton texte…</p>
        <p className="text-sm text-[var(--color-ink-soft)]">Un instant, elle crée un texte adapté à toi !</p>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Lecture du texte généré ────────────────────────────────────────────
  if (etape === "lecture_texte") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Texte du jour</p>
            <p className="font-bold text-[var(--color-ink)]">
              {isPause ? "⏸ En pause" : "📖 Lis le texte ci-dessous"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-[var(--color-ink)]">{formatDuree(dureeEffectiveSec)}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">temps de lecture</p>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
            {session?.texteGenere}
          </p>
        </div>

        {session?.nbMotsTexte && (
          <p className="text-center text-xs text-[var(--color-ink-soft)]">{session.nbMotsTexte} mots</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={togglePause}
            className={`rounded-xl py-3 text-sm font-bold transition-colors ${isPause ? "bg-blue-600 text-white" : "border border-[var(--color-rule)] text-[var(--color-ink)]"}`}
          >
            {isPause ? "▶ Reprendre" : "⏸ Pause"}
          </button>
          <button
            onClick={terminerLecture}
            disabled={dureeEffectiveSec < 5 || terminerSession.isPending}
            className="rounded-xl bg-[var(--color-ink)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {terminerSession.isPending ? "Génération des questions…" : "✅ Terminé"}
          </button>
        </div>
      </div>
    );
  }

  // ── Lecture du livre perso (+ transcription audio en direct) ──────────
  if (etape === "lecture_livre") {
    const nbMotsTranscrits = transcription.texteAccumule.split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{session?.titreLivre}</p>
            <p className="font-bold text-[var(--color-ink)]">
              {isPause ? "⏸ En pause" : transcription.isListening ? "🎤 Lis à voix haute…" : "📖 En lecture"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-[var(--color-ink)]">{formatDuree(dureeEffectiveSec)}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">temps de lecture</p>
          </div>
        </div>

        {/* Statut de la transcription */}
        <div className={`rounded-xl border px-4 py-3 transition-colors ${transcription.isListening ? "border-red-200 bg-red-50" : isPause ? "border-gray-200 bg-gray-50" : "border-amber-100 bg-amber-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm ${transcription.isListening ? "animate-pulse" : ""}`}>
              {transcription.isListening ? "🔴" : isPause ? "⏸" : "⏳"}
            </span>
            <span className={`text-xs font-semibold ${transcription.isListening ? "text-red-700" : isPause ? "text-gray-600" : "text-amber-700"}`}>
              {transcription.isListening
                ? "Système en écoute — lis à voix haute"
                : isPause
                  ? "Micro en pause — reprends quand tu es prêt"
                  : "Initialisation du micro…"}
            </span>
            {nbMotsTranscrits > 0 && (
              <span className="ml-auto text-xs text-[var(--color-ink-soft)]">{nbMotsTranscrits} mots capturés</span>
            )}
          </div>

          {/* Transcription en temps réel */}
          {(transcription.texteAccumule || transcription.texteInterim) && (
            <div className="mt-2 max-h-36 overflow-y-auto rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-[var(--color-ink)]">
              <span>{transcription.texteAccumule}</span>
              <span className="italic text-[var(--color-ink-soft)]">{transcription.texteInterim}</span>
            </div>
          )}

          {transcription.error && (
            <p className="mt-1 text-xs text-red-600">{transcription.error}</p>
          )}

          {!transcription.isSupported && (
            <p className="mt-1 text-xs text-amber-700">
              ⚠️ Transcription non disponible dans ce navigateur. Les questions seront générées à partir du titre du livre.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={togglePause}
            className={`rounded-xl py-3 text-sm font-bold transition-colors ${isPause ? "bg-blue-600 text-white" : "border border-[var(--color-rule)] text-[var(--color-ink)]"}`}
          >
            {isPause ? "▶ Reprendre" : "⏸ Pause"}
          </button>
          <button
            onClick={terminerLecture}
            disabled={dureeEffectiveSec < 10 || terminerSession.isPending}
            className="rounded-xl bg-[var(--color-ink)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {terminerSession.isPending ? "Génération des questions…" : "✅ Terminé"}
          </button>
        </div>
      </div>
    );
  }

  // ── Questions de compréhension (Giasson) ─────────────────────────────
  if (etape === "questions") {
    const questions = (session?.questions as QuestionLecture[]) ?? [];
    const q = questions[questionIndex];
    if (!q) return null;

    const isLast = questionIndex === questions.length - 1;
    const allAnswered = questions.every((qq) => reponses[qq.id]?.trim());
    const modeQ = modeReponse[q.id] ?? "ecrit";

    return (
      <div className="space-y-5">
        {/* Barre de progression */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full bg-gray-100 h-2">
            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${(questionIndex / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-[var(--color-ink-soft)]">{questionIndex + 1} / {questions.length}</span>
        </div>

        {/* Badge niveau Giasson */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            {NIVEAUX_GIASSON[q.niveau] ?? q.niveau}
          </span>
          <span className="text-xs text-[var(--color-ink-soft)]">Question {questionIndex + 1}</span>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4">
          <p className="font-semibold leading-relaxed text-[var(--color-ink)]">{q.question}</p>
        </div>

        {/* Choix du mode de réponse */}
        <div className="flex gap-2">
          <button
            onClick={() => setModeReponse((p) => ({ ...p, [q.id]: "ecrit" }))}
            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${modeQ === "ecrit" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-[var(--color-rule)] text-[var(--color-ink-soft)]"}`}
          >
            ✏️ Écrire
          </button>
          <button
            onClick={() => setModeReponse((p) => ({ ...p, [q.id]: "oral" }))}
            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${modeQ === "oral" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-[var(--color-rule)] text-[var(--color-ink-soft)]"}`}
          >
            🎤 Parler
          </button>
        </div>

        {/* Zone de réponse */}
        {modeQ === "ecrit" ? (
          <textarea
            value={reponses[q.id] ?? ""}
            onChange={(e) => setReponses((p) => ({ ...p, [q.id]: e.target.value }))}
            placeholder="Écris ta réponse ici…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--color-rule)] px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        ) : (
          <div className="space-y-3 text-center">
            <button
              onClick={() => startRecordingQuestion(q.id)}
              disabled={isRecordingQ !== null}
              className={`w-full rounded-xl py-4 text-sm font-bold transition-all ${isRecordingQ === q.id ? "animate-pulse border-2 border-red-500 bg-red-50 text-red-600" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
            >
              {isRecordingQ === q.id ? "🔴 Enregistrement… parle maintenant" : "🎤 Appuie pour répondre à voix haute"}
            </button>
            {reponses[q.id] && (
              <div className="rounded-xl border bg-gray-50 p-3 text-left text-sm text-[var(--color-ink)]">
                <p className="mb-1 text-xs text-[var(--color-ink-soft)]">Transcription :</p>
                <p>"{reponses[q.id]}"</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation entre questions */}
        <div className="grid grid-cols-2 gap-3">
          {questionIndex > 0 && (
            <button onClick={() => setQuestionIndex((p) => p - 1)} className="rounded-xl border border-[var(--color-rule)] py-2.5 text-sm font-semibold text-[var(--color-ink)]">
              ← Précédente
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setQuestionIndex((p) => p + 1)}
              disabled={!reponses[q.id]?.trim()}
              className={`${questionIndex === 0 ? "col-span-2" : ""} rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors`}
            >
              Suivante →
            </button>
          ) : (
            <button
              onClick={soumettre}
              disabled={!allAnswered || soumettreReponses.isPending}
              className="rounded-xl bg-[var(--color-ink)] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {soumettreReponses.isPending ? "Analyse en cours…" : "✅ Envoyer mes réponses"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Analyse finale ─────────────────────────────────────────────────────
  if (etape === "analyse" && session) {
    const style = niveauPrecisionStyle(session.niveauPrecision);
    let analyse = { analyse: "", force: "", defi: "" };
    try { analyse = JSON.parse(session.analyseIA ?? "{}"); } catch { /* vide */ }

    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="mb-2 text-4xl">🎉</p>
          <h1 className="text-lg font-bold text-[var(--color-ink)]">Bravo {prenom} !</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">Session de lecture complétée</p>
        </div>

        {/* Statistiques */}
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-[var(--color-ink)]">{session.scoreGlobal ?? "—"}%</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Compréhension</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--color-ink)]">
                {session.vitesseMots ? Math.round(session.vitesseMots) : "—"}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">mots/min</p>
            </div>
            <div>
              <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold border ${style.text} ${style.bg}`}>
                {style.label}
              </span>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">Niveau</p>
            </div>
          </div>
          {session.dureeEffectiveSec && (
            <p className="mt-3 text-center text-xs text-[var(--color-ink-soft)]">Durée effective : {formatDuree(session.dureeEffectiveSec)}</p>
          )}
        </div>

        {/* Analyse IA */}
        {analyse.analyse && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-1">
            <p className="text-sm leading-relaxed text-blue-800">{analyse.analyse}</p>
            {analyse.force && <p className="text-xs text-blue-700">✅ {analyse.force}</p>}
            {analyse.defi && <p className="text-xs text-blue-700">🎯 {analyse.defi}</p>}
          </div>
        )}

        {/* Détail par question */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-[var(--color-ink)]">Tes réponses</p>
          {((session.questions as QuestionLecture[]) ?? []).map((q) => (
            <div key={q.id} className="rounded-xl border border-[var(--color-rule)] bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-[var(--color-ink-soft)]">{NIVEAUX_GIASSON[q.niveau] ?? q.niveau}</p>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--color-ink)]">{q.question}</p>
                  {q.reponseEleve && <p className="mt-1 text-xs italic text-[var(--color-ink-soft)]">"{q.reponseEleve}"</p>}
                  {q.feedbackQuestion && <p className="mt-1 text-xs text-blue-600">{q.feedbackQuestion}</p>}
                </div>
                {q.scoreQuestion !== undefined && (
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${q.scoreQuestion >= 80 ? "bg-emerald-100 text-emerald-700" : q.scoreQuestion >= 60 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                    {q.scoreQuestion}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setEtape("historique")} className="rounded-xl border border-[var(--color-rule)] py-2.5 text-sm font-semibold text-[var(--color-ink)]">
            📋 Historique
          </button>
          <button
            onClick={() => { setSession(null); setReponses({}); setDureeEffectiveSec(0); transcription.reset(); setEtape("selection"); }}
            className="rounded-xl bg-[var(--color-ink)] py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            + Nouvelle session
          </button>
        </div>
      </div>
    );
  }

  // ── Historique des sessions ────────────────────────────────────────────
  if (etape === "historique") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setEtape("selection")} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">← Retour</button>
          <h1 className="font-bold text-[var(--color-ink)]">Mes sessions de lecture</h1>
        </div>

        {historiqueInitial.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">Aucune session terminée pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {historiqueInitial.map((h) => {
              const st = niveauPrecisionStyle(h.niveauPrecision);
              return (
                <div key={h.id} className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        {h.mode === "TEXTE_GENERE" ? "✨ Texte du jour" : `📖 ${h.titreLivre}`}
                      </p>
                      {h.auteurLivre && <p className="text-xs text-[var(--color-ink-soft)]">{h.auteurLivre}</p>}
                      <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                        {new Date(h.createdAt).toLocaleDateString("fr-CA")}
                        {h.dureeEffectiveSec ? ` · ${formatDuree(h.dureeEffectiveSec)}` : ""}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      {h.scoreGlobal != null && <p className="text-sm font-bold text-[var(--color-ink)]">{h.scoreGlobal}%</p>}
                      {h.vitesseMots && <p className="text-xs text-[var(--color-ink-soft)]">{Math.round(h.vitesseMots)} m/min</p>}
                      {h.niveauPrecision && (
                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-bold border ${st.text} ${st.bg}`}>
                          {st.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
