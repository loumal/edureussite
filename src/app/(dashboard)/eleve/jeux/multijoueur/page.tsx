import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { MultiLobby } from "@/components/jeux/multi/lobby";

export default async function MultiLobbyPage() {
  await requireRole(["ELEVE"]);
  const { profil } = await api.eleve.getDashboard();
  if (!profil) return null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <MultiLobby prenom={profil.prenom} />
      </main>
    </div>
  );
}
