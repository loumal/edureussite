"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CelebrationOverlay } from "@/components/eleve/celebration-overlay";
import { RenduQCM } from "./rendus/rendu-qcm";
import { RenduTexteTrous } from "./rendus/rendu-texte-trous";
import { RenduQuestionOuverte } from "./rendus/rendu-question-ouverte";
import { RenduProbleme } from "./rendus/rendu-probleme";
import { RenduLectureComprehension } from "./rendus/rendu-lecture-comprehension";
import type { Exercice, ExerciceAssigne } from "@/generated/prisma";

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🇨🇦",
  EDUCATION_PHYSIQUE: "⚽", ETHIQUE: "💭",
};

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
};

interface Props {
  assignation: ExerciceAssigne;
  exercice: Exercice;
}

const MATIERE_LABEL_FR: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
};

export function ExerciceInteractif({ assignation, exercice }: Props) {
  const router = useRouter();
  const [reponse, setReponse] = useState<unknown>(null);
  const [soumis, setSoumis] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [objectifCelebration, setObjectifCelebration] = useState<{ matiere: string; scoreVise: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chronomètre
  useEffect(() => {
    intervalRef.current = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const soumettre = trpc.exercice.soumettre.useMutation({
    onSuccess: (data) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSoumis(true);

      if (data.objectifAtteint) {
        // Montrer la célébration "objectif atteint" — la redirection se fait dans onClose
        setObjectifCelebration(data.objectifAtteint);
      } else {
        const delai = (data.pointsGagnes ?? 0) >= 80 ? 600 : 0;
        setTimeout(() => router.refresh(), delai);
      }
    },
  });

  const handleSoumettre = () => {
    if (!reponse) return;
    soumettre.mutate({
      exerciceAssigneId: assignation.id,
      reponse,
      tempsSecondes: secondes,
    });
  };

  const contenu = exercice.contenu as Record<string, unknown>;
  const peutSoumettre = reponse !== null && !soumettre.isPending && !soumis;

  const formatTemps = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Overlay "Objectif atteint" */}
      {objectifCelebration && (
        <CelebrationOverlay
          type="milestone"
          titre="🎯 Objectif atteint !"
          soustitre={`Tu as atteint ${objectifCelebration.scoreVise} % en ${MATIERE_LABEL_FR[objectifCelebration.matiere] ?? objectifCelebration.matiere} !`}
          emoji="🏆"
          detail="+50 XP bonus pour avoir atteint ton objectif !"
          autoCloseMs={5000}
          onClose={() => {
            setObjectifCelebration(null);
            router.refresh();
          }}
        />
      )}

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{MATIERE_EMOJI[exercice.matiere]}</span>
            <Badge variant="default">{MATIERE_LABEL[exercice.matiere]}</Badge>
            <Badge variant="purple">{formatDifficulte(exercice.difficulte)}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-ink-soft)]">
            <span>⏱ {formatTemps(secondes)}</span>
            <span>~{exercice.dureeMinutes} min</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">
          {exercice.titre}
        </h1>
        {exercice.competencesPFEQ.length > 0 && (
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Compétence PFEQ : {exercice.competencesPFEQ.join(", ")}
          </p>
        )}
      </div>

      {/* Corps de l'exercice */}
      <Card className="mb-5 p-6">
        <div className="mb-5 rounded-xl bg-[var(--color-paper-warm)] p-4">
          <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">
            {exercice.consigne}
          </p>
        </div>

        {/* Rendu selon le type */}
        {exercice.type === "QCM" && (
          <RenduQCM contenu={contenu} onReponse={setReponse} reponse={reponse} />
        )}
        {exercice.type === "TEXTE_TROUS" && (
          <RenduTexteTrous contenu={contenu} onReponse={setReponse} />
        )}
        {(exercice.type === "QUESTION_OUVERTE" || exercice.type === "MISE_EN_SITUATION" || exercice.type === "MINI_DEFI") && (
          <RenduQuestionOuverte contenu={contenu} onReponse={setReponse} />
        )}
        {exercice.type === "PROBLEME_MATHEMATIQUE" && (
          <RenduProbleme contenu={contenu} onReponse={setReponse} />
        )}
        {exercice.type === "LECTURE_COMPREHENSION" && (
          <RenduLectureComprehension contenu={contenu} onReponse={setReponse} />
        )}
        {!["QCM","TEXTE_TROUS","QUESTION_OUVERTE","MISE_EN_SITUATION","PROBLEME_MATHEMATIQUE","MINI_DEFI","LECTURE_COMPREHENSION","SCHEMA_COMPLETER","CHRONOLOGIE"].includes(exercice.type) && (
          <RenduQuestionOuverte contenu={contenu} onReponse={setReponse} />
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push("/eleve")}
          className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          Remettre à plus tard
        </button>

        <Button
          onClick={handleSoumettre}
          disabled={!peutSoumettre}
          loading={soumettre.isPending}
          size="lg"
        >
          {soumettre.isPending ? "Correction en cours…" : "Soumettre ma réponse ✓"}
        </Button>
      </div>

      {soumettre.isError && (
        <p className="mt-3 text-center text-sm text-[var(--color-accent)]">
          Une erreur s'est produite. Réessaie.
        </p>
      )}

      {soumettre.isSuccess && (
        <div className="mt-4 rounded-2xl bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] p-4 text-center animate-fade-in">
          <p className="text-sm font-semibold text-[var(--color-success)]">
            ✅ Réponse enregistrée ! Correction IA en cours…
          </p>
          {(soumettre.data?.pointsGagnes ?? 0) >= 80 && (
            <p className="text-xs text-[var(--color-gold)] font-bold mt-1">
              ⭐ +{soumettre.data?.pointsGagnes} XP gagné !
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatDifficulte(d: string) {
  const map: Record<string, string> = {
    REMEDIATION: "Révision", BASE: "Facile",
    ATTENDU: "Niveau attendu", AVANCE: "Avancé", EXCELLENCE: "Excellence",
  };
  return map[d] ?? d;
}
