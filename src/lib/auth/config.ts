import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { Role } from "@/generated/prisma";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";
import { logSecurityEvent, trackFailedLogin } from "@/lib/security/log";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAdapter = any;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]) as AnyAdapter,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,    // 8 heures max absolu
    updateAge: 30 * 60,      // rafraîchir le token toutes les 30 min d'activité
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        otp: { label: "Code OTP", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
            otp: z.string().length(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.password || !user.emailVerified) {
          await logSecurityEvent({ action: "CONNEXION_ECHOUEE", userEmail: parsed.data.email, details: { raison: "compte_introuvable_ou_non_verifie" } });
          await trackFailedLogin({ email: parsed.data.email });
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) {
          await logSecurityEvent({ action: "CONNEXION_ECHOUEE", userId: user.id, userEmail: user.email, userRole: user.role, details: { raison: "mot_de_passe_invalide" } });
          await trackFailedLogin({ email: user.email, userId: user.id, userRole: user.role });
          return null;
        }

        // Compte suspendu — bloquer l'accès
        if (user.suspended) {
          await logSecurityEvent({ action: "CONNEXION_COMPTE_SUSPENDU", userId: user.id, userEmail: user.email, userRole: user.role });
          return null;
        }

        // Comptes sans OTP : élèves internes + spécialistes
        const bypassOtp =
          parsed.data.email.endsWith("@edureussite.internal") ||
          user.role === "SPECIALISTE";
        if (!bypassOtp) {
          const otpValid = await verifyOtp(parsed.data.email, parsed.data.otp);
          if (!otpValid) {
            await logSecurityEvent({ action: "OTP_INVALIDE", userId: user.id, userEmail: user.email, userRole: user.role });
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
