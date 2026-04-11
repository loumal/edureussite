"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardLabel } from "@/components/ui/card";

const NIVEAU_LABEL: Record<string, string> = {
  PRIMAIRE_1: "1re année", PRIMAIRE_2: "2e année", PRIMAIRE_3: "3e année",
  PRIMAIRE_4: "4e année", PRIMAIRE_5: "5e année", PRIMAIRE_6: "6e année",
  SECONDAIRE_1: "Sec. 1", SECONDAIRE_2: "Sec. 2", SECONDAIRE_3: "Sec. 3",
  SECONDAIRE_4: "Sec. 4", SECONDAIRE_5: "Sec. 5",
};

const RANG_EMOJI = ["🥇", "🥈", "🥉"];

export function ClassementWidget() {
  const { data, isLoading } = trpc.gamification.getClassement.useQuery();

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-40 rounded bg-[var(--color-paper-warm)] animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 rounded-xl bg-[var(--color-paper-warm)] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data || data.classement.length === 0) return null;

  const { classement, monRang } = data;
  // Afficher top 5 + moi si je ne suis pas dans le top 5
  const top5 = classement.slice(0, 5);
  const moiHorsTop = monRang && monRang > 5 ? classement.find((c) => c.estMoi) : null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <CardLabel>Classement de la semaine</CardLabel>
        {monRang && (
          <span className="text-xs font-bold text-[var(--color-ink-soft)]">
            Tu es #{monRang}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {top5.map((entree, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
              entree.estMoi
                ? "bg-[rgba(42,124,111,0.1)] border border-[rgba(42,124,111,0.25)]"
                : "bg-[var(--color-paper-warm)]"
            }`}
          >
            {/* Rang */}
            <div className="w-6 text-center flex-shrink-0">
              {entree.rang <= 3 ? (
                <span className="text-base">{RANG_EMOJI[entree.rang - 1]}</span>
              ) : (
                <span className="text-xs font-bold text-[var(--color-ink-soft)]">#{entree.rang}</span>
              )}
            </div>

            {/* Avatar anonyme */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-paper)] border border-[var(--color-rule)] flex-shrink-0 text-sm">
              {entree.estMoi ? "😊" : ["🐢", "🦊", "🐻", "🦁", "🐧", "🦋", "🐸", "🦉"][i % 8]}
            </div>

            {/* Nom */}
            <span className={`flex-1 text-xs font-semibold ${entree.estMoi ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"}`}>
              {entree.estMoi ? "Toi 👈" : `Joueur ${String.fromCharCode(65 + i)}`}
            </span>

            {/* XP */}
            <span className="text-xs font-bold text-[var(--color-ink-soft)]">
              {entree.xp} XP
            </span>
          </div>
        ))}

        {/* Moi si hors top 5 */}
        {moiHorsTop && (
          <>
            <div className="text-center text-[var(--color-ink-soft)] text-xs py-0.5">···</div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-[rgba(42,124,111,0.1)] border border-[rgba(42,124,111,0.25)]">
              <div className="w-6 text-center flex-shrink-0">
                <span className="text-xs font-bold text-[var(--color-ink-soft)]">#{moiHorsTop.rang}</span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-paper)] border border-[var(--color-rule)] flex-shrink-0 text-sm">😊</div>
              <span className="flex-1 text-xs font-semibold text-[var(--color-success)]">Toi 👈</span>
              <span className="text-xs font-bold text-[var(--color-ink-soft)]">{moiHorsTop.xp} XP</span>
            </div>
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] text-[var(--color-ink-soft)] text-center">
        Classement anonyme parmi les élèves de {(data.niveauScolaire && NIVEAU_LABEL[data.niveauScolaire]) ?? "ton niveau"} · Réinitialisé chaque lundi
      </p>
    </Card>
  );
}
