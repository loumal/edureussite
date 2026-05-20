import { auth } from "./config";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { getImpersonationState } from "./impersonation";

// ── Validation mot de passe fort ──────────────────────────────────────────────
// Règles : min 10 chars, au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
export const motDePasseSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères.")
  .refine((v) => /[A-Z]/.test(v), "Le mot de passe doit contenir au moins une majuscule.")
  .refine((v) => /[a-z]/.test(v), "Le mot de passe doit contenir au moins une minuscule.")
  .refine((v) => /[0-9]/.test(v), "Le mot de passe doit contenir au moins un chiffre.")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Le mot de passe doit contenir au moins un caractère spécial (ex: !@#$%).");

// Redirige vers /login si non authentifié
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

// Redirige si le rôle n'est pas autorisé
// Vérifie aussi la suspension et le reset MDP forcé
// Un SUPER_ADMIN avec un cookie d'impersonation actif peut accéder aux pages
// du rôle simulé (ENSEIGNANT / SPECIALISTE) sans être redirigé.
export async function requireRole(roles: Role[]) {
  const session = await requireAuth();

  // Chemin normal : le rôle réel est dans la liste autorisée
  if (roles.includes(session.user.role)) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { suspended: true, forcePasswordReset: true },
    });
    if (dbUser?.suspended) redirect("/compte-suspendu");
    if (dbUser?.forcePasswordReset) redirect("/changer-password?forced=1");
    return session;
  }

  // Cas spécial : SUPER_ADMIN en mode impersonation
  if (session.user.role === "SUPER_ADMIN") {
    const impersonation = await getImpersonationState();
    if (
      impersonation &&
      impersonation.superAdminId === session.user.id &&
      roles.includes(impersonation.actingAs as Role)
    ) {
      // Pas de vérif suspension pour le super admin lui-même
      return session;
    }
  }

  redirect("/dashboard");
}

// Retourne le chemin du dashboard selon le rôle
export function getDashboardPath(role: Role): string {
  switch (role) {
    case "ELEVE":
      return "/eleve";
    case "PARENT":
      return "/parent";
    case "ENSEIGNANT":
      return "/enseignant";
    case "SPECIALISTE":
      return "/specialiste";
    case "ADMIN":
      return "/admin";
    case "SUPER_ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
