import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";

export async function createTRPCContext() {
  const session = await auth();

  return {
    session,
    prisma,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
