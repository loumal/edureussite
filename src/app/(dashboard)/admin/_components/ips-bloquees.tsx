"use client";

import { trpc } from "@/lib/trpc/client";

export function IPsBloquees() {
  const { data: ips, isLoading } = trpc.admin.getIPsBloquees.useQuery();
  const utils = trpc.useUtils();

  const debloquer = trpc.admin.debloquerIP.useMutation({
    onSuccess: () => utils.admin.getIPsBloquees.invalidate(),
  });

  if (isLoading) return null;
  if (!ips || ips.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🚫</span>
        <h2 className="text-base font-black text-[var(--color-ink)]">IPs bloquées</h2>
        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{ips.length}</span>
      </div>

      <div className="rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">Adresse IP</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">Motif</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">Bloquée le</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {ips.map((ip) => (
              <tr key={ip.id} className="border-b border-[var(--color-rule)] last:border-0 hover:bg-[var(--color-paper-warm)]">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[var(--color-ink)]">{ip.ip}</td>
                <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)] max-w-[200px] truncate">
                  {ip.raison ?? <span className="italic">Non précisé</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                  {new Date(ip.createdAt).toLocaleDateString("fr-CA", { dateStyle: "short" })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => debloquer.mutate({ ip: ip.ip })}
                    disabled={debloquer.isPending}
                    className="text-xs px-3 py-1 rounded-lg border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
                  >
                    Débloquer
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
