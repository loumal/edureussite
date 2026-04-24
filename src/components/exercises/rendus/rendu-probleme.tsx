"use client";

import { useState } from "react";
import { RenduVisuels, type Visuel } from "./rendu-visuel";

interface Props {
  contenu: Record<string, unknown>;
  onReponse: (r: unknown) => void;
}

export function RenduProbleme({ contenu, onReponse }: Props) {
  const [reponse, setReponse] = useState("");
  const [demarche, setDemarche] = useState("");
  const [etapesOuvertes, setEtapesOuvertes] = useState(false);

  // Nouveau schéma : miseEnSituation + question séparés
  const miseEnSituation = (contenu.miseEnSituation ?? "") as string;
  const question = (contenu.question ?? contenu.enonce ?? contenu.probleme ?? "") as string;
  const donnees = contenu.donnees as string[] | undefined;
  const unite = (contenu.unite ?? "") as string;
  const avecDemarche = contenu.avecDemarche !== false;
  const etapesGuidees = contenu.etapesGuidees as string[] | undefined;
  const visuels = contenu.visuels as Visuel[] | undefined;

  const handleChange = (rep: string, dem: string) => {
    if (rep.trim()) {
      onReponse({ reponse: rep, demarche: dem, unite });
    }
  };

  return (
    <div>
      {/* Mise en situation */}
      {miseEnSituation && (
        <div className="mb-5 rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.15)] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-purple)]">
            📖 Mise en situation
          </p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed">
            {miseEnSituation}
          </p>
        </div>
      )}

      {/* Visuels (plan cartésien, tableau, figure géométrique, graphique) */}
      <RenduVisuels visuels={visuels} />

      {/* Données */}
      {donnees && donnees.length > 0 && (
        <div className="mb-5 rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.15)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-success)]">
            📊 Données
          </p>
          <ul className="space-y-1.5">
            {donnees.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-[rgba(42,124,111,0.15)] flex items-center justify-center text-[10px] font-bold text-[var(--color-success)]">
                  {i + 1}
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question */}
      {question && (
        <p className="mb-5 text-base font-semibold text-[var(--color-ink)] leading-relaxed">
          {question}
        </p>
      )}

      {/* Étapes guidées (expandable) */}
      {etapesGuidees && etapesGuidees.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setEtapesOuvertes((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
          >
            <span className="text-base">{etapesOuvertes ? "▾" : "▸"}</span>
            💡 Voir les étapes guidées
          </button>
          {etapesOuvertes && (
            <ol className="mt-2 space-y-1.5 ml-6 list-decimal">
              {etapesGuidees.map((e, i) => (
                <li key={i} className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  {e}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Démarche */}
      {avecDemarche && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            Ma démarche
          </label>
          <textarea
            value={demarche}
            onChange={(e) => {
              setDemarche(e.target.value);
              handleChange(reponse, e.target.value);
            }}
            rows={4}
            placeholder="Montre comment tu arrives à ta réponse, étape par étape…"
            className="w-full rounded-xl border-2 border-[var(--color-rule)] bg-white p-3 text-sm outline-none resize-none placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-ink-soft)] transition-all"
          />
        </div>
      )}

      {/* Réponse finale */}
      <div className="rounded-xl border-2 border-[var(--color-rule)] bg-[rgba(91,79,207,0.03)] p-4">
        <label className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">
          Ma réponse finale *
        </label>
        {question && (
          <p className="mb-3 text-xs text-[var(--color-ink-soft)] leading-snug">
            → Réponds à : <span className="font-medium text-[var(--color-ink)]">{question}</span>
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={reponse}
            onChange={(e) => {
              setReponse(e.target.value);
              handleChange(e.target.value, demarche);
            }}
            placeholder="Ex : 42"
            className="h-12 w-40 rounded-xl border-2 border-[var(--color-rule)] bg-white px-4 text-center text-xl font-bold text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-all"
          />
          {unite && (
            <span className="text-base font-medium text-[var(--color-ink-soft)]">
              {unite}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
