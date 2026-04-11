import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { ExerciceInteractif } from "@/components/exercises/exercice-interactif";
import { FeedbackPanel } from "@/components/exercises/feedback-panel";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExercicePage({ params }: Props) {
  const { id } = await params;
  await requireRole(["ELEVE"]);

  const assignation = await prisma.exerciceAssigne.findUnique({
    where: { id },
    include: {
      exercice: true,
      eleve: {
        select: {
          id: true, userId: true, prenom: true, styleApprentissage: true,
          objectifsNotes: {
            where: { actif: true, atteint: true },
            select: { matiere: true, scoreVise: true, atteint: true },
          },
        },
      },
    },
  });

  if (!assignation) notFound();

  // Si déjà terminé, afficher le feedback
  if (assignation.statut === "TERMINE") {
    const matiere = assignation.exercice.matiere;

    // Objectif de note atteint pour cette matière ?
    const objectifAtteint = assignation.eleve.objectifsNotes.find(
      (o) => o.matiere === matiere && o.atteint
    ) ?? null;

    // Notion active du plan pour cette matière (pour permettre d'avancer)
    const planNotionActive = await prisma.planifNotionEleve.findFirst({
      where: {
        eleveId: assignation.eleve.id,
        matiere,
        maitrisee: false,
        priorite: { not: "MAITRISE" },
      },
      orderBy: { ordre: "asc" },
      select: { id: true, notion: true, matiere: true },
    });

    return (
      <div className="min-h-screen bg-[var(--color-paper)]">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link
            href="/eleve"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Tableau de bord
          </Link>
          <FeedbackPanel
            assignation={assignation}
            exercice={assignation.exercice}
            objectifAtteint={objectifAtteint}
            planNotionActive={planNotionActive}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/eleve"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← Tableau de bord
        </Link>
        <ExerciceInteractif assignation={assignation} exercice={assignation.exercice} />
      </div>
    </div>
  );
}
