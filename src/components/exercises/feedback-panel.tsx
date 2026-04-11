"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Exercice, ExerciceAssigne } from "@/generated/prisma";
import { useGameSound } from "@/hooks/useGameSound";
import { CelebrationOverlay } from "@/components/eleve/celebration-overlay";
import { RenduVisuels, type Visuel } from "./rendus/rendu-visuel";
import { trpc } from "@/lib/trpc/client";

interface EtapeCorrection {
  titre: string;
  explication: string;
  conseil?: string;
  rappelTheorique?: string;
  solution?: string;
  erreurEleve?: string;
  visuels?: Visuel[];
}

interface ExempleSimilaire {
  enonce: string;
  solution: string;
  pourquoi: string;
}

interface DiagnosticErreur {
  typeErreur: "lacune_conceptuelle" | "erreur_de_procedure" | "etourderie" | "mauvaise_lecture_tache" | "reponse_correcte";
  explication: string;
  frequence?: string;
}

interface StrategieAntiRepetition {
  reflexeAConstruire: string;
  piegeAEviter: string;
  exerciceDeRenforcement: string;
}

interface FeedbackStructure {
  score: number;
  correct: boolean;
  mention: string;
  ceQueJaiReussi: string;
  diagnosticErreur?: DiagnosticErreur;
  correctionDetaillee?: {
    etape1?: EtapeCorrection;
    etape2?: EtapeCorrection;
    etape3?: EtapeCorrection;
    etape4?: EtapeCorrection;
  };
  strategieAntiRepetition?: StrategieAntiRepetition;
  questionsReflexion?: string[];
  methodeOfficielle?: string;
  lienPFEQ?: string;
  astuceMemoire?: string;
  exempleSimilaire?: ExempleSimilaire;
  encouragement?: string;
  prochainePiste?: string;
  // Anciens champs (rétrocompatibilité)
  explication?: string;
  bonneReponse?: string;
}

const DIAGNOSTIC_LABELS: Record<string, { label: string; couleur: string; icon: string }> = {
  lacune_conceptuelle: { label: "Lacune conceptuelle", couleur: "rgba(217,79,43,0.08)", icon: "📖", },
  erreur_de_procedure: { label: "Erreur de procédure", couleur: "rgba(201,149,42,0.08)", icon: "🔧" },
  etourderie: { label: "Étourderie", couleur: "rgba(91,79,207,0.08)", icon: "⚡" },
  mauvaise_lecture_tache: { label: "Mauvaise lecture de la tâche", couleur: "rgba(217,79,43,0.08)", icon: "👁️" },
  reponse_correcte: { label: "Bonne réponse", couleur: "rgba(42,124,111,0.08)", icon: "✅" },
};

interface Props {
  assignation: ExerciceAssigne;
  exercice: Exercice;
  objectifAtteint?: { matiere: string; scoreVise: number; atteint: boolean } | null;
  planNotionActive?: { id: string; notion: string; matiere: string } | null;
}

// Positions fixes pour éviter l'hydratation serveur/client
const CONFETTI_DATA = [
  { left: 8,  delay: 0,   emoji: "🎉" }, { left: 20, delay: 80,  emoji: "⭐" },
  { left: 33, delay: 150, emoji: "✨" }, { left: 47, delay: 40,  emoji: "🌟" },
  { left: 60, delay: 120, emoji: "🎊" }, { left: 72, delay: 30,  emoji: "💫" },
  { left: 85, delay: 170, emoji: "⭐" }, { left: 14, delay: 220, emoji: "🎉" },
  { left: 40, delay: 260, emoji: "✨" }, { left: 67, delay: 200, emoji: "🌟" },
  { left: 90, delay: 90,  emoji: "🎊" }, { left: 54, delay: 310, emoji: "💫" },
];

const MATIERE_LABEL_FR: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
};

