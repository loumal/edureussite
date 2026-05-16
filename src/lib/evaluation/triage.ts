import { prisma } from "@/lib/prisma/client";
import { DomaineSpecialiste } from "@/generated/prisma";

// ── Seuils de déclenchement ────────────────────────────────────────────────
const SEUIL_NOTIONS_ECHEC = 3;      // ≥ 3 notions non maîtrisées
const SEUIL_SCORE_FAIBLE = 0.40;    // scoreGlobal < 40 % sur les matières en échec
const SEUIL_SEMAINES = 4;           // sur ≥ 4 semaines consécutives d'activité
const SEUIL_PROGRESSION_NULLE = 14; // score stable/baisse sur 14 jours

export interface TriageResult {
  shouldTrigger: boolean;
  primarySpecialist: DomaineSpecialiste;
  scores: Record<DomaineSpecialiste, number>;
  evidence: {
    signals: string[];
    dataPoints: Record<string, number | string>;
  };
}

/**
 * Analyse les données de l'élève et détermine si une évaluation doit être
 * déclenchée, et quel spécialiste doit intervenir en premier.
 */
export async function runTriage(eleveId: string): Promise<TriageResult> {
  const [sessions, niveaux, exercicesAssignes, planifNotions] = await Promise.all([
    // Sessions des 8 dernières semaines
    prisma.sessionPratique.findMany({
      where: {
        eleveId,
        dateSession: { gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dateSession: "asc" },
    }),
    // Niveaux par matière
    prisma.niveauMatiere.findMany({ where: { eleveId } }),
    // Exercices assignés récents (30 jours)
    prisma.exerciceAssigne.findMany({
      where: {
        eleveId,
        dateAssignation: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: { exercice: true },
    }),
    // Notions planifiées non maîtrisées
    prisma.planifNotionEleve.findMany({ where: { eleveId, maitrisee: false } }),
  ]);

  const signals: string[] = [];
  const dataPoints: Record<string, number | string> = {};

  // ── 1. Vérification du seuil de déclenchement ──────────────────────────

  // Matières avec score global < 40%
  const matieresFaibles = niveaux.filter((n) => n.scoreGlobal < SEUIL_SCORE_FAIBLE);
  dataPoints.notionsEnEchec = planifNotions.length;
  dataPoints.matieresFaibles = matieresFaibles.length;

  // Semaines d'activité
  const semaines = new Set(
    sessions.map((s) => {
      const d = new Date(s.dateSession);
      const lundi = new Date(d);
      lundi.setDate(d.getDate() - d.getDay() + 1);
      return lundi.toISOString().slice(0, 10);
    })
  );
  dataPoints.semainesActives = semaines.size;

  // Progression sur les 14 derniers jours vs 14 jours précédents
  const now = Date.now();
  const session14j = sessions.filter(
    (s) => s.dateSession > new Date(now - SEUIL_PROGRESSION_NULLE * 24 * 60 * 60 * 1000)
  );
  const session14jAnterieures = sessions.filter(
    (s) =>
      s.dateSession <= new Date(now - SEUIL_PROGRESSION_NULLE * 24 * 60 * 60 * 1000) &&
      s.dateSession > new Date(now - 28 * 24 * 60 * 60 * 1000)
  );
  const moyenneRecente =
    session14j.length > 0
      ? session14j.reduce((sum, s) => sum + (s.exercicesReussis / Math.max(s.exercicesTotal, 1)), 0) /
        session14j.length
      : 0;
  const moyenneAncienne =
    session14jAnterieures.length > 0
      ? session14jAnterieures.reduce(
          (sum, s) => sum + (s.exercicesReussis / Math.max(s.exercicesTotal, 1)),
          0
        ) / session14jAnterieures.length
      : 0;
  const progressionNulle = moyenneRecente <= moyenneAncienne + 0.02;
  dataPoints.moyenneRecente = Math.round(moyenneRecente * 100);
  dataPoints.moyenneAncienne = Math.round(moyenneAncienne * 100);

  // ── Vérification des 3 critères combinés ──────────────────────────────
  const shouldTrigger =
    planifNotions.length >= SEUIL_NOTIONS_ECHEC &&
    semaines.size >= SEUIL_SEMAINES &&
    progressionNulle;

  // ── 2. Calcul des scores de triage par domaine ─────────────────────────

  const scores: Record<DomaineSpecialiste, number> = {
    NEUROPSYCHOLOGUE: 0,
    ORTHOPEDAGOGUE: 0,
    ORTHOPHONISTE: 0,
    ERGOTHERAPEUTE: 0,
    OPTOMETRISTE: 0,
    PSYCHOEDUCATEUR: 0,
  };

  // --- ORTHOPÉDAGOGUE : difficultés académiques multi-domaines ---
  const matieresEnEchec = new Set(matieresFaibles.map((n) => n.matiere));
  if (matieresEnEchec.size >= 2) {
    scores.ORTHOPEDAGOGUE += 30;
    signals.push("Difficultés dans plusieurs matières simultanément");
  }
  const aLecture = matieresEnEchec.has("FRANCAIS");
  const aMath = matieresEnEchec.has("MATHEMATIQUES");
  if (aLecture) { scores.ORTHOPEDAGOGUE += 25; signals.push("Difficultés persistantes en français"); }
  if (aMath) { scores.ORTHOPEDAGOGUE += 20; signals.push("Difficultés persistantes en mathématiques"); }

  // --- ORTHOPHONISTE : exercices oraux vs écrits ---
  const exercicesMira = exercicesAssignes.filter((e) =>
    e.exercice.type === "EXERCICE_ORAL" || e.exercice.consigne.toLowerCase().includes("oral")
  );
  const exercicesEcrits = exercicesAssignes.filter((e) =>
    e.exercice.type === "TEXTE_TROUS" || e.exercice.type === "QUESTION_OUVERTE"
  );
  if (exercicesMira.length > 0 && exercicesEcrits.length > 0) {
    const tauxOral =
      exercicesMira.filter((e) => e.statut === "TERMINE").length / exercicesMira.length;
    const tauxEcrit =
      exercicesEcrits.filter((e) => e.statut === "TERMINE").length / exercicesEcrits.length;
    if (tauxOral > tauxEcrit + 0.25) {
      scores.ORTHOPHONISTE += 35;
      signals.push("Performances orales nettement supérieures aux performances écrites");
      dataPoints.ecartOralEcrit = Math.round((tauxOral - tauxEcrit) * 100);
    }
  }
  if (aLecture && !aMath) {
    scores.ORTHOPHONISTE += 20;
    signals.push("Difficultés ciblées en langage écrit");
  }

  // --- ERGOTHÉRAPEUTE : lenteur généralisée ---
  const dureesMoyennes = sessions.map((s) =>
    s.dureeSecondes && s.exercicesTotal > 0 ? s.dureeSecondes / s.exercicesTotal : 0
  );
  const dureeMoyenne =
    dureesMoyennes.length > 0
      ? dureesMoyennes.reduce((a, b) => a + b, 0) / dureesMoyennes.length
      : 0;
  dataPoints.dureeMoyenneParExercice = Math.round(dureeMoyenne);
  if (dureeMoyenne > 180) {
    scores.ERGOTHERAPEUTE += 30;
    signals.push("Temps de complétion très élevé (>3 min/exercice en moyenne)");
  }
  const tauxAbandon =
    sessions.length > 0
      ? sessions.filter((s) => s.exercicesReussis === 0 && s.exercicesTotal > 0).length /
        sessions.length
      : 0;
  dataPoints.tauxAbandon = Math.round(tauxAbandon * 100);
  if (tauxAbandon > 0.4) {
    scores.ERGOTHERAPEUTE += 25;
    signals.push("Taux d'abandon élevé (>40% des sessions sans réussite)");
  }

  // --- NEUROPSYCHOLOGUE : dégradation intra-session ---
  const degradationIntrasession = sessions.filter((s) => {
    if (s.exercicesTotal < 5) return false;
    return s.exercicesReussis / s.exercicesTotal < 0.35;
  }).length;
  dataPoints.sessionsAvecDegradation = degradationIntrasession;
  if (degradationIntrasession >= 3) {
    scores.NEUROPSYCHOLOGUE += 30;
    signals.push("Dégradation répétée des performances en cours de session");
  }
  if (progressionNulle && semaines.size >= SEUIL_SEMAINES) {
    scores.NEUROPSYCHOLOGUE += 20;
  }
  const maxAutres = Math.max(
    scores.ORTHOPEDAGOGUE,
    scores.ORTHOPHONISTE,
    scores.ERGOTHERAPEUTE
  );
  if (maxAutres < 25 && planifNotions.length >= SEUIL_NOTIONS_ECHEC) {
    scores.NEUROPSYCHOLOGUE += 25;
    signals.push("Profil de blocage diffus sans domaine académique dominant");
  }

  // --- OPTOMÉTRISTE : échec lecture ---
  const exercicesLecture = exercicesAssignes.filter((e) =>
    e.exercice.type === "LECTURE_COMPREHENSION" || e.exercice.consigne.toLowerCase().includes("lire")
  );
  if (exercicesLecture.length >= 5) {
    const tauxLecture =
      exercicesLecture.filter((e) => e.statut === "TERMINE").length / exercicesLecture.length;
    dataPoints.tauxReussiteLecture = Math.round(tauxLecture * 100);
    if (tauxLecture < 0.30) {
      scores.OPTOMETRISTE += 30;
      signals.push("Taux de réussite très faible en lecture spécifiquement");
    }
  }

  // --- PSYCHOÉDUCATEUR : désengagement progressif ---
  const dureesSessions = [...sessions]
    .sort((a, b) => a.dateSession.getTime() - b.dateSession.getTime())
    .map((s) => s.dureeSecondes ?? 0);
  if (dureesSessions.length >= 6) {
    const premieresMoitie = dureesSessions.slice(0, Math.floor(dureesSessions.length / 2));
    const deuxiemeMoitie = dureesSessions.slice(Math.floor(dureesSessions.length / 2));
    const moyPremiere = premieresMoitie.reduce((a, b) => a + b, 0) / premieresMoitie.length;
    const moyDeuxieme = deuxiemeMoitie.reduce((a, b) => a + b, 0) / deuxiemeMoitie.length;
    dataPoints.tendanceDureeSessions = Math.round(((moyDeuxieme - moyPremiere) / Math.max(moyPremiere, 1)) * 100);
    if (moyDeuxieme < moyPremiere * 0.6) {
      scores.PSYCHOEDUCATEUR += 35;
      signals.push("Sessions de plus en plus courtes — désengagement progressif");
    }
  }
  if (tauxAbandon > 0.5) {
    scores.PSYCHOEDUCATEUR += 20;
    signals.push("Plus de 50% des sessions abandonnées sans complétion");
  }

  // ── 3. Sélection du domaine prioritaire ───────────────────────────────
  const sorted = (Object.entries(scores) as [DomaineSpecialiste, number][]).sort(
    ([, a], [, b]) => b - a
  );
  // Si les deux premiers sont à moins de 10 points d'écart → NEUROPSYCHOLOGUE (profil global)
  const primarySpecialist =
    sorted[0][1] - sorted[1][1] < 10 && sorted[0][0] !== "NEUROPSYCHOLOGUE"
      ? "NEUROPSYCHOLOGUE"
      : sorted[0][0];

  if (signals.length === 0) {
    signals.push("Blocage persistant malgré les interventions IA");
  }

  return {
    shouldTrigger,
    primarySpecialist: primarySpecialist as DomaineSpecialiste,
    scores,
    evidence: { signals, dataPoints },
  };
}

/**
 * Détermine le domaine secondaire à évaluer après le premier cycle,
 * en excluant le domaine déjà traité.
 */
export function getNextSpecialist(
  scores: Record<DomaineSpecialiste, number>,
  excludeDomaine: DomaineSpecialiste
): DomaineSpecialiste | null {
  const SEUIL_SECONDAIRE = 25;
  const sorted = (Object.entries(scores) as [DomaineSpecialiste, number][])
    .filter(([d]) => d !== excludeDomaine)
    .sort(([, a], [, b]) => b - a);

  if (sorted[0] && sorted[0][1] >= SEUIL_SECONDAIRE) {
    return sorted[0][0];
  }
  return null;
}
