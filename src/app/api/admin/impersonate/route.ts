import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  signImpersonation,
  IMPERSONATION_COOKIE,
  ROLE_PATHS,
  isImpersonatableRole,
  type ImpersonatedRole,
} from "@/lib/auth/impersonation";
import { logSecurityEvent } from "@/lib/security/log";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { role, targetUserId } = body as { role?: string; targetUserId?: string };

  let actingAs: ImpersonatedRole;
  let resolvedTargetUserId: string | undefined;
  let targetUserName: string | undefined;

  if (targetUserId) {
    // ── Impersonation ciblée : on simule un utilisateur réel avec ses données ──
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        name: true,
        profilEleve: { select: { prenom: true, nom: true } },
        profilParent: { select: { prenom: true, nom: true } },
        profilEnseignant: { select: { prenom: true, nom: true } },
      },
    });

    if (!user || !isImpersonatableRole(user.role)) {
      return NextResponse.json(
        { error: "Utilisateur introuvable ou rôle non impersonnable" },
        { status: 400 }
      );
    }

    actingAs = user.role as ImpersonatedRole;
    resolvedTargetUserId = user.id;

    if (user.profilEleve) {
      targetUserName = `${user.profilEleve.prenom} ${user.profilEleve.nom}`;
    } else if (user.profilParent) {
      targetUserName = `${user.profilParent.prenom} ${user.profilParent.nom}`;
    } else if (user.profilEnseignant) {
      targetUserName = `${user.profilEnseignant.prenom} ${user.profilEnseignant.nom}`;
    } else {
      targetUserName = user.name ?? undefined;
    }
  } else if (role && isImpersonatableRole(role)) {
    // ── Impersonation générique : vue UI du rôle sans données réelles ──
    actingAs = role;
  } else {
    return NextResponse.json(
      { error: "Paramètre manquant : fournir role ou targetUserId" },
      { status: 400 }
    );
  }

  const token = signImpersonation({
    actingAs,
    superAdminId: session.user.id,
    superAdminEmail: session.user.email,
    issuedAt: Date.now(),
    targetUserId: resolvedTargetUserId,
    targetUserName,
  });

  logSecurityEvent({
    action: "IMPERSONATION_DEBUT",
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
    details: { actingAs, targetUserId: resolvedTargetUserId, targetUserName },
  }).catch(() => {});

  const response = NextResponse.json({ redirectTo: ROLE_PATHS[actingAs] });
  response.cookies.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 4 * 60 * 60,
    path: "/",
  });
  return response;
}
