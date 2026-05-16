import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import Link from "next/link";

const DOMAINE_LABELS: Record<string, { fr: string; icon: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", icon: "🧠" },
  ORTHOPEDAGOGUE:   { fr: "Orthopédagogue",   icon: "📚" },
  ORTHOPHONISTE:    { fr: "Orthophoniste",     icon: "🗣️" },
  ERGOTHERAPEUTE:   { fr: "Ergothérapeute",    icon: "✋" },
  OPTOMETRISTE:     { fr: "Optométriste",      icon: "👁️" },
  PSYCHOEDUCATEUR:  { fr: "Psychoéducateur",   icon: "💬" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; action?: boolean }> = {
  DETECTED:              { label: "En attente validation", color: "bg-amber-100 text-amber-800", action: true },
  ADMIN_NOTIFIED:        { label: "Admin notifié",         color: "bg-amber-100 text-amber-800", action: true },
  ADMIN_VALIDATED:       { label: "Validé",                color: "bg-blue-100 text-blue-800" },
  FORM_SENT:             { label: "Formulaire envoyé",     color: "bg-blue-100 text-blue-800" },
  FORM_IN_PROGRESS:      { label: "En cours de remplissage", color: "bg-indigo-100 text-indigo-800" },
  FORM_COMPLETED:        { label: "Formulaire complété",   color: "bg-purple-100 text-purple-800" },
  REPORT_GENERATING:     { label: "Rapport en génération", color: "bg-purple-100 text-purple-800" },
  REPORT_READY:          { label: "Rapport prêt",          color: "bg-emerald-100 text-emerald-800" },
  PARENT_VALIDATED:      { label: "Validé par parent",     color: "bg-emerald-100 text-emerald-800" },
  PARENT_COMMENTED:      { label: "Commenté par parent",   color: "bg-teal-100 text-teal-800" },
  PARENT_REFUSED:        { label: "Refusé par parent",     color: "bg-red-100 text-red-800" },
  PARCOURS_ADJUSTED:     { label: "Parcours ajusté",       color: "bg-green-100 text-green-800" },
  SECOND_CYCLE_PENDING:  { label: "2ᵉ cycle en attente",  color: "bg-violet-100 text-violet-800", action: true },
  CLOSED:                { label: "Fermé",                  color: "bg-gray-100 text-gray-500" },
};

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminEvaluationsPage({ searchParams }: Props) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const { total, perPage, evaluations } = await api.admin.listerEvaluations({
    status: status || undefined,
    page,
  });

  const totalPages = Math.ceil(total / perPage);
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Évaluations cognitives</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {total} évaluation{total !== 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "", label: "Toutes" },
            { value: "DETECTED", label: "À valider" },
            { value: "FORM_SENT", label: "Formulaire envoyé" },
            { value: "REPORT_READY", label: "Rapport prêt" },
            { value: "PARCOURS_ADJUSTED", label: "Parcours ajusté" },
            { value: "SECOND_CYCLE_PENDING", label: "2ᵉ cycle" },
            { value: "CLOSED", label: "Fermés" },
          ].map((f) => (
            <Link
              key={f.value}
              href={`/admin/evaluations${f.value ? `?status=${f.value}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                (status ?? "") === f.value
                  ? "bg-[var(--color-ink)] text-white border-transparent"
                  : "bg-white border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <Card className="overflow-hidden p-0">
          {evaluations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-5xl mb-4">🔬</div>
              <p className="text-sm text-[var(--color-ink-soft)]">Aucune évaluation pour ce filtre.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-rule)]">
              {evaluations.map((ev) => {
                const statusConf = STATUS_CONFIG[ev.status] ?? { label: ev.status, color: "bg-gray-100 text-gray-600" };
                const domaine = DOMAINE_LABELS[ev.primarySpecialist];
                const formPct = ev.formulaire?.etapeActuelle
                  ? Math.round((ev.formulaire.etapeActuelle / 6) * 100)
                  : null;

                return (
                  <Link
                    key={ev.id}
                    href={`/admin/evaluations/${ev.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-paper-warm)] transition-colors"
                  >
                    <span className="text-2xl flex-shrink-0">{domaine?.icon ?? "🔬"}</span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                        {ev.eleve.prenom} {ev.eleve.nom}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                        {domaine?.fr ?? ev.primarySpecialist} · {ev.eleve.niveauScolaire.replace("_", " ")}
                        {ev.round > 1 && <span className="ml-1 text-violet-600 font-semibold">· Round {ev.round}</span>}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusConf.color}`}>
                        {statusConf.action && "⚡ "}{statusConf.label}
                      </span>
                      {formPct !== null && !ev.formulaire?.completed && (
                        <span className="text-xs text-[var(--color-ink-soft)]">{formPct}% rempli</span>
                      )}
                      <span className="text-xs text-[var(--color-ink-soft)]">
                        {new Date(ev.detectedAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/evaluations?${status ? `status=${status}&` : ""}page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold border transition-colors ${
                  p === page
                    ? "bg-[var(--color-ink)] text-white border-transparent"
                    : "bg-white border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
