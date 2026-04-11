import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/lib/trpc/context";
import { type NextRequest } from "next/server";

// Plan Pro Vercel = 300s max. Suffisant pour les appels IA longs (~90s).
export const maxDuration = 300;

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ path, error }) => {
      // Toujours logger les erreurs — visibles dans Vercel logs en production
      console.error(
        `❌ tRPC error on ${path ?? "<no-path>"}: [${error.code}] ${error.message}`,
        error.cause ?? ""
      );
    },
  });

export { handler as GET, handler as POST };
