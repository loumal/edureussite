"use client";

import { trpc } from "@/lib/trpc/client";

export function ComptesSuspendus() {
  const { data: comptes, isLoading } = trpc.admin.getComptesSuspendus.useQuery();
  const utils = trpc.useUtils();

  const reactiver = trpc.admin.reactiverCompte.useMutation({
    onSuccess: () => utils.admin.getComptesSuspendus.invalidate(),
  });

  if (isLoading) return null;
  if (!comptes || comptes.length === 0) return null;

  const ROLE_LABEL: Record<string, string> = {
    ELEVE: "Élève", PARENT: "Parent", ENSEIGNANT: "Enseignant",
    SPECIALISTE: "Spécialiste", ADMIN: "Admin", SUPER_ADMIN: "Super Admin",
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🔒</span>
        <h2 className="text-base font-black text-[var(--color-ink)]">Comptes suspendus</h2>
        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{comptes.length}</span>
      </div>

      <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-red-50">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-red-700 uppercase tracking-wide">Utilisateur</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-red-700 uppercase tracking-wide">Rôle</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-red-700 uppercase tracking-wide">Motif</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-red-700 uppercase tracking-wide">Suspendu le</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-red-700 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {comptes.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-rule)] last:border-0 hover:bg-[var(--color-paper-warm)]">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-xs text-[var(--color-ink)]">{c.name ?? "—"}</p>
                  <p className="text-[10px] text-[var(--color-ink-soft)]">{c.email}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">{ROLE_LABEL[c.role] ?? c.role}</td>
                <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)] max-w-[180px] truncate">
                  {c.suspendedRaison ?? <span className="italic">Non précisé</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                  {c.suspendedAt ? new Date(c.suspendedAt).toLocaleDateString("fr-CA", { dateStyle: "short" }) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => reactiver.mutate({ userId: c.id, forcerResetMdp: true })}
                    disabled={reactiver.isPending}
                    className="text-xs px-3 py-1 rounded-lg bg-[var(--color-ink)] text-white font-semibold hover:opacity-80 disabled:opacity-40"
                  >
                    Réactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
