import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/changer-password",
  "/compte-suspendu",
  "/onboarding",
  "/politique-confidentialite",
  "/invitation/specialiste",
  "/partager",
  "/api/auth",
  "/api/trpc",
  "/api/admin",
  "/api/cron",
  "/icon",
];

const BLOCKED_IPS_KEY = "security:blocked_ips";

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

async function isIpBlocked(ip: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return false;
  }
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return !!(await redis.sismember(BLOCKED_IPS_KEY, ip));
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  // ── Vérification IP bloquée (Edge, avant toute autre logique) ────────────────
  const ip = getClientIp(request);
  if (ip && await isIpBlocked(ip)) {
    return new NextResponse(
      JSON.stringify({ error: "Accès refusé" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const { pathname } = request.nextUrl;

  // Page d'accueil — accessible à tous, redirige les connectés vers leur dashboard
  if (pathname === "/") {
    const session = await auth();
    if (session?.user) {
      const paths: Record<string, string> = {
        ELEVE: "/eleve",
        PARENT: "/parent",
        ENSEIGNANT: "/enseignant",
        ADMIN: "/admin",
        SUPER_ADMIN: "/admin",
      };
      return NextResponse.redirect(new URL(paths[session.user.role] ?? "/eleve", request.url));
    }
    return NextResponse.next();
  }

  // Laisser passer les routes publiques et assets
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) {
    // Déjà connecté sur /login ou /register → rediriger vers le bon dashboard
    if (pathname === "/login" || pathname === "/register") {
      const session = await auth();
      if (session?.user) {
        const paths: Record<string, string> = {
          ELEVE: "/eleve", PARENT: "/parent", ENSEIGNANT: "/enseignant",
          ADMIN: "/admin", SUPER_ADMIN: "/admin", SPECIALISTE: "/specialiste",
        };
        return NextResponse.redirect(new URL(paths[session.user.role] ?? "/eleve", request.url));
      }
    }
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier accès aux sections protégées
  const roleRoutes: Record<string, string[]> = {
    "/eleve": ["ELEVE", "ADMIN", "SUPER_ADMIN"],
    "/parent": ["PARENT", "ADMIN", "SUPER_ADMIN"],
    "/enseignant": ["ENSEIGNANT", "ADMIN", "SUPER_ADMIN"],
    "/specialiste": ["SPECIALISTE", "ADMIN", "SUPER_ADMIN"],
    "/admin": ["ADMIN", "SUPER_ADMIN"],
  };

  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(session.user.role)) {
        const paths: Record<string, string> = {
          ELEVE: "/eleve",
          PARENT: "/parent",
          ENSEIGNANT: "/enseignant",
          SPECIALISTE: "/specialiste",
          ADMIN: "/admin",
          SUPER_ADMIN: "/admin",
        };
        return NextResponse.redirect(
          new URL(paths[session.user.role] ?? "/", request.url)
        );
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
