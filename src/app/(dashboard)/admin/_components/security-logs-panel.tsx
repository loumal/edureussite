"use client";

import { useState } from "react";
import { ExportLogsBtn } from "./export-logs-btn";
import { LogActions } from "./log-actions";

const ACTION_LABEL: Record<string, string> = {
  FORCE_BRUTE_DETECTEE:       "⚠ Force brute détectée",
  CONNEXION_ECHOUEE:          "Connexion échouée",
  CONNEXION_ELEVE_ECHOUEE:    "Connexion élève échouée",
  OTP_INVALIDE:               "Code OTP invalide",
  SPAM_OTP:                   "Spam OTP — attaque active",
  CONNEXION_COMPTE_SUSPENDU:  "Tentative sur compte suspendu",
  DEMANDE_RESET_MDP:          "Demande de réinitialisation MDP",
  MOT_DE_PASSE_REINITIALISE:  "MDP réinitialisé par admin",
  ACCES_REFUSE:               "Accès refusé — escalade de privilèges",
  ROLE_MODIFIE:               "Rôle utilisateur modifié",
  UTILISATEUR_SUPPRIME:       "Compte utilisateur supprimé",
  SUPER_ADMIN_CREE:           "Nouveau Super Admin créé",
  COMPTE_SUSPENDU:            "Compte suspendu",
  COMPTE_REACTIVE:            "Compte réactivé",
  RESET_MDP_FORCE:            "Réinitialisation MDP forcée",
  ALERTE_SECURITE_ENVOYEE:    "Alerte de sécurité envoyée",
  IP_BLOQUEE:                 "IP bloquée",
  IP_DEBLOQUEE:               "IP débloquée",
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  WARNING:  "bg-amber-50 text-amber-700 border-amber-200",
  INFO:     "bg-blue-50 text-blue-700 border-blue-200",
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  WARNING:  "bg-amber-400",
  INFO:     "bg-blue-400",
};

type Log = {
  id: string;
  createdAt: Date;
  action: string;
  severity: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  cibleId: string | null;
  cibleEmail: string | null;
  ip: string | null;
  details: unknown;
};

type Filter = "ALL" | "CRITICAL" | "WARNING";

export function SecurityLogsPanel({ logs }: { logs: Log[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const visible = filter === "ALL" ? logs : logs.filter((l) => l.severity === filter);

  const nCritical = logs.filter((l) => l.severity === "CRITICAL").length;
  const nWarning  = logs.filter((l) => l.severity === "WARNING").length;

  const TABS: { key: Filter; label: string; count: number; activeClass: string }[] = [
    { key: "ALL",      label: "Tous",           count: logs.length, activeClass: "bg-[var(--color-ink)] text-white" },
    { key: "CRITICAL", label: "Critique",        count: nCritical,   activeClass: "bg-red-600 text-white" },
    { key: "WARNING",  label: "Avertissement",   count: nWarning,    activeClass: "bg-amber-500 text-white" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">Journaux de sécurité</span>
          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                  filter === tab.key
                    ? tab.activeClass
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${
                    filter === tab.key ? "bg-white/25" : "bg-[var(--color-rule)]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportLogsBtn />
          <span className="text-xs text-[var(--color-ink-soft)]">{visible.length} / {logs.length}</span>
        </div>
      </div>

      {/* Log list */}
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] text-center py-4">
          Aucun événement{filter !== "ALL" ? " dans cette catégorie" : ""}.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-3 rounded-xl border p-3 text-xs ${SEVERITY_STYLE[log.severity] ?? SEVERITY_STYLE.INFO}`}
            >
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[log.severity] ?? SEVERITY_DOT.INFO}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="opacity-60">
                      {new Date(log.createdAt).toLocaleString("fr-CA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <LogActions
                      userId={log.cibleId ?? log.userId}
                      userEmail={log.cibleEmail ?? log.userEmail}
                      ip={log.ip}
                    />
                  </div>
                </div>
                <div className="mt-0.5 opacity-80 truncate">
                  {log.userEmail && <span>Par : {log.userEmail}</span>}
                  {log.cibleEmail && <span> → {log.cibleEmail}</span>}
                  {log.ip && <span> · IP : {log.ip}</span>}
                </div>
                {log.details !== null && log.details !== undefined && typeof log.details === "object" && !Array.isArray(log.details) && (
                  <div className="mt-0.5 opacity-60">
                    {Object.entries(log.details as Record<string, string | number | boolean | null>).map(([k, v]) => (
                      <span key={k} className="mr-2">{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
