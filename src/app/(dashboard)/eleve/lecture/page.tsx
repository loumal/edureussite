import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { parseCosmetiques } from "@/lib/boutique/items";
import { LectureClient } from "./LectureClient";

const CANADA_PROVINCES = new Set(["QC","ON","BC","AB","SK","MB","NB","NS","PE","NL","YT","NT","NU"]);

export default async function LecturePage() {
  const { profil } = await api.eleve.getDashboard();
  if (!profil) return null;

  const province = (profil as { user?: { province?: string } }).user?.province ?? "QC";
  const estCanada = CANADA_PROVINCES.has(province);
  const cosmetiques = parseCosmetiques((profil as { cosmetiques?: unknown }).cosmetiques ?? null);

  if (!estCanada) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)]">
        <NavEleve
          prenom={profil.prenom}
          streak={profil.streakJours}
          niveauScolaire={profil.niveauScolaire}
          avatarEquipe={cosmetiques.avatarEquipe}
          province={province}
        />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-5xl mb-4">📚</p>
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Lecture quotidienne</h1>
          <p className="text-[var(--color-ink-soft)]">
            Cette fonctionnalité est disponible pour les élèves au Canada.
          </p>
        </main>
      </div>
    );
  }

  const [lectureAujourdhui, historique] = await Promise.all([
    api.eleve.getLectureAujourdhui(),
    api.eleve.getLecturesHistorique({ limit: 20 }),
  ]);

  const enFrancais = ["QC", "NB"].includes(province);

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
          lectureAujourdhui={lectureAujourdhui}
          historique={historique}
          enFrancais={enFrancais}
        />
      </main>
    </div>
  );
}
