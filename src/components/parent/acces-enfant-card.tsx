"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardLabel } from "@/components/ui/card";

interface Props {
  eleveId: string;
  prenomEnfant: string;
  codeAcces: string | null;
}

export function AccesEnfantCard({ eleveId, prenomEnfant, codeAcces }: Props) {
  const [codeVisible, setCodeVisible] = useState(false);
  const [mdpGenere, setMdpGenere] = useState<string | null>(null);
  const [mdpVisible, setMdpVisible] = useState(false);
  const [copie, setCopie] = useState<"code" | "mdp" | null>(null);
  const [confirmer, setConfirmer] = useState(false);

  const generer = trpc.parent.genererMdpTemporaire.useMutation({
    onSuccess: (data) => {
      setMdpGenere(data.motDePasse);
      setMdpVisible(true);
      setConfirmer(false);
    },
  });

  const copier = (texte: string, type: "code" | "mdp") => {
    navigator.clipboard.writeText(texte).then(() => {
      setCopie(type);
      setTimeout(() => setCopie(null), 2000);
    });
  };

  return (
    <Card className="p-5">
      <CardLabel className="mb-4">🔐 Accès de {prenomEnfant}</CardLabel>

      {/* Code d'accès */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">
          Code d'accès (identifiant de connexion)
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-2.5 font-mono text-sm font-bold text-[var(--color-ink)] tracking-wider">
            {codeVisible
              ? (codeAcces ?? "—")
              : "••••••••••"}
          </div>
          <button
            onClick={() => setCodeVisible((v) => !v)}
            className="rounded-xl border border-[var(--color-rule)] px-3 py-2.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors whitespace-nowrap"
            title={codeVisible ? "Masquer" : "Afficher"}
          >
            {codeVisible ? "🙈 Masquer" : "👁 Afficher"}
          </button>
          {codeVisible && codeAcces && (
            <button
              onClick={() => copier(codeAcces, "code")}
              className="rounded-xl border border-[var(--color-rule)] px-3 py-2.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              title="Copier"
            >
              {copie === "code" ? "✓ Copié" : "📋"}
            </button>
          )}
        </div>
      </div>

      {/* Mot de passe */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">
          Mot de passe
        </p>

        {mdpGenere && mdpVisible ? (
          /* MDP généré — afficher une seule fois */
          <div className="rounded-xl border-2 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.05)] p-4 animate-fade-in">
            <p className="text-xs font-bold text-[var(--color-success)] mb-2 uppercase tracking-wide">
              ✅ Nouveau mot de passe généré
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 rounded-xl bg-white border border-[rgba(42,124,111,0.3)] px-4 py-2.5 font-mono text-base font-black text-[var(--color-ink)] tracking-widest">
                {mdpVisible ? mdpGenere : "••••••••••"}
              </div>
              <button
                onClick={() => setMdpVisible((v) => !v)}
                className="rounded-xl border border-[var(--color-rule)] px-3 py-2.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              >
                {mdpVisible ? "🙈" : "👁"}
              </button>
              <button
                onClick={() => copier(mdpGenere, "mdp")}
                className="rounded-xl border border-[var(--color-rule)] px-3 py-2.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              >
                {copie === "mdp" ? "✓" : "📋"}
              </button>
            </div>
            <div className="rounded-lg bg-[rgba(201,149,42,0.1)] border border-[rgba(201,149,42,0.25)] px-3 py-2 mb-3">
              <p className="text-xs text-[var(--color-gold)] font-semibold">
                ⚠️ Notez ce mot de passe maintenant — il ne sera plus affiché après fermeture.
              </p>
            </div>
            <button
              onClick={() => { setMdpGenere(null); setMdpVisible(false); }}
              className="w-full rounded-xl border border-[var(--color-rule)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
            >
              J'ai noté le mot de passe ✓
            </button>
          </div>
        ) : confirmer ? (
          /* Confirmation avant génération */
          <div className="rounded-xl border border-[rgba(217,79,43,0.2)] bg-[rgba(217,79,43,0.04)] p-4 animate-fade-in">
            <p className="text-xs text-[var(--color-ink)] mb-3">
              Cela va <strong>remplacer</strong> le mot de passe actuel de {prenomEnfant}. Il devra utiliser le nouveau mot de passe pour se connecter.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => generer.mutate({ eleveId })}
                disabled={generer.isPending}
                className="flex-1 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {generer.isPending ? "Génération…" : "Confirmer"}
              </button>
              <button
                onClick={() => setConfirmer(false)}
                className="rounded-xl border border-[var(--color-rule)] px-4 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              >
                Annuler
              </button>
            </div>
            {generer.isError && (
              <p className="text-xs text-[var(--color-accent)] mt-2">{generer.error.message}</p>
            )}
          </div>
        ) : (
          /* État par défaut */
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-2.5 text-sm text-[var(--color-ink-soft)]">
              ••••••••••
            </div>
            <button
              onClick={() => setConfirmer(true)}
              className="rounded-xl bg-[var(--color-ink)] px-3 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              🔄 Générer
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--color-ink-soft)] leading-relaxed">
        L'élève se connecte avec son <strong>code d'accès</strong> et son <strong>mot de passe</strong> sur la page de connexion.
      </p>
    </Card>
  );
}
