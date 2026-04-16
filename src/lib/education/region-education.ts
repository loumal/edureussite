/**
 * Étiquettes scolaires et matières localisées par région.
 * Source unique de vérité pour tous les composants UI.
 */

export type NiveauInfo = {
  value: string;       // valeur NiveauScolaire (enum Prisma)
  label: string;       // étiquette localisée
  cycle: string;       // "Primaire" | "Collège" | "Secondaire" | "Lycée"
};

export type MatiereInfo = {
  value: string;       // valeur Matiere (enum Prisma)
  label: string;       // étiquette localisée
  emoji: string;
};

// ─── Groupes de régions ────────────────────────────────────────────────────────

const AFRIQUE_FR = new Set([
  "CI","SN","CM","BF","ML","BJ","TG","GA","CD","CG","GN","MG","NE","TD","CF","RW","BI","DJ","KM",
]);

const CANADA_EN = new Set([
  "ON","BC","AB","SK","MB","NS","PE","NL","YT","NT","NU",
]);

// ─── Niveaux ──────────────────────────────────────────────────────────────────

const NIVEAUX_QC: NiveauInfo[] = [
  { value: "PRIMAIRE_1",    label: "1re année",         cycle: "Primaire"    },
  { value: "PRIMAIRE_2",    label: "2e année",           cycle: "Primaire"    },
  { value: "PRIMAIRE_3",    label: "3e année",           cycle: "Primaire"    },
  { value: "PRIMAIRE_4",    label: "4e année",           cycle: "Primaire"    },
  { value: "PRIMAIRE_5",    label: "5e année",           cycle: "Primaire"    },
  { value: "PRIMAIRE_6",    label: "6e année",           cycle: "Primaire"    },
  { value: "SECONDAIRE_1",  label: "Sec. 1",             cycle: "Secondaire"  },
  { value: "SECONDAIRE_2",  label: "Sec. 2",             cycle: "Secondaire"  },
  { value: "SECONDAIRE_3",  label: "Sec. 3",             cycle: "Secondaire"  },
  { value: "SECONDAIRE_4",  label: "Sec. 4",             cycle: "Secondaire"  },
  { value: "SECONDAIRE_5",  label: "Sec. 5",             cycle: "Secondaire"  },
];

const NIVEAUX_CANADA_EN: NiveauInfo[] = [
  { value: "PRIMAIRE_1",    label: "Grade 1",            cycle: "Elementary"  },
  { value: "PRIMAIRE_2",    label: "Grade 2",            cycle: "Elementary"  },
  { value: "PRIMAIRE_3",    label: "Grade 3",            cycle: "Elementary"  },
  { value: "PRIMAIRE_4",    label: "Grade 4",            cycle: "Elementary"  },
  { value: "PRIMAIRE_5",    label: "Grade 5",            cycle: "Elementary"  },
  { value: "PRIMAIRE_6",    label: "Grade 6",            cycle: "Elementary"  },
  { value: "SECONDAIRE_1",  label: "Grade 7",            cycle: "Secondary"   },
  { value: "SECONDAIRE_2",  label: "Grade 8",            cycle: "Secondary"   },
  { value: "SECONDAIRE_3",  label: "Grade 9",            cycle: "Secondary"   },
  { value: "SECONDAIRE_4",  label: "Grade 10",           cycle: "Secondary"   },
  { value: "SECONDAIRE_5",  label: "Grade 11",           cycle: "Secondary"   },
  { value: "SECONDAIRE_6",  label: "Grade 12",           cycle: "Secondary"   },
];

const NIVEAUX_FRANCE: NiveauInfo[] = [
  { value: "PRIMAIRE_1",    label: "CP",                 cycle: "Primaire"    },
  { value: "PRIMAIRE_2",    label: "CE1",                cycle: "Primaire"    },
  { value: "PRIMAIRE_3",    label: "CE2",                cycle: "Primaire"    },
  { value: "PRIMAIRE_4",    label: "CM1",                cycle: "Primaire"    },
  { value: "PRIMAIRE_5",    label: "CM2",                cycle: "Primaire"    },
  { value: "SECONDAIRE_1",  label: "6ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_2",  label: "5ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_3",  label: "4ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_4",  label: "3ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_5",  label: "2nde",               cycle: "Lycée"       },
  { value: "SECONDAIRE_6",  label: "1ère",               cycle: "Lycée"       },
  { value: "SECONDAIRE_7",  label: "Terminale",          cycle: "Lycée"       },
];

const NIVEAUX_AFRIQUE_FR: NiveauInfo[] = [
  { value: "PRIMAIRE_1",    label: "CP1",                cycle: "Primaire"    },
  { value: "PRIMAIRE_2",    label: "CP2",                cycle: "Primaire"    },
  { value: "PRIMAIRE_3",    label: "CE1",                cycle: "Primaire"    },
  { value: "PRIMAIRE_4",    label: "CE2",                cycle: "Primaire"    },
  { value: "PRIMAIRE_5",    label: "CM1",                cycle: "Primaire"    },
  { value: "PRIMAIRE_6",    label: "CM2",                cycle: "Primaire"    },
  { value: "SECONDAIRE_1",  label: "6ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_2",  label: "5ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_3",  label: "4ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_4",  label: "3ème",               cycle: "Collège"     },
  { value: "SECONDAIRE_5",  label: "2nde",               cycle: "Lycée"       },
  { value: "SECONDAIRE_6",  label: "1ère",               cycle: "Lycée"       },
  { value: "SECONDAIRE_7",  label: "Terminale",          cycle: "Lycée"       },
];

