import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { parseCosmetiques } from "@/lib/boutique/items";
import { LectureClient } from "./LectureClient";

export default async function LecturePage() {
  const { profil } = await api.eleve.getDashboard();
  if (!profil) return null;

  const province = (profil as { user?: { province?: string } }).user?.province ?? "QC";
  const cosmetiques = parseCosmetiques((profil as { cosmetiques?: unknown }).cosmetiques ?? null);

  const [sessionActive, historique] = await Promise.all([
    api.eleve.getSessionLectureActive(),
    api.eleve.getHistoriqueSessionsLecture({ limit: 15 }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve
        prenom={profil.prenom}
        streak={profil.streakJours}
        niveauScolaire={profil.niveauScolaire}
        avatarEquipe={cosmetiques.avatarEquipe}
        province={province}
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <LectureClient
          sessionActive={sessionActive as never}
          historique={historique as never}
          prenom={profil.prenom}
          niveauScolaire={profil.niveauScolaire}
        />
      </main>
    </div>
  );
}
