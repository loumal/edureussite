import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { getImpersonationState } from "@/lib/auth/impersonation";

export async function createTRPCContext() {
  const session = await auth();

  // Quand un SUPER_ADMIN impersonne un utilisateur précis (avec targetUserId dans le cookie),
  // toutes les procédures tRPC utiliseront cet ID à la place du sien.
  // Cela évite de modifier les 60+ procédures individuellement.
  let effectiveUserId: string | null = session?.user.id ?? null;

  if (session?.user.role === "SUPER_ADMIN") {
    const impersonation = await getImpersonationState();
    if (
      impersonation &&
      impersonation.superAdminId === session.user.id &&
      impersonation.targetUserId
    ) {
      effectiveUserId = impersonation.targetUserId;
    }
  }

  return {
    session,
    prisma,
    effectiveUserId,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