export function getNiveauxParRegion(regionCode: string): NiveauInfo[] {
  if (regionCode === "QC" || regionCode === "NB") return NIVEAUX_QC;
  if (CANADA_EN.has(regionCode))                  return NIVEAUX_CANADA_EN;
  if (regionCode === "FR")                         return NIVEAUX_FRANCE;
  if (AFRIQUE_FR.has(regionCode))                 return NIVEAUX_AFRIQUE_FR;
  return NIVEAUX_QC; // fallback
}

// ─── Matières ─────────────────────────────────────────────────────────────────

const MATIERES_QC: MatiereInfo[] = [
  { value: "FRANCAIS",           emoji: "📖", label: "Français"              },
  { value: "MATHEMATIQUES",      emoji: "🔢", label: "Mathématiques"         },
  { value: "SCIENCES",           emoji: "🔬", label: "Sciences"              },
  { value: "UNIVERS_SOCIAL",     emoji: "🌍", label: "Univers social"        },
  { value: "ARTS",               emoji: "🎨", label: "Arts"                  },
  { value: "ETHIQUE",            emoji: "💭", label: "Éthique"               },
  { value: "ANGLAIS",            emoji: "🗣️", label: "Anglais"               },
  { value: "EDUCATION_PHYSIQUE", emoji: "⚽", label: "Éducation physique"    },
];

const MATIERES_CANADA_EN: MatiereInfo[] = [
  { value: "FRANCAIS",           emoji: "📖", label: "French / Language Arts" },
  { value: "MATHEMATIQUES",      emoji: "🔢", label: "Mathematics"            },
  { value: "SCIENCES",           emoji: "🔬", label: "Science"                },
  { value: "UNIVERS_SOCIAL",     emoji: "🌍", label: "Social Studies"         },
  { value: "ARTS",               emoji: "🎨", label: "Arts"                   },
  { value: "ETHIQUE",            emoji: "💭", label: "Ethics / Religion"       },
  { value: "ANGLAIS",            emoji: "🗣️", label: "English"                },
  { value: "EDUCATION_PHYSIQUE", emoji: "⚽", label: "Physical Education"      },
];

const MATIERES_FRANCE: MatiereInfo[] = [
  { value: "FRANCAIS",           emoji: "📖", label: "Français"                    },
  { value: "MATHEMATIQUES",      emoji: "🔢", label: "Mathématiques"               },
  { value: "SCIENCES",           emoji: "🔬", label: "SVT / Physique-Chimie"       },
  { value: "UNIVERS_SOCIAL",     emoji: "🗺️", label: "Histoire-Géographie"         },
  { value: "ARTS",               emoji: "🎨", label: "Arts Plastiques / Musique"   },
  { value: "ETHIQUE",            emoji: "💭", label: "EMC"                         },
  { value: "ANGLAIS",            emoji: "🗣️", label: "Anglais (LV1)"               },
  { value: "EDUCATION_PHYSIQUE", emoji: "⚽", label: "EPS"                         },
];

const MATIERES_AFRIQUE_FR: MatiereInfo[] = [
  { value: "FRANCAIS",           emoji: "📖", label: "Français"                    },
  { value: "MATHEMATIQUES",      emoji: "🔢", label: "Mathématiques"               },
  { value: "SCIENCES",           emoji: "🔬", label: "Sciences Naturelles / PC"    },
  { value: "UNIVERS_SOCIAL",     emoji: "🗺️", label: "Histoire-Géographie"         },
  { value: "ARTS",               emoji: "🎨", label: "Arts Plastiques"             },
  { value: "ETHIQUE",            emoji: "💭", label: "Éducation Civique"           },
  { value: "ANGLAIS",            emoji: "🗣️", label: "Anglais"                     },
  { value: "EDUCATION_PHYSIQUE", emoji: "⚽", label: "EPS"                         },
];

export function getMatieresParRegion(regionCode: string): MatiereInfo[] {
  if (regionCode === "QC" || regionCode === "NB") return MATIERES_QC;
  if (CANADA_EN.has(regionCode))                  return MATIERES_CANADA_EN;
  if (regionCode === "FR")                         return MATIERES_FRANCE;
  if (AFRIQUE_FR.has(regionCode))                 return MATIERES_AFRIQUE_FR;
  return MATIERES_QC; // fallback
}

/** Retourne le nom localisé d'un cycle scolaire */
export function getCycleLabel(regionCode: string): { primaire: string; secondaire: string } {
  if (CANADA_EN.has(regionCode)) return { primaire: "Elementary", secondaire: "Secondary" };
  if (regionCode === "FR" || AFRIQUE_FR.has(regionCode)) return { primaire: "Primaire", secondaire: "Collège / Lycée" };
  return { primaire: "Primaire", secondaire: "Secondaire" };
}
