"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

interface LogActionsProps {
  userId?: string | null;
  userEmail?: string | null;
  ip?: string | null;
}

export function LogActions({ userId, userEmail, ip }: LogActionsProps) {
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [suspendRaison, setSuspendRaison] = useState("");
  const [mode, setMode] = useState<"menu" | "alert" | "suspend" | "blockip">("menu");
  const ref = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const onSuccess = () => {
    setOpen(false);
    setMode("menu");
    utils.admin.getComptesSuspendus.invalidate();
    utils.admin.getIPsBloquees.invalidate();
    utils.admin.getSecurityLogs.invalidate();
  };

  const suspend = trpc.admin.suspendreCompte.useMutation({ onSuccess });
  const forceReset = trpc.admin.forcerResetMdp.useMutation({ onSuccess });
  const sendAlert = trpc.admin.envoyerAlerteSecurite.useMutation({ onSuccess });
  const blockIp = trpc.admin.bloquerIP.useMutation({ onSuccess });

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("menu");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!userId && !ip) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setMode("menu"); }}
        className="p-1 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)] transition-colors"
        title="Actions de sécurité"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="2" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="14" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-white shadow-xl rounded-xl border border-[var(--color-rule)] w-52 overflow-hidden">
          {mode === "menu" && (
            <div className="py-1">
              {userEmail && (
                <div className="px-3 py-1.5 text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wide border-b border-[var(--color-rule)]">
                  {userEmail}
                </div>
              )}
              {userId && (
                <>
                  <button
                    onClick={() => setMode("suspend")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-red-50 text-red-700"
                  >
                    <span>🔒</span> Suspendre le compte
                  </button>
                  <button
                    onClick={() => forceReset.mutate({ userId })}
                    disabled={forceReset.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--color-paper-warm)] text-[var(--color-ink)]"
                  >
                    <span>🔄</span> Forcer reset MDP
                  </button>
                  <button
                    onClick={() => setMode("alert")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-amber-50 text-amber-700"
                  >
                    <span>⚠️</span> Envoyer alerte sécurité
                  </button>
                </>
              )}
              {ip && (
                <button
                  onClick={() => setMode("blockip")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-red-50 text-red-700"
                >
                  <span>🚫</span> Bloquer l&apos;IP {ip}
                </button>
              )}
            </div>
          )}

          {mode === "suspend" && userId && (
            <div className="p-3">
              <p className="text-xs font-semibold text-red-700 mb-2">🔒 Suspendre le compte</p>
              <textarea
                placeholder="Motif (optionnel)…"
                value={suspendRaison}
                onChange={(e) => setSuspendRaison(e.target.value)}
                rows={2}
                className="w-full text-xs border border-[var(--color-rule)] rounded-lg p-2 resize-none mb-2 outline-none focus:border-red-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => suspend.mutate({ userId, raison: suspendRaison || undefined })}
                  disabled={suspend.isPending}
                  className="flex-1 rounded-lg bg-red-600 text-white text-xs py-1.5 font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {suspend.isPending ? "…" : "Confirmer"}
                </button>
                <button onClick={() => setMode("menu")} className="text-xs text-[var(--color-ink-soft)] px-2 hover:underline">Annuler</button>
              </div>
              {suspend.error && <p className="text-[10px] text-red-600 mt-1">{suspend.error.message}</p>}
            </div>
          )}

          {mode === "alert" && userId && (
            <div className="p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ Alerte de sécurité</p>
              <textarea
                placeholder="Message envoyé à l'utilisateur…"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={3}
                className="w-full text-xs border border-[var(--color-rule)] rounded-lg p-2 resize-none mb-2 outline-none focus:border-amber-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => sendAlert.mutate({ userId, message: alertMessage })}
                  disabled={sendAlert.isPending || alertMessage.length < 10}
                  className="flex-1 rounded-lg bg-amber-500 text-white text-xs py-1.5 font-semibold hover:bg-amber-600 disabled:opacity-50"
                >
                  {sendAlert.isPending ? "Envoi…" : "Envoyer"}
                </button>
                <button onClick={() => setMode("menu")} className="text-xs text-[var(--color-ink-soft)] px-2 hover:underline">Annuler</button>
              </div>
              {sendAlert.error && <p className="text-[10px] text-red-600 mt-1">{sendAlert.error.message}</p>}
            </div>
          )}

          {mode === "blockip" && ip && (
            <div className="p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">🚫 Bloquer {ip}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => blockIp.mutate({ ip })}
                  disabled={blockIp.isPending}
                  className="flex-1 rounded-lg bg-red-600 text-white text-xs py-1.5 font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {blockIp.isPending ? "…" : "Bloquer"}
                </button>
                <button onClick={() => setMode("menu")} className="text-xs text-[var(--color-ink-soft)] px-2 hover:underline">Annuler</button>
              </div>
              {blockIp.error && <p className="text-[10px] text-red-600 mt-1">{blockIp.error.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
