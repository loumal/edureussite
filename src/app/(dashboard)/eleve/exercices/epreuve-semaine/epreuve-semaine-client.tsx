"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { EpreuveSemaineInteractive } from "@/components/exercises/epreuve-semaine-interactive";
import type { EpreuveGeneree } from "@/lib/ai/exercice";

// ── Mode "generer" : bouton pour lancer la génération ────────────────────────

interface PropsGenerer {
  semaineISO: string;
  mode: "generer";
  prenom: string;
}

// ── Mode "reprendre" : affiche l'épreuve existante ───────────────────────────

interface PropsReprendre {
  semaineISO: string;
  mode: "reprendre";
  epreuveId: string;
  epreuve: EpreuveGeneree;
  statut: string;
  feedbackExistant?: Record<string, unknown> | null;
  progressionSauvegardee?: { partieActive?: number; reponses?: Record<string, string> } | null;
  tempsSauvegardeSecondes?: number;
  prenom: string;
}

type Props = PropsGenerer | PropsReprendre;

export function EpreuveSemaineClient(props: Props) {
  if (props.mode === "generer") {
    return <LanceurEpreuve semaineISO={props.semaineISO} prenom={props.prenom} />;
  }

  return (
    <EpreuveSemaineInteractive
      epreuveId={props.epreuveId}
      epreuve={props.epreuve}
      statut={props.statut}
      feedbackExistant={props.feedbackExistant as import("@/components/exercises/epreuve-semaine-interactive").FeedbackSemaine | null}
      progressionSauvegardee={props.progressionSauvegardee}
      tempsSauvegardeSecondes={props.tempsSauvegardeSecondes ?? 0}
      prenom={props.prenom}
      semaineISO={props.semaineISO}
    />
  );
}

// ── Lanceur : génère l'épreuve au clic ───────────────────────────────────────

function LanceurEpreuve({ semaineISO, prenom }: { semaineISO: string; prenom: string }) {
  const [epreuveGeneree, setEpreuveGeneree] = useState<{
    id: string;
    contenu: EpreuveGeneree;
  } | null>(null);

  const generer = trpc.plan.genererEpreuveSemaine.useMutation({
    onSuccess: (data) => {
      setEpreuveGeneree({
        id: data.id,
        contenu: data.contenu as unknown as EpreuveGeneree,
      });
    },
  });

  if (epreuveGeneree) {
    return (
      <EpreuveSemaineInteractive
        epreuveId={epreuveGeneree.id}
        epreuve={epreuveGeneree.contenu}
        statut="EN_COURS"
        feedbackExistant={null}
        progressionSauvegardee={null}
        tempsSauvegardeSecondes={0}
        prenom={prenom}
        semaineISO={semaineISO}
      />
    );
  }

  if (generer.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-purple)] border-t-transparent animate-spin" />
          <div className="absolute inset-2 flex items-center justify-center text-2xl">🏆</div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-[var(--color-ink)]">
            Génération de ton épreuve…
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Je prépare une épreuve sur mesure pour la semaine {semaineISO.split("-W")[1]}.
            Ça prend environ 20 secondes.
          </p>
        </div>
      </div>
    );
  }

  if (generer.isError) {
    return (
      <div className="py-4 text-center space-y-3">
        <p className="text-sm text-[var(--color-accent)]">
          Une erreur s&apos;est produite lors de la génération. Réessaie.
        </p>
        <button
          onClick={() => generer.mutate({ semaineISO })}
          className="rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => generer.mutate({ semaineISO })}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple)] py-4 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
      >
        🏆 Commencer l&apos;épreuve de la semaine {semaineISO.split("-W")[1]}
      </button>
      <p className="text-xs text-center text-[var(--color-ink-soft)] mt-2">
        Tu peux faire une pause à tout moment — ta progression sera sauvegardée.
      </p>
    </div>
  );
}
