import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { GameRoom } from "@/components/jeux/multi/game-room";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ code: string }> }

export default async function GameRoomPage({ params }: Props) {
  await requireRole(["ELEVE"]);
  const { code } = await params;
  const { profil } = await api.eleve.getDashboard();
  if (!profil) return notFound();

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire} />
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 md:pb-8">
        <GameRoom code={code} prenom={profil.prenom} />
      </main>
    </div>
  );
}
