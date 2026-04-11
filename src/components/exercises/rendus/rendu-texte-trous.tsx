"use client";

import { useState, useCallback } from "react";

interface SegmentNouveauFormat {
  type: "texte" | "trou";
  valeur?: string;     // pour type "texte"
  id?: string;         // pour type "trou"
  indice?: string;     // hint optionnel
  reponse?: string;    // réponse attendue (non affichée à l'élève)
}

interface ContenuTexteTrous {
  miseEnSituation?: string;
  segments?: SegmentNouveauFormat[];
  // Anciens formats (compatibilité)
  enonce?: string;
  texte?: string;
  texteAvecTrous?: string;
}

interface Props {
  contenu: Record<string, unknown>;
  onReponse: (r: unknown) => void;
}

export function RenduTexteTrous({ contenu, onReponse }: Props) {
  const c = contenu as ContenuTexteTrous;

  // Choisir le mode de rendu
  const useNouveauFormat = Array.isArray(c.segments) && c.segments.length > 0;

  // Segments normalisés (type uniforme pour le rendu)
  const segments: Array<{ type: "texte" | "trou"; texte?: string; id?: string; indice?: string }> =
    useNouveauFormat
      ? (c.segments ?? []).map((s) => ({
          type: s.type,
          texte: s.valeur,
          id: s.id,
          indice: s.indice,
        }))
      : parseTexteTrous(c.texteAvecTrous ?? c.texte ?? c.enonce ?? "");

  const trous = segments.filter((s) => s.type === "trou");
  const nbTrous = trous.length;
  const [reponses, setReponses] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (key: string, valeur: string) => {
      const newReponses = { ...reponses, [key]: valeur };
      setReponses(newReponses);

      const tousRemplis = trous.every(
        (t) => (newReponses[t.id ?? ""] ?? "").trim().length > 0
      );
      if (tousRemplis) {
        onReponse(newReponses);
      }
    },
    [reponses, trous, onReponse]
  );

  let trouIdx = 0;

  return (
    <div>
      {/* Mise en situation */}
      {c.miseEnSituation && (
        <div className="mb-5 rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.15)] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-purple)]">
            📖 Mise en situation
          </p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed">
            {c.miseEnSituation}
          </p>
        </div>
      )}

      <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
        Complète les espaces vides :
      </p>

      <div className="text-base leading-loose text-[var(--color-ink)]">
        {segments.map((seg, i) => {
          if (seg.type === "texte") {
            return <span key={i}>{seg.texte}</span>;
          }
          const key = seg.id ?? String(trouIdx);
          trouIdx++;
          return (
            <span key={i} className="inline-flex flex-col items-center mx-1 align-bottom">
              <input
                type="text"
                value={reponses[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="inline-block w-28 rounded-lg border-b-2 border-[var(--color-ink)] bg-[var(--color-paper-warm)] px-2 py-0.5 text-center text-sm font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:bg-white transition-colors"
                placeholder="_ _ _"
                aria-label={seg.indice ? `Indice : ${seg.indice}` : `Réponse ${trouIdx}`}
              />
              {seg.indice && (
                <span className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                  ({seg.indice})
                </span>
              )}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
        {Object.values(reponses).filter(Boolean).length} / {nbTrous} trou{nbTrous > 1 ? "s" : ""} rempli{nbTrous > 1 ? "s" : ""}
      </p>
    </div>
  );
}

function parseTexteTrous(
  texte: string
): Array<{ type: "texte" | "trou"; texte?: string; id?: string }> {
  if (!texte) return [{ type: "texte", texte: "Aucun contenu disponible." }];

  const regex = /\[([^\]]*)\]/g;
  const segments: Array<{ type: "texte" | "trou"; texte?: string; id?: string }> = [];
  let dernierIndex = 0;
  let match;
  let trouCount = 0;

  while ((match = regex.exec(texte)) !== null) {
    if (match.index > dernierIndex) {
      segments.push({ type: "texte", texte: texte.slice(dernierIndex, match.index) });
    }
    segments.push({ type: "trou", id: `t${trouCount++}` });
    dernierIndex = match.index + match[0].length;
  }

  if (dernierIndex < texte.length) {
    segments.push({ type: "texte", texte: texte.slice(dernierIndex) });
  }

  if (segments.every((s) => s.type === "texte")) {
    return [{ type: "texte", texte }, { type: "trou", id: "t0" }];
  }

  return segments;
}
