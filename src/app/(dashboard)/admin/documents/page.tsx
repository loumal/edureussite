import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import { GererDocumentsClient } from "@/components/admin/gerer-documents-client";
import { SupprimerDocumentBtn } from "@/components/admin/supprimer-document-btn";

const TYPE_LABEL: Record<string, string> = {
  RECHERCHE_SCIENTIFIQUE: "Recherche scientifique",
  GUIDE_PEDAGOGIQUE: "Guide pédagogique",
  STRATEGIE_INTERVENTION: "Stratégie d'intervention",
  RESULTAT_ETUDE: "Résultat d'étude",
  RESSOURCE_PARENTALE: "Ressource parentale",
  AUTRE: "Document",
};

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Maths", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais", ARTS: "Arts",
  ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
};

const NIVEAU_LABEL: Record<string, string> = {
  PRIMAIRE_1: "1re", PRIMAIRE_2: "2e", PRIMAIRE_3: "3e",
  PRIMAIRE_4: "4e", PRIMAIRE_5: "5e", PRIMAIRE_6: "6e",
  SECONDAIRE_1: "Sec.1", SECONDAIRE_2: "Sec.2", SECONDAIRE_3: "Sec.3",
  SECONDAIRE_4: "Sec.4", SECONDAIRE_5: "Sec.5",
};

const TYPE_VARIANT: Record<string, "success" | "gold" | "accent" | "default"> = {
  RECHERCHE_SCIENTIFIQUE: "success",
  GUIDE_PEDAGOGIQUE: "gold",
  STRATEGIE_INTERVENTION: "accent",
  RESULTAT_ETUDE: "success",
  RESSOURCE_PARENTALE: "gold",
  AUTRE: "default",
};

export default async function DocumentsPage() {
  const session = await requireRole(["SUPER_ADMIN"]);
  const [documents, featureFlags] = await Promise.all([
    api.admin.listerDocuments(),
    api.admin.getProvinceFlags(),
  ]);
  const multiProvince = featureFlags.multiProvince;
  const provincesActives = featureFlags.provincesActives;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Documents IA 📚</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""} · Ces ressources enrichissent les conseils générés par l&apos;IA pour les parents et élèves.
            </p>
          </div>
          <GererDocumentsClient multiProvince={multiProvince} provincesActives={provincesActives} />
        </div>

        <div className="mb-6 rounded-xl bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] px-4 py-3">
          <p className="text-sm text-[var(--color-success)] font-medium">
            🤖 Les documents actifs sont automatiquement injectés dans les prompts IA lors de la génération des plans d&apos;accompagnement et des recommandations de spécialistes. Ajoutez des recherches récentes, guides pédagogiques ou stratégies d&apos;intervention pour enrichir la qualité des conseils.
          </p>
        </div>

        {documents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Aucun document pour l&apos;instant. Ajoutez des recherches scientifiques, guides pédagogiques ou stratégies d&apos;intervention pour enrichir l&apos;IA.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm text-[var(--color-ink)]">{doc.titre}</p>
                      <Badge variant={TYPE_VARIANT[doc.type] ?? "default"}>
                        {TYPE_LABEL[doc.type] ?? doc.type}
                      </Badge>
                      {!doc.actif && <Badge variant="default">Inactif</Badge>}
                    </div>
                    {(doc.auteurs || doc.annee || doc.source) && (
                      <p className="text-xs text-[var(--color-ink-soft)] mb-2">
                        {[doc.auteurs, doc.annee, doc.source].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-ink-soft)] line-clamp-3">{doc.contenu}</p>
                    {(doc.matieres.length > 0 || doc.niveaux.length > 0 || doc.matiereLibre || doc.niveauLibre) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.matieres.map((m) => (
                          <span key={m} className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-700 font-medium">
                            {MATIERE_LABEL[m] ?? m}
                          </span>
                        ))}
                        {doc.niveaux.map((n) => (
                          <span key={n} className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] text-purple-700 font-medium">
                            {NIVEAU_LABEL[n] ?? n}
                          </span>
                        ))}
                        {doc.matiereLibre && (
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-700 font-medium">
                            {doc.matiereLibre}
                          </span>
                        )}
                        {doc.niveauLibre && (
                          <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] text-purple-700 font-medium">
                            {doc.niveauLibre}
                          </span>
                        )}
                      </div>
                    )}
                    {multiProvince && doc.province && doc.province !== "QC" && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[var(--color-ink-soft)] bg-[var(--color-rule)] rounded px-1.5 py-0.5">
                        🇨🇦 {doc.province}
                      </span>
                    )}
                    {doc.motsCles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.motsCles.map((mc) => (
                          <span key={mc} className="rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)]">
                            {mc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <GererDocumentsClient
                      mode="modifier"
                      multiProvince={multiProvince}
                      provincesActives={provincesActives}
                      document={{
                        id: doc.id,
                        titre: doc.titre,
                        type: doc.type,
                        contenu: doc.contenu,
                        source: doc.source ?? "",
                        auteurs: doc.auteurs ?? "",
                        annee: doc.annee ?? undefined,
                        motsCles: doc.motsCles,
                        matieres: doc.matieres,
                        niveaux: doc.niveaux,
                        actif: doc.actif,
                        province: doc.province,
                        matiereLibre: doc.matiereLibre ?? "",
                        niveauLibre: doc.niveauLibre ?? "",
                      }}
                    />
                    <SupprimerDocumentBtn documentId={doc.id} titre={doc.titre} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
