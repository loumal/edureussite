import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  signImpersonation,
  IMPERSONATION_COOKIE,
  ROLE_PATHS,
  isImpersonatableRole,
} from "@/lib/auth/impersonation";
import { logSecurityEvent } from "@/lib/security/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { role } = body as { role?: string };

  if (!role || !isImpersonatableRole(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const token = signImpersonation({
    actingAs: role,
    superAdminId: session.user.id,
    superAdminEmail: session.user.email,
    issuedAt: Date.now(),
  });

  logSecurityEvent({
    action: "IMPERSONATION_DEBUT",
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
    details: { actingAs: role },
  }).catch(() => {});

  const response = NextResponse.json({ redirectTo: ROLE_PATHS[role] });
  response.cookies.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 4 * 60 * 60,
    path: "/",
  });
  return response;
}
