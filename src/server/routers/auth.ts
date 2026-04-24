import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role, Province } from "@/generated/prisma";
import { createOtp, verifyOtp } from "@/lib/auth/otp";

const FR_LANGUE = new Set<string>(["QC","NB","FR","CI","SN","CM","BF","ML","BJ","TG","GA","CD","CG","GN","MG","NE","TD","CF","RW","BI","DJ","KM"]);
import { sendOtpEmail } from "@/lib/email/send-otp";
import { sendResetNotifParent } from "@/lib/email/send-reset-notif-parent";
import { TRPCError } from "@trpc/server";
import { logSecurityEvent, trackFailedLogin } from "@/lib/security/log";
import { checkOtpRateLimit as redisCheckOtpRateLimit } from "@/lib/redis/rate-limit";
import { motDePasseSchema } from "@/lib/auth/utils";

// ── Rate limiter OTP — Redis (persistant multi-instances) ─────────────────────
async function checkOtpRateLimit(email: string): Promise<void> {
  try {
    await redisCheckOtpRateLimit(email);
  } catch {
    logSecurityEvent({ action: "SPAM_OTP", userEmail: email, details: { fenetreMin: 15 } }).catch(() => {});
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Trop de tentatives. Réessayez dans 15 minutes.",
    });
  }
}

