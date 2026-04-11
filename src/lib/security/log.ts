import { prisma } from "@/lib/prisma/client";
import { getRedis } from "@/lib/redis/client";

// ── Types d'événements de sécurité ────────────────────────────────────────────
// Seuls les événements pertinents pour la surveillance des cyberattaques
// sont conservés. Les événements d'activité normale (connexion réussie,
// inscription, reset confirmé…) ne sont pas loggués.

export type SecurityAction =
  // Authentification — échecs & anomalies
  | "CONNEXION_ECHOUEE"
  | "CONNEXION_ELEVE_ECHOUEE"
  | "OTP_INVALIDE"
  | "SPAM_OTP"
  | "CONNEXION_COMPTE_SUSPENDU"
  // Attaques détectées
  | "FORCE_BRUTE_DETECTEE"
  // Réinitialisation de mot de passe
  | "DEMANDE_RESET_MDP"
  | "MOT_DE_PASSE_REINITIALISE"
  // Accès non autorisé
  | "ACCES_REFUSE"
  // Actions admin critiques — modifications de privilèges
  | "ROLE_MODIFIE"
  | "UTILISATEUR_SUPPRIME"
  | "SUPER_ADMIN_CREE"
  // Gestion des comptes — sécurité
  | "COMPTE_SUSPENDU"
  | "COMPTE_REACTIVE"
  | "RESET_MDP_FORCE"
  | "ALERTE_SECURITE_ENVOYEE"
  // Contrôle réseau
  | "IP_BLOQUEE"
  | "IP_DEBLOQUEE";

const SEVERITY_MAP: Record<SecurityAction, "INFO" | "WARNING" | "CRITICAL"> = {
  // Échecs d'authentification — signal d'attaque potentielle
  CONNEXION_ECHOUEE:          "WARNING",
  CONNEXION_ELEVE_ECHOUEE:    "WARNING",
  OTP_INVALIDE:               "WARNING",
  SPAM_OTP:                   "CRITICAL",   // DoS / credential stuffing actif
  CONNEXION_COMPTE_SUSPENDU:  "CRITICAL",   // Tentative sur compte connu compromis
  // Attaque confirmée
  FORCE_BRUTE_DETECTEE:       "CRITICAL",
  // Réinitialisation
  DEMANDE_RESET_MDP:          "WARNING",
  MOT_DE_PASSE_REINITIALISE:  "WARNING",
  // Accès
  ACCES_REFUSE:               "CRITICAL",   // Escalade de privilèges / scan
  // Modifications critiques de privilèges
  ROLE_MODIFIE:               "CRITICAL",
  UTILISATEUR_SUPPRIME:       "CRITICAL",
  SUPER_ADMIN_CREE:           "CRITICAL",
  // Sécurité des comptes
  COMPTE_SUSPENDU:            "CRITICAL",
  COMPTE_REACTIVE:            "WARNING",
  RESET_MDP_FORCE:            "WARNING",
  ALERTE_SECURITE_ENVOYEE:    "WARNING",
  // Réseau
  IP_BLOQUEE:                 "CRITICAL",
  IP_DEBLOQUEE:               "WARNING",
};

export async function logSecurityEvent({
  action,
  userId,
  userEmail,
  userRole,
  cibleId,
  cibleEmail,
  ip,
  details,
}: {
  action: SecurityAction;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  cibleId?: string | null;
  cibleEmail?: string | null;
  ip?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.securityLog.create({
      data: {
        action,
        severity: SEVERITY_MAP[action],
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        userRole: userRole ?? null,
        cibleId: cibleId ?? null,
        cibleEmail: cibleEmail ?? null,
        ip: ip ?? null,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch {
    // Ne jamais bloquer l'opération principale si le log échoue
  }
}

// ── Détection de force brute (Redis + fallback mémoire) ───────────────────────
// Fenêtre glissante de 10 minutes par compte (email) et par IP.
// Redis persisté cross-instances sur Vercel. Fallback mémoire en dev local.

const BRUTE_WINDOW_SECS       = 10 * 60; // 10 minutes (TTL Redis)
const BRUTE_THRESHOLD_ACCOUNT = 5;
const BRUTE_THRESHOLD_IP      = 10;

// ── Fallback mémoire ──────────────────────────────────────────────────────────
type BruteEntry = { count: number; resetAt: number; logged: boolean };
const failuresByEmail = new Map<string, BruteEntry>();
const failuresByIp    = new Map<string, BruteEntry>();

function bumpMemory(map: Map<string, BruteEntry>, key: string, threshold: number): boolean {
  const now = Date.now();
  let entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + BRUTE_WINDOW_SECS * 1000, logged: false };
    map.set(key, entry);
    return false;
  }
  entry.count += 1;
  if (entry.count >= threshold && !entry.logged) {
    entry.logged = true;
    return true;
  }
  return false;
}

// ── Incrément Redis avec TTL glissant ─────────────────────────────────────────
async function bumpRedis(key: string, threshold: number): Promise<{ triggered: boolean; count: number }> {
  const redis = getRedis();
  if (!redis) return { triggered: false, count: 0 };

  const count = await redis.incr(key);
  if (count === 1) {
    // Première entrée — poser le TTL
    await redis.expire(key, BRUTE_WINDOW_SECS);
  }
  return { triggered: count === threshold, count };
}

/**
 * À appeler après chaque échec d'authentification.
 * Logue automatiquement FORCE_BRUTE_DETECTEE si le seuil est franchi.
 */
export async function trackFailedLogin({
  email,
  ip,
  userId,
  userRole,
}: {
  email?: string | null;
  ip?: string | null;
  userId?: string | null;
  userRole?: string | null;
}) {
  const redis = getRedis();
  const promises: Promise<void>[] = [];

  if (email) {
    let triggered = false;
    let count = 0;

    if (redis) {
      const result = await bumpRedis(`bf:email:${email}`, BRUTE_THRESHOLD_ACCOUNT);
      triggered = result.triggered;
      count = result.count;
    } else {
      triggered = bumpMemory(failuresByEmail, email, BRUTE_THRESHOLD_ACCOUNT);
      count = failuresByEmail.get(email)?.count ?? BRUTE_THRESHOLD_ACCOUNT;
    }

    if (triggered) {
      promises.push(logSecurityEvent({
        action: "FORCE_BRUTE_DETECTEE",
        userId,
        userEmail: email,
        userRole,
        ip,
        details: { cible: "compte", echecs: count, fenetre_min: 10 },
      }));
    }
  }

  if (ip) {
    let triggered = false;
    let count = 0;

    if (redis) {
      const result = await bumpRedis(`bf:ip:${ip}`, BRUTE_THRESHOLD_IP);
      triggered = result.triggered;
      count = result.count;
    } else {
      triggered = bumpMemory(failuresByIp, ip, BRUTE_THRESHOLD_IP);
      count = failuresByIp.get(ip)?.count ?? BRUTE_THRESHOLD_IP;
    }

    if (triggered) {
      promises.push(logSecurityEvent({
        action: "FORCE_BRUTE_DETECTEE",
        userId: null,
        userEmail: email ?? null,
        userRole: null,
        ip,
        details: { cible: "ip", echecs: count, fenetre_min: 10 },
      }));
    }
  }

  await Promise.all(promises);
}
