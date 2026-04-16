import { requireAuth } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const session = await requireAuth();

  if (session.user.role !== "ELEVE") {
    redirect("/");
  }

  const [profil, user] = await Promise.all([
    prisma.profilEleve.findUnique({
      where: { userId: session.user.id },
      select: {
        onboardingComplete: true,
        onboardingEtape: true,
        prenom: true,
        nom: true,
        niveauScolaire: true,
        ecole: true,
        parents: { select: { id: true }, take: 1 },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { province: true },
    }),
  ]);

  if (profil?.onboardingComplete) {
    redirect("/eleve");
  }

  const profilExistant = profil ? {
    prenom: profil.prenom,
    nom: profil.nom ?? "",
    niveauScolaire: profil.niveauScolaire,
    ecole: profil.ecole ?? "",
    compteParParent: (profil.parents?.length ?? 0) > 0,
  } : undefined;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <OnboardingFlow
        etapeInitiale={profil?.onboardingEtape ?? 0}
        profilExistant={profilExistant}
        province={user?.province ?? "QC"}
      />
    </div>
  );
}
