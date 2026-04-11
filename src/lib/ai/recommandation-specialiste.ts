import { anthropic } from "./client";

export interface RecommandationSpecialiste {
  recommande: boolean;
  urgence: "faible" | "moderee" | "haute";
  specialites: string[];
  raisonnement: string;
  declencheurs: string[];
  messageParent: string;
}

interface ProfilPourRecommandation {
  prenom: string;
  niveauScolaire: string;
  tdah: boolean;
  dyslexie: boolean;
  dyscalculie: boolean;
  anxieteScolaire: boolean;
  autresBesoins?: string | null;
  niveauxMatieres: { matiere: string; scoreGlobal: number; niveau: string }[];
  derniersCheckIns: { etat: string }[];
  nbDemandesExistantes: number;
  specialitesDisponibles: string[];
}

const SPECIALITE_LABEL: Record<string, string> = {
  ORTHOPEDAGOGUE: "Orthopédagogue",
  PSYCHONEUROLOGUE: "Psychoneurologue",
  PSYCHOEDUCATEUR: "Psychoéducateur",
  ORTHOPHONISTE: "Orthophoniste",
  TRAVAILLEUR_SOCIAL: "Travailleur social",
  PSYCHOLOGUE: "Psychologue",
  AUTRE: "Autre spécialité",
};

export async function genererRecommandationSpecialiste(
  profil: ProfilPourRecommandation,
  contexteDocuments = ""
): Promise<RecommandationSpecialiste> {
  const matieresEnDifficulte = profil.niveauxMatieres
    .filter((n) => n.scoreGlobal < 60)
    .map((n) => n.matiere);

  const humeursNegatives = ["STRESSE", "TRISTE", "FATIGUE"];
  const alerteEmotionnelle =
    profil.derniersCheckIns.length >= 2 &&
    profil.derniersCheckIns.slice(0, 3).every((c) => humeursNegatives.includes(c.etat));

  const specialitesLabels = profil.specialitesDisponibles
    .map((s) => SPECIALITE_LABEL[s] ?? s)
    .join(", ");

  const prompt = `Tu es un expert en éducation inclusive québécoise. Analyse ce profil d'élève et détermine si une consultation avec un spécialiste est recommandée.

═══ PROFIL DE L'ÉLÈVE ═══
• Prénom : ${profil.prenom}
• Niveau scolaire : ${profil.niveauScolaire}

═══ BESOINS PARTICULIERS ═══
• TDAH : ${profil.tdah ? "OUI" : "Non"}
• Dyslexie : ${profil.dyslexie ? "OUI" : "Non"}
• Dyscalculie : ${profil.dyscalculie ? "OUI" : "Non"}
• Anxiété scolaire : ${profil.anxieteScolaire ? "OUI" : "Non"}
${profil.autresBesoins ? `• Autres besoins : ${profil.autresBesoins}` : ""}

═══ DONNÉES ACADÉMIQUES ═══
• Matières en difficulté (score < 60%) : ${matieresEnDifficulte.length > 0 ? matieresEnDifficulte.join(", ") : "Aucune"}
• Résultats par matière :
${profil.niveauxMatieres.map((n) => `  - ${n.matiere} : ${Math.round(n.scoreGlobal)}%`).join("\n") || "  Aucune donnée"}

═══ ÉTAT ÉMOTIONNEL ═══
• Alerte émotionnelle : ${alerteEmotionnelle ? "OUI — humeurs négatives répétées" : "Non"}
• Humeurs récentes : ${profil.derniersCheckIns.map((c) => c.etat).join(", ") || "Non enregistrées"}

═══ CONTEXTE ═══
• Demandes de rencontre déjà envoyées : ${profil.nbDemandesExistantes}
• Spécialistes disponibles sur la plateforme : ${specialitesLabels || "Aucun"}

${contexteDocuments}
═══ MISSION ═══
Évalue si ce profil justifie une recommandation de consulter un spécialiste.
Considère : présence de troubles diagnostiqués, difficultés académiques persistantes, état émotionnel préoccupant.
Ne recommande pas si le profil est globalement sain et qu'aucun indicateur d'alerte n'est présent.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte avant/après) :
{
  "recommande": true,
  "urgence": "moderee",
  "specialites": ["ORTHOPEDAGOGUE"],
  "raisonnement": "Explication courte (2-3 phrases) pour le système interne — pourquoi recommander ou non",
  "declencheurs": ["Facteur 1 observé dans le profil", "Facteur 2"],
  "messageParent": "Message chaleureux et bienveillant de 2-3 phrases pour le parent, expliquant pourquoi une consultation pourrait aider son enfant. Si recommande est false, message rassurant."
}

Les valeurs possibles pour urgence : "faible", "moderee", "haute"
Les valeurs possibles pour specialites : sous-ensemble de [${profil.specialitesDisponibles.join(", ")}]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as RecommandationSpecialiste;
  } catch {
    // Fallback sécuritaire
    return {
      recommande: false,
      urgence: "faible",
      specialites: [],
      raisonnement: "Impossible d'analyser le profil pour le moment.",
      declencheurs: [],
      messageParent:
        `${profil.prenom} progresse bien. Continuez à le soutenir dans ses apprentissages quotidiens.`,
    };
  }
}
