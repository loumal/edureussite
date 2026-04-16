import { anthropic } from "./client";
import type {
  Matiere as MatiereType,
  NiveauScolaire,
  StyleApprentissage,
} from "@/generated/prisma";

interface ProfilPourPlan {
  prenom: string;
  niveauScolaire: NiveauScolaire;
  styleApprentissage?: StyleApprentissage | null;
  matieresRedoutees: MatiereType[];
  matieresPreferees: MatiereType[];
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
}

interface ObjectifGenere {
  titre: string;
  description: string;
  matiere: MatiereType;
  competencePFEQ: string;
  dateEcheanceSemaines: number;
  scoreVise: number;
}

interface PlanGenere {
  titre: string;
  description: string;
  objectifs: ObjectifGenere[];
  strategiesApprentissage: string[];
}

const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  PRIMAIRE_1: "1re année du primaire",
  PRIMAIRE_2: "2e année du primaire",
  PRIMAIRE_3: "3e année du primaire",
  PRIMAIRE_4: "4e année du primaire",
  PRIMAIRE_5: "5e année du primaire",
  PRIMAIRE_6: "6e année du primaire",
  SECONDAIRE_1: "1re secondaire",
  SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire",
  SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire",
  SECONDAIRE_6: "6e secondaire / 1ère",
  SECONDAIRE_7: "Terminale",
};

const MATIERES_LABELS: Record<MatiereType, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

export async function genererPlanAction(profil: ProfilPourPlan): Promise<PlanGenere> {
  const matieresPrioritaires =
    profil.matieresRedoutees.length > 0
      ? profil.matieresRedoutees
      : [MatiereFallback.FRANCAIS, MatiereFallback.MATHEMATIQUES];

  const adaptations = [];
  if (profil.tdah) adaptations.push("TDAH : sessions courtes (15 min max), une compétence à la fois");
  if (profil.dyslexie) adaptations.push("Dyslexie : exercices avec support visuel, éviter les textes denses");
  if (profil.anxieteScolaire) adaptations.push("Anxiété scolaire : progression douce, célébrer les petites victoires");
  if (profil.styleApprentissage === "VISUEL") adaptations.push("Style visuel : schémas, cartes mentales, couleurs");
  if (profil.styleApprentissage === "KINESTHESIQUE") adaptations.push("Style kinesthésique : exercices pratiques, manipulation");

  const prompt = `Tu es un conseiller pédagogique expert du programme québécois (PFEQ/MEES).

Génère un plan d'action personnalisé pour ${profil.prenom}, élève en ${NIVEAUX_LABELS[profil.niveauScolaire]}.

PROFIL :
- Matières difficiles : ${profil.matieresRedoutees.map((m) => MATIERES_LABELS[m]).join(", ") || "non spécifiées"}
- Matières préférées : ${profil.matieresPreferees.map((m) => MATIERES_LABELS[m]).join(", ") || "non spécifiées"}
${adaptations.length > 0 ? `- Adaptations : ${adaptations.join(" | ")}` : ""}

CONSIGNES :
- 2 à 3 objectifs SMART sur 3-6 semaines
- Priorité aux matières difficiles
- Références aux compétences PFEQ officielles
- Langage positif et encourageant
- Adapté à l'âge de l'élève

Réponds UNIQUEMENT avec ce JSON :
{
  "titre": "Titre motivant du plan (ex: Mon plan vers la réussite en maths !)",
  "description": "Description courte et encourageante du plan",
  "objectifs": [
    {
      "titre": "Objectif SMART court",
      "description": "Description détaillée de l'objectif",
      "matiere": "MATIERE_ENUM",
      "competencePFEQ": "Code ou nom de compétence PFEQ",
      "dateEcheanceSemaines": 3,
      "scoreVise": 75
    }
  ],
  "strategiesApprentissage": ["Stratégie 1", "Stratégie 2", "Stratégie 3"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Plan de secours si l'IA échoue
    return {
      titre: `Mon plan de réussite — ${NIVEAUX_LABELS[profil.niveauScolaire]}`,
      description: `Plan personnalisé pour ${profil.prenom}, conçu pour progresser à son rythme.`,
      objectifs: matieresPrioritaires.slice(0, 2).map((m) => ({
        titre: `Progresser en ${MATIERES_LABELS[m]}`,
        description: `Améliorer les compétences de base en ${MATIERES_LABELS[m]}`,
        matiere: m,
        competencePFEQ: "Compétences disciplinaires",
        dateEcheanceSemaines: 4,
        scoreVise: 70,
      })),
      strategiesApprentissage: [
        "Répétition espacée : réviser le même contenu sur plusieurs jours",
        "Sessions courtes et régulières plutôt que longues et rares",
        "Se récompenser après chaque exercice complété",
      ],
    };
  }
}

// Valeurs par défaut si l'élève n'a pas précisé ses matières
const MatiereFallback = {
  FRANCAIS: "FRANCAIS" as MatiereType,
  MATHEMATIQUES: "MATHEMATIQUES" as MatiereType,
};
