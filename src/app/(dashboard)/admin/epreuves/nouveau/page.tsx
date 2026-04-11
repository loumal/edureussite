import { requireRole } from "@/lib/auth/utils";
import { NavAdmin } from "@/components/layout/nav-admin";
import { NouveauEpreuveForm } from "@/components/admin/nouveau-epreuve-form";

export default async function NouveauEpreuvePage() {
  const session = await requireRole(["SUPER_ADMIN"]);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            Nouveau modèle d'épreuve 📥
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Collez le contenu d'une épreuve — Claude analysera sa structure sans reproduire le contenu.
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-4">
          <p className="text-sm font-semibold text-[var(--color-success)] mb-1">
            🔒 Garde-fou anti-plagiat
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            L'IA extrait uniquement la <strong>structure</strong> (types de questions, sections, barème,
            compétences PFEQ). Aucun contenu original n'est reproduit. Les exercices générés à partir de
            ce modèle seront entièrement nouveaux, inspirés du format uniquement.
          </p>
        </div>

        <NouveauEpreuveForm />
      </main>
    </div>
  );
}
