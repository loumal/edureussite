import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import { ValiderEpreuveBtn } from "@/components/admin/valider-epreuve-btn";
import Link from "next/link";
import { notFound } from "next/navigation";

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique",
  ETHIQUE: "Éthique",
};

const SOURCE_LABEL: Record<string, string> = {
  MEES_OFFICIEL: "MEES Officiel",
  COMMISSION_SCOLAIRE: "Commission scolaire",
  MANUEL_SCOLAIRE: "Manuel scolaire",
  AUTRE: "Autre",
};

const TYPE_LABEL: Record<string, string> = {
  TEXTE_TROUS: "Texte à trous",
  QCM: "Choix multiples",
  QUESTION_OUVERTE: "Question ouverte",
  PROBLEME_MATHEMATIQUE: "Problème mathématique",
  LECTURE_COMPREHENSION: "Lecture/compréhension",
  EXERCICE_ORAL: "Exercice oral",
  MISE_EN_SITUATION: "Mise en situation",
  SCHEMA_COMPLETER: "Schéma à compléter",
  CHRONOLOGIE: "Chronologie",
  MINI_DEFI: "Mini-défi",
};

const DIFFICULTE_LABEL: Record<string, string> = {
  REMEDIATION: "Remédiation",
  BASE: "Base",
  ATTENDU: "Attendu",
  AVANCE: "Avancé",
  EXCELLENCE: "Excellence",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function EpreuveDetailPage({ params }: PageParams) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  let epreuve;
  try {
    epreuve = await api.admin.getEpreuve({ id });
  } catch {
    notFound();
  }

  const structure = epreuve.structureAnalysee as {
    styleGeneral?: string;
    competencesGlobales?: string[];
    niveauLangue?: string;
    consignesGenerales?: string;
  } | null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/epreuves"
              className="text-xs text-[var(--color-ink-soft)] hover:underline mb-2 inline-block"
            >
              ← Bibliothèque d'épreuves
            </Link>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">{epreuve.titre}</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {MATIERE_LABEL[epreuve.matiere] ?? epreuve.matiere} ·{" "}
              {epreuve.niveauScolaire.replace(/_/g, " ")} ·{" "}
              {SOURCE_LABEL[epreuve.source] ?? epreuve.source}
              {epreuve.annee ? ` · ${epreuve.annee}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {epreuve.valide ? (
              <Badge variant="success">✓ Validé</Badge>
            ) : (
              <Badge variant="accent">En attente de validation</Badge>
            )}
            {isSuperAdmin && (
              <ValiderEpreuveBtn
                id={epreuve.id}
                valide={epreuve.valide}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Méta-données */}
          <div className="space-y-4">
            <Card className="p-4">
              <CardLabel className="mb-3">Informations</CardLabel>
              <dl className="space-y-2 text-sm">
                {epreuve.totalPoints && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-ink-soft)]">Total points</dt>
                    <dd className="font-semibold text-[var(--color-ink)]">
                      {epreuve.totalPoints} pts
                    </dd>
                  </div>
                )}
                {epreuve.dureeMinutes && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-ink-soft)]">Durée</dt>
                    <dd className="font-semibold text-[var(--color-ink)]">
                      {epreuve.dureeMinutes} min
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Sections</dt>
                  <dd className="font-semibold text-[var(--color-ink)]">
                    {epreuve.sections.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Ajouté le</dt>
                  <dd className="font-semibold text-[var(--color-ink)]">
                    {new Date(epreuve.createdAt).toLocaleDateString("fr-CA")}
                  </dd>
                </div>
              </dl>
            </Card>

            {structure && (
              <Card className="p-4">
                <CardLabel className="mb-3">Analyse structurelle</CardLabel>
                {structure.styleGeneral && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                      Style général
                    </p>
                    <p className="text-xs text-[var(--color-ink)]">{structure.styleGeneral}</p>
                  </div>
                )}
                {structure.niveauLangue && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                      Registre de langue
                    </p>
                    <p className="text-xs text-[var(--color-ink)]">{structure.niveauLangue}</p>
                  </div>
                )}
                {structure.competencesGlobales && structure.competencesGlobales.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                      Compétences PFEQ
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {structure.competencesGlobales.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sections */}
          <div className="md:col-span-2">
            <Card className="p-5">
              <CardLabel className="mb-4">
                Sections de l'épreuve ({epreuve.sections.length})
              </CardLabel>

              {epreuve.sections.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-soft)] text-center py-4">
                  Aucune section définie.
                </p>
              ) : (
                <div className="space-y-4">
                  {epreuve.sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-xl border border-[var(--color-rule)] p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-ink)]">
                            {section.ordre}. {section.titre}
                          </p>
                          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                            {TYPE_LABEL[section.typeQuestion] ?? section.typeQuestion} ·{" "}
                            {section.nombreQuestions} question{section.nombreQuestions > 1 ? "s" : ""} ·{" "}
                            {section.pointsTotal} pts
                          </p>
                        </div>
                        <Badge
                          variant={
                            section.difficulte === "AVANCE" || section.difficulte === "EXCELLENCE"
                              ? "accent"
                              : section.difficulte === "REMEDIATION"
                              ? "gold"
                              : "success"
                          }
                        >
                          {DIFFICULTE_LABEL[section.difficulte] ?? section.difficulte}
                        </Badge>
                      </div>

                      {section.instructions && (
                        <p className="text-xs text-[var(--color-ink-soft)] mb-2 italic">
                          {section.instructions}
                        </p>
                      )}

                      {section.competencesPFEQ.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {section.competencesPFEQ.map((c, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-[rgba(42,124,111,0.08)] px-2 py-0.5 text-xs text-[var(--color-success)]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {section.exempleQuestion && (
                        <div className="mt-3 rounded-lg bg-[var(--color-paper-warm)] p-3">
                          <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                            Exemple de format (généré, non copié) :
                          </p>
                          <p className="text-xs text-[var(--color-ink)]">
                            {(section.exempleQuestion as { enonce?: string }).enonce ?? "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {epreuve.description && (
              <Card className="p-5 mt-4">
                <CardLabel className="mb-2">Description pédagogique</CardLabel>
                <p className="text-sm text-[var(--color-ink)]">{epreuve.description}</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
