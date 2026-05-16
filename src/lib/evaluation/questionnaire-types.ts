export type EchelleItem = {
  id: string;
  fr: string;
  en: string;
};

export type QuestionOuverte = {
  id: string;
  fr: string;
  en: string;
  placeholderFr?: string;
  placeholderEn?: string;
};

export type SectionQuestionnaire = {
  id: string;
  titreFr: string;
  titreEn: string;
  instructionFr?: string;
  instructionEn?: string;
  items?: EchelleItem[];       // items 0-3
  questions?: QuestionOuverte[]; // questions texte libre
};

export type Questionnaire = {
  domaine: string;
  titreFr: string;
  titreEn: string;
  descriptionFr: string;
  descriptionEn: string;
  instructionEchelleFr: string;
  instructionEchelleEn: string;
  sections: SectionQuestionnaire[];
};
