"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SurprisesParentSection() {
  const { data: surprises, isLoading, refetch } = trpc.surprise.listerParent.useQuery();

  if (isLoading) return null;
  if (!surprises || surprises.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {surprises.map((s) => (
        <SurpriseCard key={s.id} surprise={s} onDone={() => refetch()} />
      ))}
    </div>
  );
}

type Surprise = {
  id: string;
  statut: string;
  declencheur: string;
  explication: string;
  options: string[];
  privilegeChoisi: string | null;
  accordeAt: Date | null;
  eleve: { prenom: string };
};

function SurpriseCard({ surprise, onDone }: { surprise: Surprise; onDone: () => void }) {
  const [choix, setChoix] = useState(surprise.options[0] ?? "");
  const [choixPersonnalise, setChoixPersonnalise] = useState(false);
  const [textePersonnalise, setTextePersonnalise] = useState("");

  const accorder = trpc.surprise.accorder.useMutation({ onSuccess: onDone });

  const privilegeFinal = choixPersonnalise ? textePersonnalise : choix;

  if (surprise.statut === "ACCORDE") {
    return (
      <Card className="p-5 border-l-4 border-[var(--color-gold)] bg-[rgba(201,149,42,0.04)]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-bold text-[var(--color-ink)] text-sm">
              Surprise accordée à {surprise.eleve.prenom} — en attente de confirmation
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {surprise.privilegeChoisi}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {surprise.eleve.prenom} recevra une notification pour confirmer la réception.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-[var(--color-gold)]">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-[rgba(201,149,42,0.1)] to-[rgba(201,149,42,0.03)] px-5 py-4 border-b border-[var(--color-rule)]">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🌟</span>
          <div>
            <p className="font-black text-[var(--color-ink)] text-base">
              {surprise.eleve.prenom} mérite une surprise !
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{surprise.declencheur}</p>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-[var(--color-ink)] leading-relaxed">{surprise.explication}</p>

        {/* Options */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
            Choisissez une surprise
          </p>
          <div className="space-y-2">
            {surprise.options.map((opt) => (
              <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name={`surprise-${surprise.id}`}
                  value={opt}
                  checked={!choixPersonnalise && choix === opt}
                  onChange={() => { setChoix(opt); setChoixPersonnalise(false); }}
                  className="mt-0.5 accent-[var(--color-purple)]"
                />
                <span className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-purple)] transition-colors">
                  {opt}
                </span>
              </label>
            ))}

            {/* Option personnalisée */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={`surprise-${surprise.id}`}
                checked={choixPersonnalise}
                onChange={() => setChoixPersonnalise(true)}
                className="mt-0.5 accent-[var(--color-purple)]"
              />
              <span className="text-sm text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] transition-colors">
                Autre (définir la mienne…)
              </span>
            </label>
            {choixPersonnalise && (
              <input
                type="text"
                placeholder="Décrivez la surprise…"
                value={textePersonnalise}
                onChange={(e) => setTextePersonnalise(e.target.value)}
                maxLength={200}
                className="w-full mt-1 rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-purple)]"
              />
            )}
          </div>
        </div>

        {accorder.isError && (
          <p className="text-xs text-[var(--color-accent)]">Une erreur s'est produite. Réessaie.</p>
        )}

        <Button
          onClick={() => accorder.mutate({ surpriseId: surprise.id, privilegeChoisi: privilegeFinal })}
          disabled={accorder.isPending || !privilegeFinal.trim()}
          className="w-full"
        >
          {accorder.isPending ? "En cours…" : `🎁 Accorder cette surprise à ${surprise.eleve.prenom}`}
        </Button>

        <p className="text-xs text-center text-[var(--color-ink-soft)]">
          {surprise.eleve.prenom} sera notifié·e et devra confirmer la réception.
        </p>
      </div>
    </Card>
  );
}
