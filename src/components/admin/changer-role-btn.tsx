"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  roleActuel: string;
}

export function ChangerRoleBtn({ userId, roleActuel }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"promouvoir" | "retirer" | null>(null);
  const [roleRetrait, setRoleRetrait] = useState<"PARENT" | "ENSEIGNANT">("PARENT");

  const changer = trpc.admin.changerRole.useMutation({
    onSuccess: () => {
      setConfirming(null);
      router.refresh();
    },
  });

  // Protégé : on ne touche pas aux SUPER_ADMIN
  if (roleActuel === "SUPER_ADMIN") return null;

  // Cas : élève — choix générique (ex: correction d'une mauvaise classification)
  if (roleActuel === "ELEVE") {
    if (confirming === "promouvoir") {
      return (
        <div className="flex items-center gap-1.5">
          <select
            value={roleRetrait}
            onChange={(e) => setRoleRetrait(e.target.value as "PARENT" | "ENSEIGNANT")}
            className="rounded-lg border border-[var(--color-rule)] px-2 py-1 text-xs text-[var(--color-ink)] focus:outline-none"
          >
            <option value="PARENT">Parent</option>
            <option value="ENSEIGNANT">Enseignant</option>
          </select>
          <button
            onClick={() => changer.mutate({ userId, role: roleRetrait })}
            disabled={changer.isPending}
            className="rounded-lg bg-[var(--color-ink)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {changer.isPending ? "..." : "Confirmer"}
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="text-xs text-[var(--color-ink-soft)] hover:underline"
          >
            Annuler
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirming("promouvoir")}
        className="rounded-lg border border-[var(--color-rule)] px-2 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] transition-colors"
      >
        Changer rôle
      </button>
    );
  }

  // Cas : retirer les droits admin
  if (roleActuel === "ADMIN") {
    if (confirming === "retirer") {
      return (
        <div className="flex items-center gap-1.5">
          <select
            value={roleRetrait}
            onChange={(e) => setRoleRetrait(e.target.value as "PARENT" | "ENSEIGNANT")}
            className="rounded-lg border border-[var(--color-rule)] px-2 py-1 text-xs text-[var(--color-ink)] focus:outline-none"
          >
            <option value="PARENT">Parent</option>
            <option value="ENSEIGNANT">Enseignant</option>
          </select>
          <button
            onClick={() => changer.mutate({ userId, role: roleRetrait })}
            disabled={changer.isPending}
            className="rounded-lg bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {changer.isPending ? "..." : "Confirmer"}
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="text-xs text-[var(--color-ink-soft)] hover:underline"
          >
            Annuler
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirming("retirer")}
        className="rounded-lg border border-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)] transition-colors"
      >
        Retirer Admin
      </button>
    );
  }

  // Cas : nommer admin (PARENT ou ENSEIGNANT)
  if (confirming === "promouvoir") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-ink-soft)]">Nommer Admin ?</span>
        <button
          onClick={() => changer.mutate({ userId, role: "ADMIN" })}
          disabled={changer.isPending}
          className="rounded-lg bg-[var(--color-gold)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {changer.isPending ? "..." : "Confirmer"}
        </button>
        <button
          onClick={() => setConfirming(null)}
          className="text-xs text-[var(--color-ink-soft)] hover:underline"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming("promouvoir")}
      className="rounded-lg border border-[var(--color-gold)] px-2 py-1 text-xs font-semibold text-[var(--color-gold)] hover:bg-[rgba(201,149,42,0.06)] transition-colors"
    >
      Nommer Admin
    </button>
  );
}
