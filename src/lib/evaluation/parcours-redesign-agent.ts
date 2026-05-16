import { prisma } from "@/lib/prisma/client";
import { anthropic } from "@/lib/ai/client";
import type { RapportDetail } from "./report-generator";
import type { ParcoursAdapteDB } from "./adaptations";

const DOMAINE_LABELS: Record<string, string> = {
  NEUROPSYCHOLOGUE: "Neuropsychologue",
  ORTHOPEDAGOGUE: "Orthopédagogue",
  ORTHOPHONISTE: "Orthophoniste",
  ERGOTHERAPEUTE: "Ergothérapeute",
  OPTOMETRISTE: "Optométriste",
  PSYCHOEDUCATEUR: "Psychoéducateur",
};

/**
 * Agent IA de redesign de parcours (Couche 2).
 * Déclenché une seule fois après validation du rapport par le parent.
 * Lit le rapport détaillé + l'historique d'exercices + les notions PFEQ
 * et génère un document parcoursAdapte sur ProfilEleve.
 */
export async function lancerRedesignParcours(evaluationId: string): Promise<void> {
  try {
    const evaluation = await prisma.evaluationRequest.findUnique({
      where: { id: evaluationId },
      include: {
        rapports: {
          where: { type: "DETAIL", langue: "fr" },
          take: 1,
        },
        eleve: {
          include: {
            niveauxMatieres: true,
            exercicesAssignes: {
              where: { statut: "TERMINE" },
              include: { exercice: { select: { matiere: true, difficulte: true, competencesPFEQ: true } } },
              orderBy: { dateFin: "desc" },
              take: 30,
            },
            planifNotions: {
              where: { maitrisee: false },
              orderBy: { ordre: "asc" },
              take: 20,
            },
          },
        },
      },
    });

    if (!evaluation?.rapports[0]) return;

    const contenu = evaluation.rapports[0].contenu as unknown as RapportDetail;
    const eleve = evaluation.eleve;
    const domaineLabel = DOMAINE_LABELS[evaluation.primarySpecialist] ?? evaluation.primarySpecialist;

    // ── Construire le contexte pour l'agent ──────────────────────────────────
    const historiqueExercices = eleve.exercicesAssignes.map((e) => ({
      matiere: e.exercice.matiere,
      difficulte: e.exercice.difficulte,
      score: e.score,
      competences: e.exercice.competencesPFEQ,
    }));

    const scoreParMatiere: Record<string, number[]> = {};
    for (const ex of historiqueExercices) {
      if (ex.score !== null) {
        scoreParMatiere[ex.matiere] = scoreParMatiere[ex.matiere] ?? [];
        scoreParMatiere[ex.matiere].push(ex.score);
      }
    }
    const moyenneParMatiere = Object.entries(scoreParMatiere).map(([m, scores]) => ({
      matiere: m,
      moyenne: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    const notionsEnCours = eleve.planifNotions
      .map((n) => n.notion)
      .slice(0, 10);

    const prompt = `Tu es un agent IA spécialisé en redesign de parcours scolaire adapté.
Tu as accès au rapport d'évaluation complet d'un spécialiste (${domaineLabel}) et à l'historique d'apprentissage de l'élève.
Ta mission : générer un document de parcours adapté CONCRET et ACTIONNABLE que la plateforme utilisera automatiquement.

══ RAPPORT D'ÉVALUATION (${domaineLabel}) ══
Forces identifiées :
${contenu.forces?.map((f) => `- ${f}`).join("\n") ?? "Aucune"}

Zones nécessitant un soutien :
${contenu.zonesVulnerabilite?.map((z) => `- ${z}`).join("\n") ?? "Aucune"}

Recommandations :
${contenu.recommandationsParents?.map((r) => `- ${r}`).join("\n") ?? "Aucune"}

Prochaines étapes suggérées par le spécialiste :
${contenu.prochainesEtapes?.map((e) => `- ${e}`).join("\n") ?? "Aucune"}

══ DONNÉES DE PERFORMANCE DE L'ÉLÈVE ══
Niveau : ${eleve.niveauScolaire}
Scores moyens par matière :
${moyenneParMatiere.map((m) => `- ${m.matiere} : ${m.moyenne}%`).join("\n") || "Pas encore de données"}

Notions PFEQ en cours (non maîtrisées) :
${notionsEnCours.join(", ") || "Aucune notion planifiée"}

Niveaux par matière :
${eleve.niveauxMatieres.map((n) => `- ${n.matiere} : ${Math.round(n.scoreGlobal)}% (${n.niveau})`).join("\n") || "Aucune donnée"}

══ MISSION ══
En croisant le rapport du spécialiste et les données de performance, génère un plan de parcours adapté.
Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "notionsPrioritaires": ["notion1", "notion2"],
  "notionsAReporter": ["notion_trop_complexe_maintenant"],
  "typeExercicesPrivilegies": ["QCM", "TEXTE_TROUS"],
  "typeExercicesAEviter": ["QUESTION_OUVERTE"],
  "dureeSessionMax": 20,
  "nombreQuestionsParSession": 8,
  "niveauDifficulteDepart": "BASE",
  "renforcementPositifFrequence": "apres_chaque_reponse",
  "strategiesPedagogiques": [
    "Présenter toujours un exemple visuel avant l'exercice",
    "Décomposer chaque problème en 3 étapes maximum"
  ],
  "axesPrioritaires": [
    "Renforcer la conscience phonologique avant la lecture",
    "Pratiquer les tables avec des supports visuels"
  ],
  "raisonnementsAgent": "Explication courte (2-3 phrases) du raisonnement derrière ces choix — pourquoi ces adaptations pour CET élève précisément"
}

RÈGLES :
- dureeSessionMax : entre 10 et 45 minutes selon la fatigue cognitive détectée
- nombreQuestionsParSession : entre 5 et 20 selon la capacité d'attention
- niveauDifficulteDepart : "REMEDIATION" | "BASE" | "ATTENDU" | "AVANCE"
- typeExercicesPrivilegies et typeExercicesAEviter : parmi QCM, TEXTE_TROUS, QUESTION_OUVERTE, PROBLEME_MATHEMATIQUE, LECTURE_COMPREHENSION, MINI_DEFI
- strategiesPedagogiques : 3 à 6 stratégies concrètes pour l'IA qui génère les exercices
- axesPrioritaires : 2 à 4 axes de travail prioritaires pour les prochaines semaines`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    let parcoursAdapte: ParcoursAdapteDB;
    try {
      parcoursAdapte = JSON.parse(cleaned);
    } catch {
      console.error("[parcours-redesign-agent] JSON invalide:", text.slice(0, 300));
      return;
    }

    // Stocker le document avec la date de génération
    const parcoursAvecDate: ParcoursAdapteDB = {
      ...parcoursAdapte,
      genereLeAt: new Date().toISOString(),
    };

    await prisma.profilEleve.update({
      where: { id: eleve.id },
      data: { parcoursAdapte: parcoursAvecDate as object },
    });

  } catch (err) {
    console.error("[parcours-redesign-agent] Erreur:", err);
  }
}
