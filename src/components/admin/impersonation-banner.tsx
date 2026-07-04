"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ImpersonatedRole } from "@/lib/auth/impersonation";

interface Props {
  actingAs: ImpersonatedRole;
  superAdminEmail: string;
  targetUserName?: string;
}

const ROLE_META: Record<ImpersonatedRole, { label: string; emoji: string; color: string }> = {
  ELEVE:      { label: "Élève",         emoji: "🎒", color: "#0f766e" },
  PARENT:     { label: "Parent",        emoji: "👨‍👩‍👧", color: "#b45309" },
  ENSEIGNANT: { label: "Enseignant(e)", emoji: "🍎", color: "#2563eb" },
  SPECIALISTE:{ label: "Spécialiste",   emoji: "👩‍⚕️", color: "#7c3aed" },
};

export function ImpersonationBanner({ actingAs, superAdminEmail, targetUserName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const meta = ROLE_META[actingAs];
  const displayName = targetUserName ?? meta.label;

  async function stopImpersonation() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate/stop", { method: "POST" });
      const data = await res.json();
      router.push(data.redirectTo ?? "/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ backgroundColor: meta.color }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-white shadow-lg"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>{meta.emoji}</span>
        <span>
          Vue simulée :&nbsp;<strong>{displayName}</strong>
          {targetUserName && (
            <span className="font-normal text-white/80 ml-1">({meta.label})</span>
          )}
        </span>
        <span className="hidden sm:inline text-white/60 font-normal text-xs ml-1">
          — {superAdminEmail}
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors disabled:opacity-60"
      >
        {loading ? "..." : "← Retourner à l'administration"}
      </button>
    </div>
  );
}
