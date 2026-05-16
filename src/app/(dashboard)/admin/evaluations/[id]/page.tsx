import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { NavAdmin } from "@/components/layout/nav-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ValiderEvaluationBtn } from "./_components/valider-evaluation-btn";

const DOMAINE_LABELS: Record<string, { fr: string; icon: string; description: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", icon: "🧠", description: "Attention, mémoire, fonctions exécutives" },
  ORTHOPEDAGOGUE:   { fr: "Orthopédagogue",   icon: "📚", description: "Lecture, écriture, mathématiques" },
  ORTHOPHONISTE:    { fr: "Orthophoniste",     icon: "🗣️", description: "Communication orale et phonologie" },
  ERGOTHERAPEUTE:   { fr: "Ergothérapeute",    icon: "✋", description: "Motricité fine et autonomie scolaire" },
  OPTOMETRISTE:     { fr: "Optométriste",      icon: "👁️", description: "Vision fonctionnelle et confort visuel" },
  PSYCHOEDUCATEUR:  { fr: "Psychoéducateur",   icon: "💬", description: "Motivation, adaptation sociale" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DETECTED:              { label: "En attente de validation",   color: "bg-amber-100 text-amber-800" },
  ADMIN_NOTIFIED:        { label: "Admin notifié",              color: "bg-amber-100 text-amber-800" },
  ADMIN_VALIDATED:       { label: "Validé par admin",           color: "bg-blue-100 text-blue-800" },
  FORM_SENT:             { label: "Formulaire envoyé",          color: "bg-blue-100 text-blue-800" },
  FORM_IN_PROGRESS:      { label: "Formulaire en cours",        color: "bg-indigo-100 text-indigo-800" },
  FORM_COMPLETED:        { label: "Formulaire complété",        color: "bg-purple-100 text-purple-800" },
  REPORT_GENERATING:     { label: "Rapport en génération",      color: "bg-purple-100 text-purple-800" },
  REPORT_READY:          { label: "Rapport prêt",               color: "bg-emerald-100 text-emerald-800" },
  PARENT_VALIDATED:      { label: "Validé par parent",          color: "bg-emerald-100 text-emerald-800" },
  PARENT_COMMENTED:      { label: "Commenté par parent",        color: "bg-teal-100 text-teal-800" },
  PARENT_REFUSED:        { label: "Refusé par parent",          color: "bg-red-100 text-red-800" },
  PARCOURS_ADJUSTED:     { label: "Parcours ajusté",            color: "bg-green-100 text-green-800" },
  SECOND_CYCLE_PENDING:  { label: "2ᵉ cycle en attente",       color: "bg-violet-100 text-violet-800" },
  CLOSED:                { label: "Fermé",                       color: "bg-gray-100 text-gray-500" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EvaluationDetailPage({ params }: Props) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  let evaluation: Awaited<ReturnType<typeof api.admin.getEvaluationDetail>>;
  try {
    evaluation = await api.admin.getEvaluationDetail({ evaluationId: id });
  } catch {
    notFound();
  }

  const statusConf = STATUS_CONFIG[evaluation.status] ?? { label: evaluation.status, color: "bg-gray-100 text-gray-600" };
  const domaine = DOMAINE_LABELS[evaluation.primarySpecialist];
  const canValidate = evaluation.status === "DETECTED" || evaluation.status === "ADMIN_NOTIFIED";

  const rapportFr = evaluation.rapports.find((r) => r.type === "DETAIL" && r.langue === "fr");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://edu-reussite.com";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
          <Link href="/admin/evaluations" className="hover:text-[var(--color-ink)] transition-colors">
            ← Évaluations
          </Link>
          <span>/</span>
          <span className="text-[var(--color-ink)] font-semibold">
            {evaluation.eleve.prenom} {evaluation.eleve.nom}
          </span>
        </div>

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-4xl">{domaine?.icon ?? "🔬"}</span>
            <div>
              <h1 className="text-xl font-black text-[var(--color-ink)]">
                {evaluation.eleve.prenom} {evaluation.eleve.nom}
              </h1>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {domaine?.fr ?? evaluation.primarySpecialist} · {evaluation.eleve.niveauScolaire.replace("_", " ")}
                {evaluation.round > 1 && <span className="ml-1 text-violet-600 font-semibold"> · Round {evaluation.round}</span>}
              </p>
            </div>
          </div>
          <span className={`self-start px-3 py-1.5 rounded-full text-xs font-bold ${statusConf.color}`}>
            {statusConf.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Colonne gauche — détails */}
          <div className="md:col-span-2 space-y-4">
            {/* Spécialiste recommandé */}
            <Card className="p-5">
              <CardLabel className="mb-3">Spécialiste recommandé</CardLabel>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)]">
                <span className="text-2xl">{domaine?.icon}</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink)]">{domaine?.fr}</p>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{domaine?.description}</p>
                </div>
              </div>
            </Card>

            {/* Formulaire */}
            {evaluation.formulaire && (
              <Card className="p-5">
                <CardLabel className="mb-3">Formulaire parent</CardLabel>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-ink-soft)]">Statut</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {evaluation.formulaire.completed ? "Complété" : `Étape ${evaluation.formulaire.etapeActuelle ?? 0}`}
                    </span>
                  </div>
                  {evaluation.formulaire.tokenAcces && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-ink-soft)]">Lien formulaire</span>
                      <a
                        href={`${appUrl}/evaluation/${evaluation.formulaire.tokenAcces}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-accent)] hover:underline font-mono"
                      >
                        /evaluation/{evaluation.formulaire.tokenAcces.slice(0, 16)}…
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Rapport */}
            {rapportFr && (
              <Card className="p-5">
                <CardLabel className="mb-3">Rapport généré</CardLabel>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-soft)]">Généré le</span>
                    <span className="text-[var(--color-ink)]">
                      {new Date(rapportFr.generatedAt).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  {evaluation.formulaire?.tokenAcces && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-ink-soft)]">Lien rapport</span>
                      <a
                        href={`${appUrl}/evaluation/rapport/${evaluation.formulaire.tokenAcces}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-accent)] hover:underline font-mono"
                      >
                        /evaluation/rapport/…
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Commentaire parent */}
            {evaluation.parentComment && (
              <Card className="p-5">
                <CardLabel className="mb-3">Commentaire du parent</CardLabel>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed italic">
                  &ldquo;{evaluation.parentComment}&rdquo;
                </p>
              </Card>
            )}
          </div>

          {/* Colonne droite — timeline + actions */}
          <div className="space-y-4">
            {/* Action admin */}
            {canValidate && (
              <Card className="p-5">
                <CardLabel className="mb-3">Action requise</CardLabel>
                <p className="text-xs text-[var(--color-ink-soft)] mb-4">
                  Cette évaluation est en attente de votre validation avant d'envoyer le formulaire au parent.
                </p>
                <ValiderEvaluationBtn evaluationId={evaluation.id} />
              </Card>
            )}

            {/* Timeline */}
            <Card className="p-5">
              <CardLabel className="mb-3">Chronologie</CardLabel>
              <div className="space-y-3">
                {[
                  { label: "Détecté", date: evaluation.detectedAt, icon: "🔍" },
                  { label: "Admin notifié", date: evaluation.adminNotifiedAt, icon: "📬" },
                  { label: "Admin validé", date: evaluation.adminValidatedAt, icon: "✅" },
                  { label: "Formulaire envoyé", date: evaluation.formSentAt, icon: "📧" },
                  { label: "Formulaire complété", date: evaluation.formCompletedAt, icon: "📋" },
                  { label: "Parcours ajusté", date: evaluation.parcoursAdjustedAt, icon: "🎯" },
                  { label: "Parent validé", date: evaluation.parentValidatedAt, icon: "👨‍👩‍👧" },
                ].filter((e) => e.date).map((event) => (
                  <div key={event.label} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5">{event.icon}</span>
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{event.label}</p>
                      <p className="text-[var(--color-ink-soft)]">
                        {new Date(event.date!).toLocaleDateString("fr-CA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
