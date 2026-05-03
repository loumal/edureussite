import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { getJeuById } from "@/lib/jeux/catalog";
import { JeuPlayer } from "@/components/jeux/jeu-player";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demandeId?: string }>;
}

export default async function JeuPage({ params, searchParams }: PageProps) {
  await requireRole(["ELEVE"]);
  const { id } = await params;
  const { demandeId } = await searchParams;

  const jeu = getJeuById(id);
  if (!jeu) return notFound();

  const { profil } = await api.eleve.getDashboard();
  if (!profil) return notFound();

  if (demandeId) {
    const demande = await api.eleve.getStatutDemande({ demandeId });

    if (demande.statut === "AUTORISE" || demande.statut === "EN_COURS") {
      return (
        <div className="min-h-screen bg-[var(--color-paper)]">
          <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire ?? undefined} />
          <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
            <div className="mb-4 flex items-center gap-3">
              <Link href="/eleve/boutique?onglet=jeux" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] text-sm">← Retour</Link>
              <span className="text-xl">{jeu.emoji}</span>
              <h1 className="text-xl font-black text-[var(--color-ink)]">{jeu.nom}</h1>
            </div>
            <JeuPlayer jeu={jeu} demandeId={demandeId} minutesAccordees={demande.minutesAccordees} />
          </main>
        </div>
      );
    }

    if (demande.statut === "TERMINE") {
      return (
        <div className="min-h-screen bg-[var(--color-paper)]">
          <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire ?? undefined} />
          <main className="max-w-md mx-auto px-4 py-20 text-center">
            <p className="text-6xl mb-4">✅</p>
            <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">Session terminée</h1>
            <p className="text-[var(--color-ink-soft)] mb-6">Cette session de jeu est déjà terminée.</p>
            <Link href="/eleve/boutique?onglet=jeux" className="rounded-2xl bg-[var(--color-ink)] text-white px-6 py-3 font-bold hover:opacity-80 transition-opacity">
              ← Retour aux jeux
            </Link>
          </main>
        </div>
      );
    }
  }

  // No valid demandeId — redirect to boutique
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire ?? undefined} />
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">{jeu.emoji}</p>
        <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">{jeu.nom}</h1>
        <p className="text-[var(--color-ink-soft)] mb-6">{jeu.description}</p>
        <Link href="/eleve/boutique?onglet=jeux" className="rounded-2xl bg-[var(--color-purple)] text-white px-6 py-3 font-bold hover:opacity-90 transition-opacity">
          Aller à la boutique
        </Link>
      </main>
    </div>
  );
}
