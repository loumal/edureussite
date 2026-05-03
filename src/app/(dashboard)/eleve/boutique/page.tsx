import { Suspense } from "react";
import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { BoutiqueClient } from "@/components/boutique/boutique-client";
import { TOUS_LES_ITEMS, parseCosmetiques } from "@/lib/boutique/items";

export default async function BoutiquePage() {
  await requireRole(["ELEVE"]);
  const { profil } = await api.eleve.getDashboard();

  if (!profil) return null;

  const cosmetiques = parseCosmetiques((profil as { cosmetiques?: unknown }).cosmetiques ?? null);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire} />
      <main className="pb-24 md:pb-8">
        <Suspense fallback={null}>
          <BoutiqueClient
            initialItems={TOUS_LES_ITEMS}
            initialCosmetiques={cosmetiques}
            initialPoints={profil.totalPoints}
          />
        </Suspense>
      </main>
    </div>
  );
}
