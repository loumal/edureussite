import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { ConsentementPartageClient } from "./_components/consentement-partage-client";

const DOMAINE_LABELS: Record<string, { fr: string; en: string; icon: string; description: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", en: "Neuropsychologist", icon: "🧠", description: "évalue l'attention, la mémoire, les fonctions exécutives et le traitement de l'information" },
  ORTHOPEDAGOGUE:  { fr: "Orthopédagogue",   en: "Learning Specialist", icon: "📚", description: "soutient les difficultés en lecture, écriture et mathématiques" },
  ORTHOPHONISTE:   { fr: "Orthophoniste",    en: "Speech-Language Pathologist", icon: "🗣️", description: "évalue la communication orale, la phonologie et le langage écrit" },
  ERGOTHERAPEUTE:  { fr: "Ergothérapeute",   en: "Occupational Therapist", icon: "✋", description: "évalue la motricité fine, le traitement sensoriel et l'autonomie scolaire" },
  OPTOMETRISTE:    { fr: "Optométriste",     en: "Optometrist", icon: "👁️", description: "évalue la vision fonctionnelle et le confort visuel en lecture" },
  PSYCHOEDUCATEUR: { fr: "Psychoéducateur",  en: "Psychoeducator", icon: "💬", description: "soutient la motivation, l'adaptation sociale et le comportement scolaire" },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConsentementPartagePage({ params }: Props) {
  const { token } = await params;

  const evaluation = await prisma.evaluationRequest.findUnique({
    where: { tokenConsentementPartage: token },
    include: {
      eleve: { select: { prenom: true, nom: true, niveauScolaire: true } },
      rapports: {
        where: { type: "DETAIL", langue: "fr" },
        take: 1,
        select: { generatedAt: true },
      },
    },
  });

  if (!evaluation) notFound();

  const domaineActuel = DOMAINE_LABELS[evaluation.primarySpecialist];
  const prochainDomaine = evaluation.nextSpecialist ? DOMAINE_LABELS[evaluation.nextSpecialist] : null;

  if (!prochainDomaine || !evaluation.nextSpecialist) notFound();

  const alreadyDecided = evaluation.consentementPartage || evaluation.consentementPartageRefuse;
  const rapportDate = evaluation.rapports[0]?.generatedAt;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Header */}
      <div className="border-b border-[var(--color-rule)] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">✦ Édu-Réussite QC</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Consentement — Partage de données
            </p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] hidden sm:block">Confidentiel</p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <ConsentementPartageClient
          token={token}
          prenomEnfant={evaluation.eleve.prenom}
          nomEnfant={evaluation.eleve.nom}
          niveauScolaire={evaluation.eleve.niveauScolaire}
          domaineActuel={{
            code: evaluation.primarySpecialist,
            fr: domaineActuel?.fr ?? evaluation.primarySpecialist,
            en: domaineActuel?.en ?? evaluation.primarySpecialist,
            icon: domaineActuel?.icon ?? "🔬",
            description: domaineActuel?.description ?? "",
          }}
          prochainDomaine={{
            code: evaluation.nextSpecialist,
            fr: prochainDomaine.fr,
            en: prochainDomaine.en,
            icon: prochainDomaine.icon,
            description: prochainDomaine.description,
          }}
          alreadyDecided={alreadyDecided}
          decisionPrise={evaluation.consentementPartage ? "ACCEPTED" : evaluation.consentementPartageRefuse ? "REFUSED" : null}
          rapportDate={rapportDate?.toISOString() ?? null}
        />
      </main>
    </div>
  );
}
