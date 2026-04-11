"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const ACTION_LABEL: Record<string, string> = {
  FORCE_BRUTE_DETECTEE:       "Force brute détectée",
  CONNEXION_ECHOUEE:          "Connexion échouée",
  CONNEXION_ELEVE_ECHOUEE:    "Connexion élève échouée",
  OTP_INVALIDE:               "Code OTP invalide",
  SPAM_OTP:                   "Spam OTP",
  CONNEXION_COMPTE_SUSPENDU:  "Tentative sur compte suspendu",
  DEMANDE_RESET_MDP:          "Demande réinitialisation MDP",
  MOT_DE_PASSE_REINITIALISE:  "MDP réinitialisé par admin",
  ACCES_REFUSE:               "Accès refusé",
  ROLE_MODIFIE:               "Rôle modifié",
  UTILISATEUR_SUPPRIME:       "Compte supprimé",
  SUPER_ADMIN_CREE:           "Super Admin créé",
  COMPTE_SUSPENDU:            "Compte suspendu",
  COMPTE_REACTIVE:            "Compte réactivé",
  RESET_MDP_FORCE:            "Réinit. MDP forcée",
  ALERTE_SECURITE_ENVOYEE:    "Alerte sécurité envoyée",
  IP_BLOQUEE:                 "IP bloquée",
  IP_DEBLOQUEE:               "IP débloquée",
};

export function ExportLogsBtn() {
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  async function handleExport() {
    setLoading(true);
    try {
      const logs = await utils.admin.exportSecurityLogs.fetch({ severity: "ALL" });

      // Import dynamique de xlsx (côté client uniquement)
      const XLSX = await import("xlsx");

      const rows = logs.map((l) => ({
        "Date / Heure": new Date(l.createdAt).toLocaleString("fr-CA", {
          dateStyle: "short",
          timeStyle: "medium",
          timeZone: "America/Toronto",
        }),
        "Sévérité": l.severity,
        "Action": ACTION_LABEL[l.action] ?? l.action,
        "Utilisateur (email)": l.userEmail ?? "",
        "Rôle": l.userRole ?? "",
        "Cible (email)": l.cibleEmail ?? "",
        "Adresse IP": l.ip ?? "",
        "Détails": l.details ? JSON.stringify(l.details) : "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Largeurs de colonnes
      ws["!cols"] = [
        { wch: 20 }, // Date
        { wch: 10 }, // Sévérité
        { wch: 32 }, // Action
        { wch: 30 }, // Email
        { wch: 14 }, // Rôle
        { wch: 30 }, // Cible
        { wch: 16 }, // IP
        { wch: 40 }, // Détails
      ];

      // Style d'en-tête (couleur selon sévérité — XLSX standard)
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Journaux de sécurité");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `edureussite-logs-securite-${date}.xlsx`);
    } catch (e) {
      console.error("Erreur export:", e);
      alert("Erreur lors de l'export. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[var(--color-ink)] border-t-transparent" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      {loading ? "Export…" : "Exporter Excel"}
    </button>
  );
}
