export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import Link from "next/link";
import { ParametresClient } from "@/components/eleve/parametres-client";
import { ThemeSelector } from "@/components/eleve/theme-selector";
import { Card } from "@/components/ui/card";

export default async function ParametresPage() {
  await requireRole(["ELEVE"]);

  const [dashboard, profil] = await Promise.all([
    api.eleve.getDashboard(),
    api.eleve.getProfilParametres(),
  ]);

  if (!dashboard.profil || !profil) return null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={dashboard.profil.prenom} streak={dashboard.profil.streakJours} />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Link
            href="/eleve"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">⚙️ Mes paramètres</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Mets à jour ton profil pour que l'IA te connaisse encore mieux.
          </p>
        </div>

        <Card className="px-5 py-5 mb-4">
          <ThemeSelector />
        </Card>

        <ParametresClient profil={profil} />
      </main>
    </div>
  );
}
