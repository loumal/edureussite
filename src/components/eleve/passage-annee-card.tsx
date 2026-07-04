"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const NIVEAU_LABEL: Record<string, string> = {
  PRIMAIRE_1: "1re année du primaire",
  PRIMAIRE_2: "2e année du primaire",
  PRIMAIRE_3: "3e année du primaire",
  PRIMAIRE_4: "4e année du primaire",
  PRIMAIRE_5: "5e année du primaire",
  PRIMAIRE_6: "6e année du primaire",
  SECONDAIRE_1: "Secondaire 1",
  SECONDAIRE_2: "Secondaire 2",
  SECONDAIRE_3: "Secondaire 3",
  SECONDAIRE_4: "Secondaire 4",
  SECONDAIRE_5: "Secondaire 5",
  SECONDAIRE_6: "Secondaire 6",
  SECONDAIRE_7: "Secondaire 7",
};

const NIVEAU_SUIVANT: Record<string, string> = {
  PRIMAIRE_1: "PRIMAIRE_2",
  PRIMAIRE_2: "PRIMAIRE_3",
  PRIMAIRE_3: "PRIMAIRE_4",
  PRIMAIRE_4: "PRIMAIRE_5",
  PRIMAIRE_5: "PRIMAIRE_6",
  PRIMAIRE_6: "SECONDAIRE_1",
  SECONDAIRE_1: "SECONDAIRE_2",
  SECONDAIRE_2: "SECONDAIRE_3",
  SECONDAIRE_3: "SECONDAIRE_4",
  SECONDAIRE_4: "SECONDAIRE_5",
  SECONDAIRE_5: "SECONDAIRE_6",
  SECONDAIRE_6: "SECONDAIRE_7",
};

type HistoriqueEntry = {
  niveauScolaire: string;
  anneeScolaire: string;
  createdAt: Date;
};

type Props = {
  niveauScolaire: string;
  anneeScolaireActive: string;
  historiqueNiveaux: HistoriqueEntry[];
};

export function PassageAnneeCard({ niveauScolaire, anneeScolaireActive, historiqueNiveaux }: Props) {
  const router = useRouter();
  const [etape, setEtape] = useState<"idle" | "confirmer" | "succes">("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = trpc.eleve.passageAnnee.useMutation({
    onSuccess: () => {
      setEtape("succes");
      router.refresh();
    },
    onError: (e) => {
      setErreur(e.message);
      setEtape("idle");
    },
  });

  const prochainNiveau = NIVEAU_SUIVANT[niveauScolaire];
  const [anneeDebut] = anneeScolaireActive.split("-").map(Number);
  const prochaineAnnee = `${anneeDebut + 1}-${anneeDebut + 2}`;

  if (!prochainNiveau) {
    return null;
  }

  const labelActuel = NIVEAU_LABEL[niveauScolaire] ?? niveauScolaire;
  const labelSuivant = NIVEAU_LABEL[prochainNiveau] ?? prochainNiveau;

  return (
    <Card className="mb-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">📅</span>
        <div>
          <h2 className="text-base font-bold text-[var(--color-ink)]">Passage à l'année suivante</h2>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Année scolaire active : <strong>{anneeScolaireActive}</strong>
          </p>
        </div>
      </div>

      {etape === "idle" && (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-paper)] px-4 py-3">
            <div className="text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Niveau actuel</p>
              <p className="font-semibold text-[var(--color-ink)]">{labelActuel}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">{anneeScolaireActive}</p>
            </div>
            <div className="flex-1 text-center text-[var(--color-ink-soft)]">→</div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Prochain niveau</p>
              <p className="font-semibold text-[var(--color-accent)]">{labelSuivant}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">{prochaineAnnee}</p>
            </div>
          </div>

          {erreur && (
            <p className="mb-3 text-sm text-red-600">{erreur}</p>
          )}

          <button
            onClick={() => { setEtape("confirmer"); setErreur(null); }}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
          >
            Passer à {labelSuivant}
          </button>
        </>
      )}

      {etape === "confirmer" && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-paper)] p-4">
          <p className="mb-1 font-semibold text-[var(--color-ink)]">Confirmer le passage d'année ?</p>
          <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
            Ton historique de <strong>{anneeScolaireActive}</strong> sera conservé. Un nouveau départ sera créé pour l'année <strong>{prochaineAnnee}</strong> en <strong>{labelSuivant}</strong>.
          </p>
          <p className="mb-4 text-xs text-[var(--color-ink-soft)]">
            Les plans actifs seront archivés. Les objectifs et la planification de notions seront remis à zéro. Tes badges, points et historique d'exercices restent accessibles.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setEtape("idle")}
              disabled={mutation.isPending}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-paper)] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
            >
              {mutation.isPending ? "En cours…" : "Confirmer"}
            </button>
          </div>
        </div>
      )}

      {etape === "succes" && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-success)]/10 px-4 py-3 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold text-[var(--color-success)]">Passage d'année effectué !</p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Bienvenue en <strong>{labelSuivant}</strong> pour l'année <strong>{prochaineAnnee}</strong>.
          </p>
        </div>
      )}

      {historiqueNiveaux.length > 0 && (
        <div className="mt-4 border-t border-[var(--color-rule)] pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">
            Historique des années
          </p>
          <ul className="space-y-1.5">
            {historiqueNiveaux.map((h, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink)]">{NIVEAU_LABEL[h.niveauScolaire] ?? h.niveauScolaire}</span>
                <span className="rounded-full bg-[var(--color-paper)] px-2.5 py-0.5 text-xs text-[var(--color-ink-soft)]">
                  {h.anneeScolaire}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