export const authRouter = createTRPCRouter({
  // ─── Inscription ────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: motDePasseSchema,
        role: z.enum([Role.PARENT, Role.ENSEIGNANT]).default(Role.PARENT),
        prenom: z.string().min(1),
        nom: z.string().min(1),
        province: z.nativeEnum(Province).default("QC"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un compte avec cet email existe déjà.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: `${input.prenom} ${input.nom}`,
          role: input.role,
          province: input.province,
          langueInterface: FR_LANGUE.has(input.province) ? "FR" : "EN",
        },
      });

      // Créer le profil selon le rôle
      if (input.role === "PARENT") {
        await ctx.prisma.profilParent.create({
          data: { userId: user.id, prenom: input.prenom, nom: input.nom },
        });
      } else if (input.role === "ENSEIGNANT") {
        await ctx.prisma.profilEnseignant.create({
          data: { userId: user.id, prenom: input.prenom, nom: input.nom },
        });
      }

      // Envoyer le code de vérification
      const otp = await createOtp(input.email);
      await sendOtpEmail(input.email, otp, "verification");

      return { success: true, email: input.email };
    }),

  // ─── Vérification du courriel (après inscription) ───────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ email: z.string().email(), otp: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const valid = await verifyOtp(input.email, input.otp);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code invalide ou expiré. Réessayez.",
        });
      }

      await ctx.prisma.user.update({
        where: { email: input.email },
        data: { emailVerified: new Date() },
      });

      return { success: true };
    }),

  // ─── Initiation de connexion (étape 1 — envoie l'OTP) ──────────────────────
  initiateLogin: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      checkOtpRateLimit(input.email);

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      // On ne révèle pas si l'email existe ou non
      if (!user?.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        await logSecurityEvent({ action: "CONNEXION_ECHOUEE", userId: user.id, userEmail: user.email, userRole: user.role, details: { raison: "mot_de_passe_invalide", etape: "initiateLogin" } });
        await trackFailedLogin({ email: user.email, userId: user.id, userRole: user.role });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      if (!user.emailVerified) {
        // Renvoyer un code de vérification si le compte n'est pas vérifié
        const otp = await createOtp(input.email);
        await sendOtpEmail(input.email, otp, "verification");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "EMAIL_NOT_VERIFIED",
        });
      }

      const otp = await createOtp(input.email);
      await sendOtpEmail(input.email, otp, "login");

      return { success: true };
    }),

  // ─── Connexion élève par code d'accès (sans email ni OTP) ─────────────────
  // Utilisé par les enfants créés par un parent (pas de vrai email)
  loginEleve: publicProcedure
    .input(z.object({ codeAcces: z.string().min(1).transform((s) => s.trim()), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { codeAcces: input.codeAcces },
        include: { user: true },
      });

      if (!profil?.user?.password) {
        await logSecurityEvent({ action: "CONNEXION_ELEVE_ECHOUEE", details: { raison: "code_acces_introuvable", codeAcces: input.codeAcces } });
        await trackFailedLogin({ email: null });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Code d'accès ou mot de passe incorrect." });
      }

      const isValid = await bcrypt.compare(input.password, profil.user.password);
      if (!isValid) {
        await logSecurityEvent({ action: "CONNEXION_ELEVE_ECHOUEE", userId: profil.user.id, userEmail: profil.user.email, details: { raison: "mot_de_passe_invalide" } });
        await trackFailedLogin({ email: profil.user.email, userId: profil.user.id });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Code d'accès ou mot de passe incorrect." });
      }

      // Retourne l'email interne pour que le client puisse appeler signIn
      return { email: profil.user.email };
    }),

  // ─── Demande de réinitialisation de mot de passe (adultes) ────────────────
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      checkOtpRateLimit(input.email);
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      // Silencieux — ne révèle pas si l'email existe
      if (user?.emailVerified) {
        const otp = await createOtp(input.email);
        await sendOtpEmail(input.email, otp, "reset");
        await logSecurityEvent({ action: "DEMANDE_RESET_MDP", userId: user.id, userEmail: user.email, userRole: user.role });
      }
      return { success: true };
    }),

  // ─── Confirmation de réinitialisation de mot de passe ─────────────────────
  confirmPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
      otp: z.string().length(6),
      newPassword: motDePasseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const valid = await verifyOtp(input.email, input.otp);
      if (!valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code invalide ou expiré. Réessayez." });
      }
      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      const updated = await ctx.prisma.user.update({
        where: { email: input.email },
        data: { password: hashedPassword },
        select: { id: true, role: true },
      });
      return { success: true };
    }),

  // ─── Demande de réinitialisation pour un élève (notifie le parent) ────────
  requestChildPasswordReset: publicProcedure
    .input(z.object({ codeAcces: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { codeAcces: input.codeAcces },
        include: {
          parents: {
            include: { user: true },
          },
        },
      });
      if (!profil) return { success: true };

      const parent = profil.parents[0];
      if (!parent?.user?.email) return { success: true };

      const prenomParent = (parent as { prenom?: string }).prenom ?? "Parent";
      await sendResetNotifParent(
        parent.user.email,
        prenomParent,
        profil.prenom,
        profil.codeAcces ?? input.codeAcces
      );
      return { success: true };
    }),

  // ─── Changer le mot de passe (après reset forcé par admin) ───────────────
  changerMotDePasse: protectedProcedure
    .input(z.object({ nouveauMotDePasse: motDePasseSchema }))
    .mutation(async ({ ctx, input }) => {
      const hashed = await bcrypt.hash(input.nouveauMotDePasse, 12);
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { password: hashed, forcePasswordReset: false },
      });
      return { success: true };
    }),

  // ─── Renvoi d'OTP ──────────────────────────────────────────────────────────
  resendOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        purpose: z.enum(["verification", "login"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkOtpRateLimit(input.email);

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) {
        // Silencieux pour ne pas révéler si l'email existe
        return { success: true };
      }

      const otp = await createOtp(input.email);
      await sendOtpEmail(input.email, otp, input.purpose);

      return { success: true };
    }),

  // ─── Feature flags publics (utilisés avant connexion) ──────────────────────
  getPublicFeatureFlags: publicProcedure.query(async ({ ctx }) => {
    const params = await ctx.prisma.parametreApp.findMany({
      where: { cle: { startsWith: "feature:" } },
    });
    const flags: Record<string, string> = {};
    for (const p of params) flags[p.cle] = p.valeur;

    const multiProvince = flags["feature:multi_province"] === "true";

    const provincesActives: Record<string, boolean> = {};
    for (const code of Object.values(Province)) {
      provincesActives[code] = code === "QC" ? true : (flags[`feature:province_active:${code}`] === "true");
    }

    return { multiProvince, provincesActives };
  }),
});
