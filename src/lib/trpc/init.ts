import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type TRPCContext } from "./context";
import { logSecurityEvent } from "@/lib/security/log";
import { checkAiRateLimit as redisCheckAiRateLimit } from "@/lib/redis/rate-limit";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Procédure publique (pas d'auth requise)
export const publicProcedure = t.procedure;

// Procédure protégée (auth requise)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Procédure réservée aux enseignants (+ SUPER_ADMIN pour impersonation)
export const enseignantProcedure = protectedProcedure.use(({ ctx, next }) => {
  const { role } = ctx.session.user;
  if (role !== "ENSEIGNANT" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Procédure réservée aux spécialistes
export const specialisteProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "SPECIALISTE" && ctx.session.user.role !== "SUPER_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Procédure avec rate limiting pour les appels IA coûteux (Redis, multi-instance)
export const aiProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  try {
    await redisCheckAiRateLimit(ctx.user.id);
  } catch {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Limite atteinte : maximum 20 générations IA par heure. Réessaie plus tard.",
    });
  }
  return next({ ctx });
});

// Procédure réservée aux admins
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPER_ADMIN") {
    logSecurityEvent({
      action: "ACCES_REFUSE",
      userId: ctx.session.user.id,
      userEmail: ctx.session.user.email,
      userRole: ctx.session.user.role,
      details: { zoneVisee: "admin" },
    }).catch(() => {});
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Procédure réservée au super admin
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "SUPER_ADMIN") {
    logSecurityEvent({
      action: "ACCES_REFUSE",
      userId: ctx.session.user.id,
      userEmail: ctx.session.user.email,
      userRole: ctx.session.user.role,
      details: { zoneVisee: "super_admin" },
    }).catch(() => {});
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
