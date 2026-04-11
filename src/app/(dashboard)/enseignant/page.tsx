import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEnseignant } from "@/components/layout/nav-enseignant";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { EnseignantDashboardClient } from "@/components/enseignant/dashboard-client";

export default async function EnseignantDashboardPage() {
  await requireRole(["ENSEIGNANT", "ADMIN"]);

  const [{ profil, eleves, total }, { analyses }] = await Promise.all([
    api.enseignant.getDashboard(),
    api.enseignant.getAnalyseClasse(),
  ]);

  const nomAffiche = profil
    ? `${profil.prenom} ${profil.nom}`
    : "Enseignant(e)";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <WelcomeTour role="enseignant" prenom={profil?.prenom ?? ""} />
      <NavEnseignant nom={nomAffiche} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <EnseignantDashboardClient eleves={eleves} total={total} analyses={analyses} />
      </main>
    </div>
  );
}
