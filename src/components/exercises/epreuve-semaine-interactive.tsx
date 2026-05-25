"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EpreuveGeneree, QuestionEpreuve } from "@/lib/ai/exercice";

// ── Types ──────────────────────────────────────────────────────────────────────

type Reponses = Record<string, string>;

export interface FeedbackSemaine {
  score?: number;
  mention?: string;
  ceQueJaiReussi?: string;
  encouragement?: string;
  prochainePiste?: string;
  correctionParQuestion?: Record<string, {
    bonne: boolean;
    pointsObtenus: number;
    explication: string;
  }>;
}

interface Props {
  epreuveId: string;
  epreuve: EpreuveGeneree;
  statut: string;
  feedbackExistant?: FeedbackSemaine | null;
  progressionSauvegardee?: { partieActive?: number; reponses?: Reponses } | null;
  tempsSauvegardeSecondes?: number;
  prenom: string;
  semaineISO: string;
}

// ── Composant principal ────────────────────────────────────────────────────────

export function EpreuveSemaineInteractive({
  epreuveId,
  epreuve,
  statut,
  feedbackExistant,
  progressionSauvegardee,
  tempsSauvegardeSecondes = 0,
  prenom,
  semaineISO,
}: Props) {
  const router = useRouter();
  const dejaTermine = statut === "TERMINE";

  // Restaurer la progression sauvegardée ou démarrer à zéro
  const [reponses, setReponses] = useState<Reponses>(
    dejaTermine
      ? (progressionSauvegardee?.reponses ?? {})
      : (progressionSauvegardee?.reponses ?? {})
  );
  const [partieActive, setPartieActive] = useState(
    dejaTermine ? 0 : (progressionSauvegardee?.partieActive ?? 0)
  );
  const [temps, setTemps] = useState(tempsSauvegardeSecondes);
  const [soumis, setSoumis] = useState(dejaTermine);
  const [estEnPause, setEstEnPause] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [sauvegardeeOk, setSauvegardeeOk] = useState(false);

  // Ref pour éviter double-pause
  const pauseRef = useRef(false);

  // ── Chronomètre ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (soumis || estEnPause) return;
    const t = setInterval(() => setTemps((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [soumis, estEnPause]);

  // ── tRPC mutations ───────────────────────────────────────────────────────────
  const sauvegarderProgression = trpc.plan.sauvegarderProgressionEpreuveSemaine.useMutation();
  const terminer = trpc.plan.terminerEpreuveSemaine.useMutation({
    onSuccess: () => {
      jouerSonNotification();
      setSoumis(true);
      router.refresh();
    },
  });

  // ── Pause : sauvegarder et afficher message ──────────────────────────────────
  const handlePause = useCallback(async () => {
    if (pauseRef.current || estEnPause) return;
    pauseRef.current = true;
    setEstEnPause(true);
    setSauvegardeEnCours(true);
    try {
      await sauvegarderProgression.mutateAsync({
        epreuveId,
        partieActive,
        reponses,
        tempsSecondes: temps,
      });
      setSauvegardeeOk(true);
    } finally {
      setSauvegardeEnCours(false);
      pauseRef.current = false;
    }
  }, [epreuveId, partieActive, reponses, temps, estEnPause, sauvegarderProgression]);

  const handleReprendre = () => {
    setEstEnPause(false);
    setSauvegardeeOk(false);
  };

  // ── Soumission finale ────────────────────────────────────────────────────────
  const handleSoumettre = () => {
    terminer.mutate({ epreuveId, reponses, tempsSecondes: temps });
  };

  // ── Calculs ─────────────────────────────────────────────────────────────────
  const partieActuelle = epreuve.parties[partieActive];
  const totalRepondues = Object.keys(reponses).filter((k) => reponses[k]?.trim()).length;
  const totalQuestions = epreuve.parties.reduce((sum, p) => sum + p.questions.length, 0);
  const formatTemps = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const feedbackBrut: FeedbackSemaine | null =
    (terminer.data?.feedback as FeedbackSemaine | undefined) ?? feedbackExistant ?? null;

  // ── Feedback final ───────────────────────────────────────────────────────────
  if (soumis && feedbackBrut) {
    return (
      <FeedbackPanel
        feedback={feedbackBrut}
        epreuve={epreuve}
        reponses={reponses}
        semaineISO={semaineISO}
        prenom={prenom}
      />
    );
  }

  // ── Correction en cours ──────────────────────────────────────────────────────
  if (terminer.isPending) {
    return <CorrectionEnCours />;
  }

  // ── Écran de pause ───────────────────────────────────────────────────────────
  if (estEnPause) {
    return (
      <div className="flex flex-col items-center justify-center py-14 space-y-6 text-center">
        <div className="text-6xl">⏸️</div>
        <div>
          <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">Épreuve en pause</h2>
          <p className="text-sm text-[var(--color-ink-soft)] max-w-xs mx-auto leading-relaxed">
            {sauvegardeEnCours
              ? "Sauvegarde en cours…"
              : sauvegardeeOk
              ? "✅ Ta progression est sauvegardée. Tu peux fermer cette page et reprendre plus tard."
              : "Sauvegarde de ta progression…"}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={handleReprendre} className="w-full">
            ▶️ Reprendre l&apos;épreuve
          </Button>
          <Button variant="secondary" onClick={() => router.push("/eleve/plan")} className="w-full">
            ← Retour au plan
          </Button>
        </div>
        <p className="text-xs text-[var(--color-ink-soft)]">
          ⏱ {formatTemps(temps)} écoulées · {totalRepondues}/{totalQuestions} questions répondues
        </p>
      </div>
    );
  }

  // ── Épreuve en cours ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="rounded-full bg-[rgba(91,79,207,0.12)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-purple)]">
              🏆 Épreuve de la semaine
            </span>
            <span className="text-xs text-[var(--color-ink-soft)]">
              {epreuve.dureeMinutes} min · {epreuve.totalPoints} pts
            </span>
            <span className="text-xs text-[var(--color-ink-soft)]">
              Semaine {semaineISO.split("-W")[1]}
            </span>
          </div>
          <h1 className="text-xl font-black text-[var(--color-ink)] leading-tight">{epreuve.titre}</h1>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-black text-[var(--color-ink)] font-mono">{formatTemps(temps)}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {totalRepondues}/{totalQuestions} répondues
          </p>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div>
        <Progress
          value={Math.round((totalRepondues / Math.max(totalQuestions, 1)) * 100)}
          size="sm"
        />
        <p className="text-[10px] text-[var(--color-ink-soft)] mt-1">
          {Math.round((totalRepondues / Math.max(totalQuestions, 1)) * 100)}% complété
        </p>
      </div>

      {/* Bouton pause */}
      <div className="flex justify-end">
        <button
          onClick={handlePause}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] transition-colors"
        >
          ⏸️ Faire une pause
        </button>
      </div>

      {/* Notions ciblées */}
      {epreuve.notionsCiblees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {epreuve.notionsCiblees.map((n, i) => (
            <span
              key={i}
              className="rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-0.5 text-xs text-[var(--color-ink-soft)]"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Mise en situation */}
      <Card className="p-5 border-l-4 border-[var(--color-purple)] bg-[rgba(91,79,207,0.03)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-2">
          📖 Mise en situation
        </p>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">
          {epreuve.miseEnSituation}
        </p>
      </Card>

      {/* Onglets parties */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {epreuve.parties.map((p, i) => {
          const repParPartie = p.questions.filter((q) => reponses[q.id]?.trim()).length;
          return (
            <button
              key={p.numero}
              onClick={() => setPartieActive(i)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                partieActive === i
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
              }`}
            >
              Partie {p.numero}
              <span className={`ml-1.5 ${partieActive === i ? "text-white/70" : "text-[var(--color-ink-soft)]"}`}>
                {repParPartie}/{p.questions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions de la partie active */}
      {partieActuelle && (
        <Card className="overflow-hidden">
          <div className="bg-[var(--color-paper-warm)] px-5 py-4 border-b border-[var(--color-rule)]">
            <h2 className="text-base font-black text-[var(--color-ink)]">{partieActuelle.titre}</h2>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {partieActuelle.description} · {partieActuelle.points} points
            </p>
          </div>
          <div className="divide-y divide-[var(--color-rule)]">
            {partieActuelle.questions.map((q, qi) => (
              <QuestionBlock
                key={q.id}
                question={q}
                numero={qi + 1}
                valeur={reponses[q.id] ?? ""}
                onChange={(val) => setReponses((prev) => ({ ...prev, [q.id]: val }))}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => setPartieActive((i) => Math.max(0, i - 1))}
          disabled={partieActive === 0}
        >
          ← Partie précédente
        </Button>
        {partieActive < epreuve.parties.length - 1 ? (
          <Button onClick={() => setPartieActive((i) => i + 1)}>
            Partie suivante →
          </Button>
        ) : (
          <Button
            onClick={handleSoumettre}
            disabled={terminer.isPending || totalRepondues === 0}
            className="bg-[var(--color-success)]"
          >
            Remettre l&apos;épreuve ✓
          </Button>
        )}
      </div>

      {/* Avertissement questions sans réponse */}
      {partieActive === epreuve.parties.length - 1 && totalRepondues < totalQuestions && (
        <p className="text-center text-xs text-[var(--color-accent)]">
          ⚠️ {totalQuestions - totalRepondues} question
          {totalQuestions - totalRepondues > 1 ? "s" : ""} sans réponse
        </p>
      )}

      {terminer.isError && (
        <div className="text-center">
          <p className="text-sm text-[var(--color-accent)]">Une erreur s&apos;est produite. Réessaie.</p>
        </div>
      )}
    </div>
  );
}

// ── Bloc question ─────────────────────────────────────────────────────────────

function QuestionBlock({
  question, numero, valeur, onChange,
}: {
  question: QuestionEpreuve;
  numero: number;
  valeur: string;
  onChange: (val: string) => void;
}) {
  const ptLabel = `${question.pointsQuestion} pt${question.pointsQuestion > 1 ? "s" : ""}`;

  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2 flex-1">
          <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-bold">
            {numero}
          </span>
          <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">{question.enonce}</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-xs font-bold text-[var(--color-ink-soft)]">
          {ptLabel}
        </span>
      </div>

      {question.type === "QCM" && question.choix && (
        <div className="ml-8 space-y-3">
          <div className="space-y-1.5">
            {question.choix.map((c) => {
              const selectionne = valeur.trim().toUpperCase() === c.lettre.toUpperCase()
                || valeur.trim().toLowerCase() === c.texte.toLowerCase();
              return (
                <button
                  key={c.lettre}
                  onClick={() => onChange(c.texte)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                    selectionne
                      ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]"
                      : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <span className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold mt-0.5 ${
                    selectionne
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)] text-white"
                      : "border-[var(--color-rule)] text-[var(--color-ink-soft)]"
                  }`}>{c.lettre}</span>
                  <span className="text-[var(--color-ink)]">{c.texte}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {question.type === "REPONSE_COURTE" && (
        <input
          type="text"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ta réponse…"
          className="ml-8 w-[calc(100%-2rem)] rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
      )}

      {(question.type === "DEVELOPPEMENT" || question.type === "PROBLEME") && (
        <div className="ml-8">
          <textarea
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              question.type === "PROBLEME"
                ? "Montre ta démarche étape par étape…"
                : "Développe ta réponse ici…"
            }
            rows={5}
            className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] resize-none"
          />
          {question.type === "PROBLEME" && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              💡 Montre toutes les étapes — des points sont accordés pour chaque étape.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panneau de feedback final ─────────────────────────────────────────────────

function FeedbackPanel({
  feedback, epreuve, reponses, semaineISO, prenom,
}: {
  feedback: FeedbackSemaine;
  epreuve: EpreuveGeneree;
  reponses: Reponses;
  semaineISO: string;
  prenom: string;
}) {
  const score = feedback.score ?? 0;
  const [partieOuverte, setPartieOuverte] = useState(0);

  return (
    <div className="space-y-5">

      {/* Score global */}
      <Card className="overflow-hidden p-0">
        <div className={`p-7 text-center ${
          score >= 80 ? "bg-gradient-to-br from-[rgba(42,124,111,0.08)] to-white"
          : score >= 60 ? "bg-gradient-to-br from-[rgba(201,149,42,0.08)] to-white"
          : "bg-gradient-to-br from-[rgba(217,79,43,0.06)] to-white"
        }`}>
          <div className="text-5xl mb-3">
            {score >= 90 ? "🌟" : score >= 75 ? "🏆" : score >= 60 ? "👍" : "💪"}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)] mb-1">
            {feedback.mention ?? (score >= 80 ? "Excellent !" : score >= 60 ? "Bien !" : "En progression")}
          </p>
          <div className="text-5xl font-black text-[var(--color-ink)] mb-1">
            {Math.round(score)}
            <span className="text-2xl font-medium text-[var(--color-ink-soft)]">/100</span>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            Épreuve de la semaine {semaineISO.split("-W")[1]}
          </p>
          <div className="mx-auto max-w-xs mt-3">
            <Progress
              value={score}
              color={score >= 80 ? "success" : score >= 60 ? "gold" : "accent"}
              size="lg"
            />
          </div>
        </div>

        {feedback.ceQueJaiReussi && (
          <div className="border-t border-[var(--color-rule)] px-6 py-4 bg-[rgba(42,124,111,0.03)]">
            <div className="flex items-start gap-2.5">
              <span className="text-lg flex-shrink-0">✅</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-0.5">
                  Ce que tu as bien réussi
                </p>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.ceQueJaiReussi}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Correction par partie */}
      {feedback.correctionParQuestion && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📐</span>
            <h3 className="text-base font-black text-[var(--color-ink)]">Correction détaillée</h3>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {epreuve.parties.map((p, i) => (
              <button
                key={p.numero}
                onClick={() => setPartieOuverte(i)}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  partieOuverte === i
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
                }`}
              >
                Partie {p.numero}
              </button>
            ))}
          </div>

          {epreuve.parties[partieOuverte] && (
            <div className="space-y-3">
              {epreuve.parties[partieOuverte].questions.map((q, qi) => {
                const corr = feedback.correctionParQuestion?.[q.id];
                const reponseEleve = reponses[q.id];
                const bonne = corr?.bonne ?? false;
                const pts = corr?.pointsObtenus ?? (bonne ? q.pointsQuestion : 0);
                return (
                  <div key={q.id} className="rounded-2xl border border-[var(--color-rule)] overflow-hidden">
                    <div className={`px-5 py-4 ${bonne ? "bg-[rgba(42,124,111,0.04)]" : "bg-[rgba(217,79,43,0.03)]"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${bonne ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"}`}>
                          {bonne ? "✓" : "✗"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[var(--color-ink-soft)]">Question {qi + 1}</span>
                            <span className="text-[var(--color-rule)]">·</span>
                            <span className={`text-xs font-bold ${bonne ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                              {pts}/{q.pointsQuestion} pt{q.pointsQuestion > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">{q.enonce}</p>
                        </div>
                      </div>

                      {/* Réponse élève */}
                      <div className="mt-3 ml-9 rounded-lg bg-white border border-[var(--color-rule)] px-3 py-2">
                        <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-0.5">Ta réponse</p>
                        {reponseEleve
                          ? <p className="text-sm text-[var(--color-ink)] italic">{reponseEleve}</p>
                          : <p className="text-sm text-[var(--color-ink-soft)] italic">Aucune réponse</p>
                        }
                      </div>

                      {/* Explication */}
                      {corr?.explication && (
                        <div className={`mt-3 ml-9 rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          bonne
                            ? "bg-[rgba(42,124,111,0.08)] text-[var(--color-ink)]"
                            : "bg-[rgba(217,79,43,0.06)] text-[var(--color-ink)]"
                        }`}>
                          {corr.explication}
                        </div>
                      )}

                      {/* Réponse attendue si incorrect */}
                      {!bonne && (
                        <div className="mt-2 ml-9 rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] px-3 py-2">
                          <p className="text-xs font-bold text-[var(--color-success)] mb-0.5">✍️ Réponse attendue</p>
                          <p className="text-sm text-[var(--color-ink)]">{q.reponseAttendue}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Prochaine piste */}
      {feedback.prochainePiste && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🗺️</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                Pour progresser
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.prochainePiste}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Encouragement */}
      {feedback.encouragement && (
        <div className="rounded-2xl bg-[var(--color-ink)] p-5 text-center">
          <p className="text-base font-semibold text-white leading-relaxed">{feedback.encouragement}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <a href="/eleve/plan" className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">🗺️ Mon plan</Button>
        </a>
        <a href="/eleve/exercices/nouveau" className="flex-[2]">
          <Button size="lg" className="w-full">Nouvel exercice ✨</Button>
        </a>
      </div>
    </div>
  );
}

// ── Écran correction en cours ─────────────────────────────────────────────────

const MESSAGES_CORRECTION = [
  { emoji: "🔍", texte: "Nous lisons tes réponses attentivement…" },
  { emoji: "🧮", texte: "Nous calculons tes points…" },
  { emoji: "📚", texte: "Nous analysons ta compréhension des notions…" },
  { emoji: "✏️", texte: "Nous préparons ton feedback personnalisé…" },
  { emoji: "🌟", texte: "La correction sera bientôt prête…" },
];

function CorrectionEnCours() {
  const [secondes, setSecondes] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES_CORRECTION.length), 3500);
    return () => clearInterval(t);
  }, []);

  const MAX_S = 240;
  const progression = Math.min(secondes / MAX_S, 0.98);
  const rayon = 52;
  const circonf = 2 * Math.PI * rayon;
  const dashOffset = circonf * (1 - progression);
  const { emoji, texte } = MESSAGES_CORRECTION[msgIndex];

  return (
    <div className="flex flex-col items-center justify-center py-14 space-y-7">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={rayon} fill="none" stroke="var(--color-rule)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={rayon} fill="none"
            stroke="var(--color-purple)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circonf} strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl" key={msgIndex}>
          {emoji}
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-xl font-black text-[var(--color-ink)]">Correction en cours…</p>
        <p className="text-sm text-[var(--color-ink-soft)] min-h-[1.25rem]" key={msgIndex}>
          {texte}
        </p>
      </div>
      <p className="text-xs text-[var(--color-ink-soft)]">⏱ Cette correction peut prendre 1 à 3 minutes</p>
    </div>
  );
}

// ── Son de notification ───────────────────────────────────────────────────────

function jouerSonNotification() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch { /* ignore */ }
}
