import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoursInteractif } from "@/components/cours/cours-interactif";
import type { CoursStructure } from "@/lib/ai/cours";
import { NIVEAUX_LABEL, MATIERES_LABEL } from "@/lib/avatarVoices";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoursPage({ params }: Props) {
  const session = await requireRole(["ELEVE"]);
  const { id } = await params;

  let cours;
  try {
    cours = await api.cours.getCours({ id });
  } catch {
    notFound();
  }

  // Profil élève pour personnaliser la session IA
  const profil = await prisma.profilEleve.findUnique({
    where: { userId: session.user.id },
    select: {
      prenom: true,
      niveauScolaire: true,
      centresInteret: true,
      sportFavori: true,
      tdah: true,
      dyslexie: true,
      anxieteScolaire: true,
    },
  });

  const niveauLabel = profil
    ? (NIVEAUX_LABEL[profil.niveauScolaire] ?? profil.niveauScolaire)
    : "";

  const extras: string[] = [];
  if (profil?.centresInteret?.length) extras.push(`Centres d'intérêt : ${profil.centresInteret.join(", ")}`);
  if (profil?.sportFavori) extras.push(`Sport favori : ${profil.sportFavori}`);
  if (profil?.tdah) extras.push("Note : TDAH");
  if (profil?.dyslexie) extras.push("Note : dyslexie");
  if (profil?.anxieteScolaire) extras.push("Note : anxiété scolaire");

  const contenu = cours.contenu as unknown as CoursStructure;
  const matiereLabel = MATIERES_LABEL[contenu.matiere] ?? contenu.matiere;
  const subjectContext = `${matiereLabel} — ${contenu.titre}`;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/eleve"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← Tableau de bord
        </Link>
        <CoursInteractif
          coursId={id}
          cours={contenu}
          statut={cours.statut}
          prenom={profil?.prenom ?? ""}
          niveauLabel={niveauLabel}
          subjectContext={subjectContext}
          profilExtra={extras.join("\n")}
        />
      </div>
    </div>
  );
}
