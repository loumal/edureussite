"use client";

import { useState } from "react";
import type { HistoireInspirante } from "@/lib/stories/histoires-inspirantes";

interface Props {
  histoires: HistoireInspirante[];
  messageIntro: string;
  prenom: string;
  allHistoiresCount: number;
}

export function InspirationsWidget({ histoires, messageIntro, prenom, allHistoiresCount }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <section className="mt-8">
      {/* En-tête section */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-accent)] flex-shrink-0">
            <span className="text-lg">🌟</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--color-ink)]">
              Des gens comme toi qui ont réussi
            </h2>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {allHistoiresCount} histoires vraies · choisies pour toi
            </p>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] flex-shrink-0 mt-1"
          title="Masquer"
        >
          ✕
        </button>
      </div>

      {/* Message personnalisé */}
      <div className="rounded-2xl bg-gradient-to-br from-[rgba(201,149,42,0.1)] to-[rgba(217,79,43,0.06)] border border-[rgba(201,149,42,0.25)] px-5 py-4 mb-6">
        <p className="text-sm text-[var(--color-ink)] leading-relaxed font-medium">
          {messageIntro}
        </p>
      </div>

      {/* Cartes histoires */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {histoires.map((h) => (
          <HistoireCard
            key={h.id}
            histoire={h}
            expanded={expanded === h.id}
            onToggle={() => setExpanded(expanded === h.id ? null : h.id)}
          />
        ))}
      </div>

      {/* Petite note de bas */}
      <p className="text-xs text-center text-[var(--color-ink-soft)] mt-5">
        Ces histoires sont vraies et vérifiables. Clique sur « Lire l'article » pour en savoir plus.
      </p>
    </section>
  );
}

function HistoireCard({
  histoire: h,
  expanded,
  onToggle,
}: {
  histoire: HistoireInspirante;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden transition-all hover:shadow-md hover:border-[var(--color-ink-soft)]">
      {/* En-tête coloré */}
      <div className="bg-gradient-to-br from-[var(--color-paper-warm)] to-white px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-4xl flex-shrink-0">{h.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[var(--color-ink)] leading-tight">{h.nom}</p>
            <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5 leading-tight">{h.domaine}</p>
            {h.pays && (
              <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">{h.pays}{h.neLe ? ` · ${h.neLe}` : ""}</p>
            )}
          </div>
        </div>

        {/* Badge difficulté */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-3 py-1">
          <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wide">Difficulté</span>
          <span className="text-[11px] text-[var(--color-ink)] leading-tight">{h.difficulteLabel}</span>
        </div>
      </div>

      {/* Corps */}
      <div className="px-5 pb-5">
        {/* Histoire — tronquée ou complète */}
        <p className={`text-sm text-[var(--color-ink)] leading-relaxed mb-3 ${!expanded ? "line-clamp-3" : ""}`}>
          {h.histoire}
        </p>

        {/* Citation */}
        {h.citation && expanded && (
          <blockquote className="border-l-4 border-[var(--color-gold)] bg-[rgba(201,149,42,0.06)] rounded-r-xl pl-4 pr-3 py-3 mb-4">
            <p className="text-sm italic text-[var(--color-ink)] leading-relaxed">« {h.citation} »</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1 font-medium">— {h.nom}</p>
          </blockquote>
        )}

        {/* Boutons */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onToggle}
            className="text-xs font-semibold text-[var(--color-purple)] hover:text-[var(--color-ink)] transition-colors"
          >
            {expanded ? "Réduire ↑" : "Lire plus ↓"}
          </button>

          {expanded && (
            <a
              href={h.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Lire l'article →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
