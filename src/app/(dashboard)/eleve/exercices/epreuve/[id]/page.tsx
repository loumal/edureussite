import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { EpreuveInteractive } from "@/components/exercises/epreuve-interactive";
import Link from "next/link";
import type { EpreuveGeneree } from "@/lib/ai/exercice";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EpreuvePage({ params }: Props) {
  const { id } = await params;
  await requireRole(["ELEVE"]);

  const assignation = await prisma.exerciceAssigne.findUnique({
    where: { id },
    include: {
      exercice: true,
      eleve: { select: { userId: true, prenom: true } },
    },
  });

  if (!assignation || assignation.exercice.type !== "EPREUVE_COMPLETE") notFound();

  const epreuve = assignation.exercice.contenu as unknown as EpreuveGeneree;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/eleve"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← Tableau de bord
        </Link>
        <EpreuveInteractive
          assignationId={assignation.id}
          epreuve={epreuve}
          statut={assignation.statut}
          feedbackIA={assignation.feedbackIA as Record<string, unknown> | null}
          reponsesSauvegardees={assignation.reponseEleve as Record<string, string> | null}
          prenom={assignation.eleve.prenom}
        />
      </div>
    </div>
  );
}
