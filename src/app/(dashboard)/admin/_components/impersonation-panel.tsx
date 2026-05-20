"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = [
  {
    role: "ENSEIGNANT" as const,
    label: "Enseignant(e)",
    description: "Tableau de bord, liste des élèves, analyses de classe",
    emoji: "🍎",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    role: "SPECIALISTE" as const,
    label: "Spécialiste",
    description: "Agenda, demandes de rencontre, webinaires",
    emoji: "👩‍⚕️",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    badgeColor: "bg-purple-100 text-purple-800",
  },
] as const;

export function ImpersonationPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function startImpersonation(role: "ENSEIGNANT" | "SPECIALISTE") {
    setLoading(role);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">👁️</span>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
          Simuler une vue
        </p>
      </div>
      <p className="text-xs text-[var(--color-ink-soft)] mb-4">
        Naviguez dans l'environnement d'un autre rôle pour l'inspecter et l'améliorer.
        Un bandeau visible vous permettra de revenir à l'administration à tout moment.
      </p>
      <div className="space-y-3">
        {ROLES.map(({ role, label, description, emoji, color, badgeColor }) => (
          <button
            key={role}
            onClick={() => startImpersonation(role)}
            disabled={loading !== null}
            className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${color}`}
          >
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 truncate">{description}</p>
            </div>
            <span className="text-[var(--color-ink-soft)] text-sm flex-shrink-0">
              {loading === role ? "..." : "→"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