export function FeedbackPanel({ assignation, objectifAtteint, planNotionActive }: Props) {
  const router = useRouter();
  const [affiche, setAffiche] = useState(false);
  const [etapeOuverte, setEtapeOuverte] = useState<number | null>(null);
  const [reflexionOuverte, setReflexionOuverte] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const confettiFired = useRef(false);
  const score = assignation.score ?? 0;

  const markMaitrisee = trpc.plan.markNotionMaitrisee.useMutation({
    onSuccess: () => {
      router.push("/eleve/plan");
    },
  });
  const feedback = parseFeedback(assignation.feedbackIA);
  const { playSuccess } = useGameSound();

  useEffect(() => {
    const t = setTimeout(async () => {
      setAffiche(true);
      if (score < 80) setEtapeOuverte(1);
      if (score >= 80 && !confettiFired.current) {
        confettiFired.current = true;
        setConfettiKey((k) => k + 1);

        // Son de réussite
        playSuccess();

        // Canvas-confetti (explosion plein écran)
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: score >= 95 ? 180 : 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#5b4fcf", "#c9952a", "#2a7c6f", "#d94f2b", "#ffffff"],
          scalar: 1.1,
          gravity: 0.9,
        });
        // Deuxième vague décalée pour les très bons scores
        if (score >= 90) {
          setTimeout(() => {
            confetti({
              particleCount: 60,
              spread: 120,
              origin: { y: 0.4, x: Math.random() > 0.5 ? 0.2 : 0.8 },
              colors: ["#5b4fcf", "#c9952a", "#2a7c6f"],
              scalar: 0.8,
            });
          }, 400);
        }

        // Overlay plein écran après un court délai (laisse le confetti s'afficher d'abord)
        setTimeout(() => setShowCelebration(true), 600);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [score, playSuccess]);

  const scoreColor = score >= 80 ? "success" : score >= 60 ? "gold" : "accent";
  const etapes = feedback.correctionDetaillee
    ? Object.entries(feedback.correctionDetaillee).map(([key, val]) => ({
        num: parseInt(key.replace("etape", "")),
        ...(val as EtapeCorrection),
      }))
    : [];

  const diagnostic = feedback.diagnosticErreur;
  const diagnosticInfo = diagnostic ? DIAGNOSTIC_LABELS[diagnostic.typeErreur] : null;

  const celebrationCfg = getScoreCelebration(score);

  return (
    <div className={`transition-all duration-500 ${affiche ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

      {/* ── OVERLAY CÉLÉBRATION PLEIN ÉCRAN (score ≥ 80) ── */}
      {showCelebration && celebrationCfg && (
        <CelebrationOverlay
          type={celebrationCfg.type}
          titre={celebrationCfg.titre}
          soustitre={celebrationCfg.soustitre}
          emoji={celebrationCfg.emoji}
          autoCloseMs={celebrationCfg.autoCloseMs}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* ── CONFETTI (score ≥ 80) ── */}
      {score >= 80 && confettiKey > 0 && (
        <div key={confettiKey} className="relative h-0 overflow-visible pointer-events-none mb-0" aria-hidden>
          {CONFETTI_DATA.map((c, i) => (
            <span
              key={i}
              className="absolute text-lg animate-confetti"
              style={{ left: `${c.left}%`, animationDelay: `${c.delay}ms` }}
            >
              {c.emoji}
            </span>
          ))}
        </div>
      )}

      {/* ── SCORE ── */}
      <Card className="mb-5 overflow-hidden p-0">
        <div className={`p-6 text-center ${
          score >= 80 ? "bg-gradient-to-br from-[rgba(42,124,111,0.08)] to-white"
          : score >= 60 ? "bg-gradient-to-br from-[rgba(201,149,42,0.08)] to-white"
          : "bg-gradient-to-br from-[rgba(217,79,43,0.06)] to-white"
        }`}>
          <div className="text-5xl mb-3 animate-celebrate">{getScoreEmoji(score)}</div>
          <p className="text-sm font-bold text-[var(--color-ink-soft)] mb-1 uppercase tracking-wide">
            {feedback.mention ?? getScoreMessage(score)}
          </p>
          <div className="text-5xl font-black text-[var(--color-ink)] mb-1">
            {Math.round(score)}<span className="text-2xl text-[var(--color-ink-soft)]">/100</span>
          </div>
          <div className="mx-auto max-w-xs mt-3 mb-2">
            <Progress value={score} color={scoreColor} size="lg" />
          </div>
          {/* Badge XP gagné */}
          {(() => {
            const multiplicateur = score === 100 ? 2 : score >= 90 ? 1.5 : 1;
            const xpGagne = Math.round(score * multiplicateur);
            const bonus = multiplicateur > 1;
            return (
              <div className={`inline-flex items-center gap-1.5 mt-2 rounded-full px-4 py-1.5 border ${
                bonus
                  ? "bg-[rgba(201,149,42,0.15)] border-[rgba(201,149,42,0.35)]"
                  : "bg-[rgba(201,149,42,0.08)] border-[rgba(201,149,42,0.2)]"
              }`}>
                <span className="text-base">⭐</span>
                <span className="text-base font-black text-[var(--color-gold)]">+{xpGagne} XP</span>
                {bonus && (
                  <span className="text-[10px] font-bold text-[var(--color-gold)] bg-[rgba(201,149,42,0.2)] rounded-full px-1.5 py-0.5">
                    ×{multiplicateur}
                  </span>
                )}
              </div>
            );
          })()}
          {assignation.tempsSecondes && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-2">
              ⏱ Complété en {formatTemps(assignation.tempsSecondes)}
            </p>
          )}
        </div>

        {/* Ce que j'ai réussi */}
        {feedback.ceQueJaiReussi && (
          <div className="border-t border-[var(--color-rule)] px-6 py-4 bg-[rgba(42,124,111,0.03)]">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">✅</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-0.5">
                  Ce que tu as bien fait
                </p>
                <p className="text-sm text-[var(--color-ink)]">{feedback.ceQueJaiReussi}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── OBJECTIF ATTEINT ── */}
      {objectifAtteint?.atteint && (
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-[rgba(91,79,207,0.12)] to-[rgba(42,124,111,0.08)] border border-[rgba(91,79,207,0.25)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="font-black text-[var(--color-ink)] text-base">Objectif atteint !</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Tu as atteint ton objectif de{" "}
                <strong>{objectifAtteint.scoreVise}&nbsp;%</strong>{" "}
                en {MATIERE_LABEL_FR[objectifAtteint.matiere] ?? objectifAtteint.matiere}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold text-[var(--color-gold)]">+50 XP</p>
              <p className="text-[10px] text-[var(--color-ink-soft)]">bonus objectif</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed pl-12">
            Felicitations ! Continue à t&apos;entraîner pour maintenir ce niveau. 🎯
          </p>
        </div>
      )}

      {/* ── DIAGNOSTIC DE L'ERREUR ── */}
      {diagnostic && diagnostic.typeErreur !== "reponse_correcte" && diagnosticInfo && (
        <Card className="mb-5 p-5 overflow-hidden" style={{ background: diagnosticInfo.couleur, borderColor: "var(--color-rule)" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{diagnosticInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  Diagnostic
                </p>
                <span className="rounded-full bg-white border border-[var(--color-rule)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink)]">
                  {diagnosticInfo.label}
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{diagnostic.explication}</p>
              {diagnostic.frequence && (
                <p className="text-xs text-[var(--color-ink-soft)] mt-1 italic">{diagnostic.frequence}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── CORRECTION DÉTAILLÉE EN ÉTAPES ── */}
      {etapes.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📐</span>
            <h3 className="font-bold text-[var(--color-ink)]">Correction détaillée — méthode PFEQ</h3>
          </div>

          <div className="space-y-2">
            {etapes.sort((a, b) => a.num - b.num).map((etape) => (
              <div
                key={etape.num}
                className="rounded-2xl border border-[var(--color-rule)] overflow-hidden"
              >
                <button
                  onClick={() => setEtapeOuverte(etapeOuverte === etape.num ? null : etape.num)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[var(--color-paper-warm)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-black text-white flex-shrink-0">
                      {etape.num}
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{etape.titre}</span>
                  </div>
                  <span className="text-[var(--color-ink-soft)] text-xs">
                    {etapeOuverte === etape.num ? "▲" : "▼"}
                  </span>
                </button>

                {etapeOuverte === etape.num && (
                  <div className="px-5 pb-5 pt-3 bg-[var(--color-paper-warm)] border-t border-[var(--color-rule)] space-y-3 animate-fade-in">
                    <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                      {etape.explication}
                    </p>
                    {etape.visuels && <RenduVisuels visuels={etape.visuels} />}

                    {etape.conseil && (
                      <div className="rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.2)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-purple)] mb-1">💡 Réflexe à adopter</p>
                        <p className="text-sm text-[var(--color-ink)]">{etape.conseil}</p>
                      </div>
                    )}

                    {etape.rappelTheorique && (
                      <div className="rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-success)] mb-1">📚 La notion à retenir</p>
                        <p className="text-sm text-[var(--color-ink)] font-medium leading-relaxed">{etape.rappelTheorique}</p>
                      </div>
                    )}

                    {etape.solution && (
                      <div className="rounded-xl bg-white border border-[var(--color-rule)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">✍️ Solution complète</p>
                        <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">{etape.solution}</p>
                      </div>
                    )}

                    {etape.erreurEleve && (
                      <div className="rounded-xl bg-[rgba(217,79,43,0.04)] border border-[rgba(217,79,43,0.2)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-accent)] mb-1">🔍 Où ton raisonnement a dévié</p>
                        <p className="text-sm text-[var(--color-ink)]">{etape.erreurEleve}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rétrocompatibilité — ancienne correction simple */}
      {etapes.length === 0 && feedback.explication && (
        <Card className="mb-4 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{score >= 80 ? "✅" : "🔍"}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                {score >= 80 ? "Excellent travail !" : "Ce qu'il faut retenir"}
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.explication}</p>
            </div>
          </div>
        </Card>
      )}
      {etapes.length === 0 && score < 80 && feedback.bonneReponse && (
        <Card className="mb-4 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)] p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-1">La bonne réponse</p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.bonneReponse}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── STRATÉGIE ANTI-RÉPÉTITION ── */}
      {feedback.strategieAntiRepetition && (
        <Card className="mb-5 p-5 border-[rgba(217,79,43,0.2)] bg-[rgba(217,79,43,0.03)]">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl flex-shrink-0">🚫</span>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Pour ne plus répéter cette erreur
            </p>
          </div>
          <div className="space-y-3 pl-9">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)] mb-0.5">Le réflexe à construire</p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed bg-white rounded-xl border border-[var(--color-rule)] px-3 py-2">
                {feedback.strategieAntiRepetition.reflexeAConstruire}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)] mb-0.5">Le piège à éviter</p>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                {feedback.strategieAntiRepetition.piegeAEviter}
              </p>
            </div>
            {feedback.strategieAntiRepetition.exerciceDeRenforcement && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)] mb-0.5">Pour ancrer la compréhension</p>
                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  {feedback.strategieAntiRepetition.exerciceDeRenforcement}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── MÉTHODE OFFICIELLE ── */}
      {feedback.methodeOfficielle && (
        <Card className="mb-4 p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)]">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🏫</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">
                Méthode officielle — Écoles québécoises
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.methodeOfficielle}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── LIEN PFEQ ── */}
      {feedback.lienPFEQ && (
        <Card className="mb-4 p-5 border-[rgba(42,124,111,0.2)] bg-[rgba(42,124,111,0.04)]">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🎯</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-1">
                Compétence PFEQ développée
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.lienPFEQ}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── ASTUCE MÉMOIRE ── */}
      {feedback.astuceMemoire && (
        <Card className="mb-4 p-5 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🧠</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-1">
                Astuce pour retenir (personnalisée pour toi)
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.astuceMemoire}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── EXEMPLE SIMILAIRE ── */}
      {feedback.exempleSimilaire?.enonce && (
        <Card className="mb-4 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            📝 Pratique avec un exemple similaire
          </p>
          <div className="rounded-xl bg-[var(--color-paper-warm)] p-4 mb-3">
            <p className="text-sm font-medium text-[var(--color-ink)]">{feedback.exempleSimilaire.enonce}</p>
          </div>
          {feedback.exempleSimilaire.solution && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--color-accent)] hover:underline list-none">
                Voir la solution →
              </summary>
              <div className="mt-2 rounded-xl bg-white border border-[var(--color-rule)] p-3">
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-line">{feedback.exempleSimilaire.solution}</p>
              </div>
            </details>
          )}
          {feedback.exempleSimilaire.pourquoi && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-2 italic">{feedback.exempleSimilaire.pourquoi}</p>
          )}
        </Card>
      )}

      {/* ── QUESTIONS DE RÉFLEXION ── */}
      {feedback.questionsReflexion && feedback.questionsReflexion.length > 0 && (
        <Card className="mb-4 p-5 border-[rgba(91,79,207,0.15)] bg-[rgba(91,79,207,0.03)]">
          <button
            onClick={() => setReflexionOuverte(!reflexionOuverte)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🤔</span>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)]">
                Questions pour réfléchir à ton apprentissage
              </p>
            </div>
            <span className="text-xs text-[var(--color-ink-soft)]">{reflexionOuverte ? "▲" : "▼"}</span>
          </button>

          {reflexionOuverte && (
            <div className="mt-3 space-y-2 pl-7">
              {feedback.questionsReflexion.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-black text-[var(--color-purple)] flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed italic">{q}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── PROCHAINE PISTE ── */}
      {feedback.prochainePiste && (
        <Card className="mb-4 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🗺️</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                Pour progresser
              </p>
              <p className="text-sm text-[var(--color-ink)]">{feedback.prochainePiste}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── ENCOURAGEMENT ── */}
      {feedback.encouragement && (
        <div className="rounded-2xl bg-[var(--color-ink)] p-5 mb-6 text-center">
          <p className="text-base font-semibold text-white leading-relaxed">{feedback.encouragement}</p>
        </div>
      )}

      {/* ── PLAN NAVIGATION ── */}
      {planNotionActive && (
        <div className="mb-4 rounded-2xl border border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.04)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-3">
            🗺️ Plan de réussite — {planNotionActive.notion.replace(/_/g, " ")}
          </p>
          <div className="flex flex-col gap-2">
            {(objectifAtteint?.atteint || score >= 80) && (
              <button
                onClick={() => markMaitrisee.mutate({ notionId: planNotionActive.id })}
                disabled={markMaitrisee.isPending || markMaitrisee.isSuccess}
                className="w-full rounded-xl bg-[var(--color-success)] py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {markMaitrisee.isSuccess
                  ? "✅ Notion avancée !"
                  : markMaitrisee.isPending
                  ? "En cours…"
                  : "✅ Notion maîtrisée → Passer à la suivante"}
              </button>
            )}
            <Link href={`/eleve/exercices/nouveau?plan=1&matiere=${planNotionActive.matiere}`}>
              <button className="w-full rounded-xl border border-[rgba(91,79,207,0.3)] bg-white py-2.5 text-sm font-semibold text-[var(--color-purple)] hover:bg-[rgba(91,79,207,0.04)] transition-colors">
                ↩ Continuer à pratiquer cette notion
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="flex gap-3">
        <Link href="/eleve" className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">
            Tableau de bord
          </Button>
        </Link>
        {!planNotionActive && (
          <Link href="/eleve/exercices/nouveau" className="flex-[2]">
            <Button size="lg" className="w-full">
              Prochain exercice →
            </Button>
          </Link>
        )}
        {planNotionActive && (
          <Link href="/eleve/plan" className="flex-[2]">
            <Button size="lg" className="w-full">
              Voir mon plan →
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function getScoreCelebration(score: number) {
  if (score < 80) return null;
  const xp = Math.round(score * (score === 100 ? 2 : score >= 90 ? 1.5 : 1));
  if (score === 100) return {
    type: "levelup" as const,
    titre: "Score parfait ! 🏆",
    soustitre: "100/100 — Tu es au sommet !",
    detail: `+${xp} XP gagnés (×2 pour la perfection !)`,
    emoji: "🏆",
    autoCloseMs: 5000,
  };
  if (score >= 90) return {
    type: "milestone" as const,
    titre: "Excellent ! 🌟",
    soustitre: `${Math.round(score)}/100 — Tu maîtrises ce sujet !`,
    detail: `+${xp} XP gagnés (×1.5 pour le super score !)`,
    emoji: "🌟",
    autoCloseMs: 4000,
  };
  return {
    type: "badge" as const,
    titre: "Très bien ! 🎉",
    soustitre: `${Math.round(score)}/100 — Continue comme ça !`,
    detail: `+${xp} XP gagnés`,
    emoji: "🎊",
    autoCloseMs: 3500,
  };
}

function parseFeedback(feedbackIA: string | null): FeedbackStructure {
  if (!feedbackIA) return { score: 0, correct: false, mention: "", ceQueJaiReussi: "" };
  try {
    return JSON.parse(feedbackIA) as FeedbackStructure;
  } catch {
    return { score: 0, correct: false, mention: "", ceQueJaiReussi: "", explication: feedbackIA };
  }
}

function getScoreEmoji(score: number) {
  if (score >= 90) return "🌟";
  if (score >= 75) return "🎉";
  if (score >= 60) return "👍";
  if (score >= 40) return "💪";
  return "🔍";
}

function getScoreMessage(score: number) {
  if (score >= 90) return "Excellent !";
  if (score >= 75) return "Très bien !";
  if (score >= 60) return "Bien !";
  if (score >= 40) return "En progression";
  return "À retravailler";
}

function formatTemps(secondes: number) {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  if (m === 0) return `${s} secondes`;
  return `${m} min ${s} s`;
}
