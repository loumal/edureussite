import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import Link from "next/link";

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

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖",
  MATHEMATIQUES: "🔢",
  SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍",
  ARTS: "🎨",
  ANGLAIS: "🇬🇧",
  EDUCATION_PHYSIQUE: "⚽",
  ETHIQUE: "🤝",
};

const SOURCE_LABEL: Record<string, string> = {
  MEES_OFFICIEL: "MEES Officiel",
  COMMISSION_SCOLAIRE: "Commission scolaire",
  MANUEL_SCOLAIRE: "Manuel scolaire",
  AUTRE: "Autre",
};

type PageProps = { searchParams: Promise<{ filtre?: string; type?: string }> };

export default async function EpreuvesPage({ searchParams }: PageProps) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { filtre, type } = await searchParams;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const valideFilter = filtre === "valides" ? true : filtre === "attente" ? false : undefined;
  const typeFilter = type === "CONSOLIDATION" ? "CONSOLIDATION" : type === "EPREUVE_COMPLETE" ? "EPREUVE_COMPLETE" : undefined;

  const { items, total } = await api.admin.listerEpreuves({
    ...(valideFilter !== undefined ? { valide: valideFilter } : {}),
    ...(typeFilter ? { typeModele: typeFilter as "CONSOLIDATION" | "EPREUVE_COMPLETE" } : {}),
  });

  const { total: totalValides } = await api.admin.listerEpreuves({ valide: true });
  const { total: totalAttente } = await api.admin.listerEpreuves({ valide: false });
  const { total: totalEpreuves } = await api.admin.listerEpreuves({ typeModele: "EPREUVE_COMPLETE" });
  const { total: totalConsolidations } = await api.admin.listerEpreuves({ typeModele: "CONSOLIDATION" });

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              Bibliothèque de modèles 📋
            </h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {total} modèle{total > 1 ? "s" : ""}
              {filtre === "valides" ? " validés" : filtre === "attente" ? " en attente" : ` · ${totalValides} validé${totalValides > 1 ? "s" : ""} · ${totalAttente} en attente`}
              {" · "}{totalEpreuves} épreuve{totalEpreuves > 1 ? "s" : ""} · {totalConsolidations} consolidation{totalConsolidations > 1 ? "s" : ""}
            </p>
          </div>
          {isSuperAdmin && (
            <Link
              href="/admin/epreuves/nouveau"
              className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              + Nouveau modèle
            </Link>
          )}
        </div>

        {/* Onglets filtre type */}
        <div className="flex items-center gap-2 mb-3">
          {[
            { label: "Tous les modèles", typeVal: "" },
            { label: `📋 Épreuves (${totalEpreuves})`, typeVal: "EPREUVE_COMPLETE" },
            { label: `📝 Consolidations (${totalConsolidations})`, typeVal: "CONSOLIDATION" },
          ].map((tab) => {
            const isActif = (type ?? "") === tab.typeVal;
            const href = [
              tab.typeVal ? `type=${tab.typeVal}` : "",
              filtre ? `filtre=${filtre}` : "",
            ].filter(Boolean).join("&");
            return (
              <Link
                key={tab.typeVal}
                href={href ? `/admin/epreuves?${href}` : "/admin/epreuves"}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActif
                    ? "bg-[var(--color-purple)] text-white"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Onglets filtre validation */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { label: "Tous statuts", value: "" },
            { label: `✓ Validés (${totalValides})`, value: "valides" },
            { label: `⏳ En attente (${totalAttente})`, value: "attente" },
          ].map((tab) => {
            const isActif = (filtre ?? "") === tab.value;
            const href = [
              tab.value ? `filtre=${tab.value}` : "",
              type ? `type=${type}` : "",
            ].filter(Boolean).join("&");
            return (
              <Link
                key={tab.value}
                href={href ? `/admin/epreuves?${href}` : "/admin/epreuves"}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActif
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">
              Aucun modèle
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mx-auto mb-6">
              Ajoutez des épreuves complètes et des consolidations pour que l'IA génère des exercices
              alignés sur les formats officiels du MEES et des commissions scolaires.
            </p>
            {isSuperAdmin && (
              <Link
                href="/admin/epreuves/nouveau"
                className="inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Ajouter le premier modèle
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((epreuve) => (
              <Link
                key={epreuve.id}
                href={`/admin/epreuves/${epreuve.id}`}
                className="block"
              >
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-paper-warm)] text-2xl flex-shrink-0">
                      {MATIERE_EMOJI[epreuve.matiere] ?? "📄"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[var(--color-ink)] line-clamp-1">
                              {epreuve.titre}
                            </h3>
                            {(epreuve as { typeModele?: string }).typeModele === "CONSOLIDATION" && (
                              <span className="rounded-full bg-[rgba(91,79,207,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-purple)] flex-shrink-0">
                                📝 Consolidation
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                            {MATIERE_LABEL[epreuve.matiere] ?? epreuve.matiere} ·{" "}
                            {epreuve.niveauScolaire.replace(/_/g, " ")} ·{" "}
                            {SOURCE_LABEL[epreuve.source] ?? epreuve.source}
                            {epreuve.annee ? ` · ${epreuve.annee}` : ""}
                            {(epreuve as { notion?: string }).notion ? ` · ${(epreuve as { notion?: string }).notion}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {epreuve.valide ? (
                            <Badge variant="success">✓ Validé</Badge>
                          ) : (
                            <Badge variant="accent">En attente</Badge>
                          )}
                        </div>
                      </div>

                      {epreuve.description && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-2 line-clamp-1">
                          {epreuve.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-[var(--color-ink-soft)]">
                          📐 {epreuve.sections.length} section{epreuve.sections.length > 1 ? "s" : ""}
                        </span>
                        {epreuve.totalPoints && (
                          <span className="text-xs text-[var(--color-ink-soft)]">
                            🏆 {epreuve.totalPoints} pts
                          </span>
                        )}
                        {epreuve.dureeMinutes && (
                          <span className="text-xs text-[var(--color-ink-soft)]">
                            ⏱ {epreuve.dureeMinutes} min
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-ink-soft)] ml-auto">
                          {new Date(epreuve.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
