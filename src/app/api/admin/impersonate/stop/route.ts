import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { IMPERSONATION_COOKIE, getImpersonationState } from "@/lib/auth/impersonation";
import { logSecurityEvent } from "@/lib/security/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const state = await getImpersonationState();
  if (state) {
    logSecurityEvent({
      action: "IMPERSONATION_FIN",
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      details: { wasActingAs: state.actingAs },
    }).catch(() => {});
  }

  const response = NextResponse.json({ redirectTo: "/admin" });
  response.cookies.set(IMPERSONATION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
