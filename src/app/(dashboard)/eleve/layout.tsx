import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import type { ReactNode } from "react";

/**
 * Layout protecteur pour toutes les pages élève.
 * Force l'onboarding si le profil n'est pas complété.
 * S'applique à : /eleve, /eleve/exercices/*, /eleve/cours/*, /eleve/plan, /eleve/progression, /eleve/parametres
 */
export default async function EleveLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["ELEVE", "SUPER_ADMIN"]);

  // SUPER_ADMIN bypass l'onboarding
  if (session.user.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  const profil = await prisma.profilEleve.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });

  // Pas de profil ou onboarding incomplet → redirection obligatoire
  if (!profil || !profil.onboardingComplete) {
    redirect("/onboarding");
  }

  // pb-20 réserve l'espace pour le bottom tab bar sur mobile
  return <div className="pb-20 md:pb-0">{children}</div>;
}
