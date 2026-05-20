import { createHmac } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma";

export type ImpersonatedRole = "ENSEIGNANT" | "SPECIALISTE";

export interface ImpersonationState {
  actingAs: ImpersonatedRole;
  superAdminId: string;
  superAdminEmail: string;
  issuedAt: number;
}

export const IMPERSONATION_COOKIE = "__impers";
const TTL_MS = 4 * 60 * 60 * 1000; // 4h

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret";
}

export function signImpersonation(state: ImpersonationState): string {
  const payload = JSON.stringify(state);
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64");
}

export function verifyImpersonation(token: string): ImpersonationState | null {
  try {
    const raw = Buffer.from(token, "base64").toString();
    const { p, s } = JSON.parse(raw) as { p: string; s: string };
    const expected = createHmac("sha256", secret()).update(p).digest("hex");
    if (s !== expected) return null;
    const state = JSON.parse(p) as ImpersonationState;
    if (Date.now() - state.issuedAt > TTL_MS) return null;
    return state;
  } catch {
    return null;
  }
}

export async function getImpersonationState(): Promise<ImpersonationState | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
    if (!token) return null;
    return verifyImpersonation(token);
  } catch {
    return null;
  }
}

export const ROLE_LABELS: Record<ImpersonatedRole, string> = {
  ENSEIGNANT: "Enseignant(e)",
  SPECIALISTE: "Spécialiste",
};

export const ROLE_PATHS: Record<ImpersonatedRole, string> = {
  ENSEIGNANT: "/enseignant",
  SPECIALISTE: "/specialiste",
};

export function isImpersonatableRole(role: string): role is ImpersonatedRole {
  return role === "ENSEIGNANT" || role === "SPECIALISTE";
}

// Returns the effective role to use for access checks.
// For SUPER_ADMIN with an active impersonation, returns the impersonated role.
// Otherwise returns the real role.
export async function getEffectiveRole(realRole: Role, userId: string): Promise<Role> {
  if (realRole !== "SUPER_ADMIN") return realRole;
  const state = await getImpersonationState();
  if (state && state.superAdminId === userId) {
    return state.actingAs as Role;
  }
  return realRole;
}
