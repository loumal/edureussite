"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId: string;
  nom: string;
}

export function ImpersonerUserBtn({ targetUserId, nom }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Simuler la session de ${nom}`}
      className="rounded-lg border border-[var(--color-rule)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "👁️ Simuler"}
    </button>
  );
}
