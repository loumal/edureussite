// Persona unique : Mira — Enseignante IA d'Édu-Réussite QC
// Voix ElevenLabs : Charlotte (douce, naturelle en français)
// Pour changer la voix → remplacer MIRA.voiceId par un autre ID ElevenLabs

export interface AvatarPersona {
  id: string;
  name: string;
  title: string;
  imagePath: string; // chemin dans /public/
  voiceId: string;   // ID ElevenLabs
  primaryColor: string;
}

export const MIRA: AvatarPersona = {
  id: "mira",
  name: "Mira",
  title: "Ton enseignante IA",
  imagePath: "/avatars/mira.png",
  voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice — Clear, Engaging Educator
  primaryColor: "#2a7c6f",          // --color-success du thème Édu-Réussite
};

// Formatage humain du niveau scolaire (PFEQ)
export const NIVEAUX_LABEL: Record<string, string> = {
  PRIMAIRE_1: "1re année du primaire",
  PRIMAIRE_2: "2e année du primaire",
  PRIMAIRE_3: "3e année du primaire",
  PRIMAIRE_4: "4e année du primaire",
  PRIMAIRE_5: "5e année du primaire",
  PRIMAIRE_6: "6e année du primaire",
  SECONDAIRE_1: "1re année du secondaire",
  SECONDAIRE_2: "2e année du secondaire",
  SECONDAIRE_3: "3e année du secondaire",
  SECONDAIRE_4: "4e année du secondaire",
  SECONDAIRE_5: "5e année du secondaire",
};

export const MATIERES_LABEL: Record<string, string> = {
  FRANCAIS: "français",
  MATHEMATIQUES: "mathématiques",
  SCIENCES: "sciences et technologie",
  UNIVERS_SOCIAL: "univers social",
  ARTS: "arts",
  ETHIQUE: "éthique et culture religieuse",
  ANGLAIS: "anglais",
  EDUCATION_PHYSIQUE: "éducation physique",
};
