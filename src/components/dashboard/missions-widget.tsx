"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardLabel } from "@/components/ui/card";

const TYPE_EMOJI: Record<string, string> = {
  EXERCICES_COUNT: "📚",
  SCORE_MINIMUM: "🎯",
  MATIERE_EXERCICES: "⚡",
  PERFECT_SCORE: "💎",
  STREAK_MAINTENU: "🔥",
};

export function MissionsWidget() {
  const { data: missions, isLoading } = trpc.gamification.getMissions.useQuery();

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-36 rounded bg-[var(--color-paper-warm)] animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--color-paper-warm)] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!missions || missions.length === 0) return null;

  const completees = missions.filter((m) => m.completee).length;
  const total = missions.length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <CardLabel>Missions de la semaine</CardLabel>
        <span className="text-xs font-bold text-[var(--color-ink-soft)]">
          {completees}/{total}
        </span>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-4 h-1.5 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700"
          style={{ width: `${(completees / total) * 100}%` }}
        />
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
        {missions.map((mission) => {
          const pct = Math.min(100, Math.round((mission.progres / mission.cible) * 100));
          return (
            <div
              key={mission.id}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                mission.completee
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-[var(--color-paper)] border-[var(--color-rule)]"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5 flex-shrink-0">
                  {mission.completee ? "✅" : TYPE_EMOJI[mission.type] ?? "📋"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold leading-snug ${mission.completee ? "text-emerald-700" : "text-[var(--color-ink)]"}`}>
                      {mission.titre}
                    </p>
                    <span className={`flex-shrink-0 text-[11px] font-bold ${mission.completee ? "text-emerald-600" : "text-amber-600"}`}>
                      +{mission.xpBonus} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">{mission.description}</p>
                  {!mission.completee && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-[10px] text-[var(--color-ink-soft)] mb-0.5">
                        <span>{mission.progres}/{mission.cible}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completees === total && (
        <div className="mt-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl py-2">
          🏆 Toutes les missions complétées cette semaine !
        </div>
      )}
    </Card>
  );
}
