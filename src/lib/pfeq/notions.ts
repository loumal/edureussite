/**
 * Structure des notions du Programme de Formation de l'École Québécoise (PFEQ)
 * Ministère de l'Éducation et de l'Enseignement supérieur (MEES)
 *
 * Organisation : Matière → Domaine → Séquence → Notions
 * Niveaux : PRIMAIRE (cycles 1-3, années 1-6) et SECONDAIRE (cycles 1-2, sec 1-5)
 */

export type Cycle = "PRIMAIRE_C1" | "PRIMAIRE_C2" | "PRIMAIRE_C3" | "SECONDAIRE_C1" | "SECONDAIRE_C2";

export interface NotionPFEQ {
  id: string;
  label: string;
  description: string;           // used in AI prompt
  cycles: Cycle[];                // which cycles this notion is taught in
  competencesPFEQ?: string[];     // official PFEQ competency references
}

export interface SequencePFEQ {
  id: string;
  label: string;                  // e.g. "Arithmétique"
  emoji: string;
  notions: NotionPFEQ[];
}

export interface DomainesPFEQ {
  sequences: SequencePFEQ[];
}

// Mapping NiveauScolaire → Cycle
export const NIVEAU_TO_CYCLE: Record<string, Cycle> = {
  PRIMAIRE_1: "PRIMAIRE_C1",
  PRIMAIRE_2: "PRIMAIRE_C1",
  PRIMAIRE_3: "PRIMAIRE_C2",
  PRIMAIRE_4: "PRIMAIRE_C2",
  PRIMAIRE_5: "PRIMAIRE_C3",
  PRIMAIRE_6: "PRIMAIRE_C3",
  SECONDAIRE_1: "SECONDAIRE_C1",
  SECONDAIRE_2: "SECONDAIRE_C1",
  SECONDAIRE_3: "SECONDAIRE_C2",
  SECONDAIRE_4: "SECONDAIRE_C2",
  SECONDAIRE_5: "SECONDAIRE_C2",
};

// ─────────────────────────────────────────────────────────────────────────────
// MATHÉMATIQUES
// ─────────────────────────────────────────────────────────────────────────────
const MATH_SEQUENCES: SequencePFEQ[] = [
  {
    id: "MATH_ARITHMETIQUE",
    label: "Arithmétique",
    emoji: "🔢",
    notions: [
      {
        id: "MATH_NOMBRES_NATURELS",
        label: "Nombres naturels",
        description: "Lecture, écriture, comparaison et ordre des nombres naturels; valeur de position (unités, dizaines, centaines, milliers, millions)",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["MAT-C1", "MAT-C2"],
      },
      {
        id: "MATH_ADDITION_SOUSTRACTION",
        label: "Addition et soustraction",
        description: "Sens des opérations addition et soustraction; calcul mental, estimation, algorithme écrit; résolution de problèmes",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["MAT-C1"],
      },
      {
        id: "MATH_MULTIPLICATION_DIVISION",
        label: "Multiplication et division",
        description: "Tables de multiplication (0 à 10); sens et propriétés; algorithme de multiplication et de division; division avec reste",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["MAT-C1", "MAT-C2"],
      },
      {
        id: "MATH_FRACTIONS",
        label: "Fractions",
        description: "Représentation et sens des fractions; fractions équivalentes; comparaison; addition et soustraction de fractions (même dénominateur, puis différents); fraction d'un tout et d'un ensemble",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2", "MAT-C3"],
      },
      {
        id: "MATH_DECIMAUX",
        label: "Nombres décimaux",
        description: "Lecture et écriture des décimaux (dixièmes, centièmes, millièmes); comparaison; addition, soustraction, multiplication et division de décimaux",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2", "MAT-C3"],
      },
      {
        id: "MATH_POURCENTAGES",
        label: "Pourcentages",
        description: "Sens du pourcentage; conversion fraction↔décimal↔pourcentage; calcul d'un pourcentage d'une quantité; taux de variation; pourcentage d'augmentation et de diminution",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_ENTIERS_NEGATIFS",
        label: "Entiers relatifs (négatifs)",
        description: "Lecture et représentation des entiers négatifs; comparaison et ordre; addition, soustraction, multiplication et division d'entiers relatifs",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_EXPOSANTS_RACINES",
        label: "Exposants et racines",
        description: "Notation exponentielle; lois des exposants; racine carrée et racine cubique; notation scientifique",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_RATIONNELS_IRRATIONNELS",
        label: "Nombres rationnels et irrationnels",
        description: "Définition des ensembles de nombres (N, Z, Q, R); représentation sur la droite numérique; opérations",
        cycles: ["SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_CALCUL_MENTAL",
        label: "Calcul mental et estimation",
        description: "Stratégies de calcul mental; arrondir et estimer; décomposition et recomposition de nombres; propriétés des opérations (commutativité, associativité, distributivité)",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["MAT-C1", "MAT-C2"],
      },
    ],
  },
  {
    id: "MATH_ALGEBRE",
    label: "Algèbre",
    emoji: "🔣",
    notions: [
      {
        id: "MATH_EXPRESSIONS_ALGEBRIQUES",
        label: "Expressions algébriques",
        description: "Variables et constantes; monomômes et polynômes; addition, soustraction et multiplication de polynômes; mise en facteur",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_EQUATIONS",
        label: "Équations du premier degré",
        description: "Résolution d'équations à une inconnue; vérification; problèmes écrits menant à une équation; équations à deux variables",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_INEQUATIONS",
        label: "Inéquations",
        description: "Résolution d'inéquations du premier degré; représentation sur la droite numérique; ensemble solution",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_FONCTIONS",
        label: "Fonctions et relations",
        description: "Notion de fonction; fonctions linéaires, quadratiques, exponentielles, racine carrée; représentation graphique; paramètres; taux de variation; zéros et extremums",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_SYSTEMES_EQUATIONS",
        label: "Systèmes d'équations",
        description: "Résolution de systèmes par substitution, comparaison et réduction; représentation graphique",
        cycles: ["SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_SUITES",
        label: "Suites et régularités",
        description: "Régularités numériques et géométriques; suites arithmétiques et géométriques; terme général; représentation graphique",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2", "MAT-C3"],
      },
    ],
  },
  {
    id: "MATH_GEOMETRIE",
    label: "Géométrie",
    emoji: "📐",
    notions: [
      {
        id: "MATH_FIGURES_PLANES",
        label: "Figures planes",
        description: "Triangles (scalène, isocèle, équilatéral, rectangle); quadrilatères (carré, rectangle, losange, parallélogramme, trapèze); polygones réguliers; cercle; classification et propriétés",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2"],
      },
      {
        id: "MATH_SOLIDES",
        label: "Solides (géométrie dans l'espace)",
        description: "Prismes et pyramides; cylindre, cône, sphère; identification, classification; arêtes, faces, sommets (formule d'Euler)",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2"],
      },
      {
        id: "MATH_TRANSFORMATIONS",
        label: "Transformations géométriques",
        description: "Réflexion (axe de symétrie), translation (vecteur), rotation (angle et centre); homothétie; figures isométriques et semblables",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2"],
      },
      {
        id: "MATH_COORDONNEES",
        label: "Plan cartésien et coordonnées",
        description: "Localisation dans le plan cartésien; coordonnées d'un point (x, y); distance entre deux points; milieu d'un segment; pente d'une droite",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_ANGLES",
        label: "Angles",
        description: "Types d'angles (aigu, droit, obtus, plat, plein); mesure en degrés (rapporteur); angles complémentaires, supplémentaires; angles dans les polygones",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2"],
      },
      {
        id: "MATH_TRIGONOMETRIE",
        label: "Trigonométrie",
        description: "Rapports trigonométriques (sin, cos, tan) dans le triangle rectangle; loi des sinus; loi des cosinus; résolution de triangles quelconques",
        cycles: ["SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
    ],
  },
  {
    id: "MATH_MESURE",
    label: "Mesure",
    emoji: "📏",
    notions: [
      {
        id: "MATH_LONGUEUR_MASSE_CAPACITE",
        label: "Longueur, masse et capacité",
        description: "Unités de mesure (mm, cm, dm, m, km; mg, g, kg; mL, cL, dL, L); conversions; estimation et mesure à l'aide d'instruments",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["MAT-C2"],
      },
      {
        id: "MATH_PERIMETRE_AIRE",
        label: "Périmètre et aire",
        description: "Périmètre des polygones; aire du rectangle, triangle, parallélogramme, trapèze, cercle; aire des figures composées; développement de solides",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2", "MAT-C3"],
      },
      {
        id: "MATH_VOLUME",
        label: "Volume et capacité",
        description: "Volume du prisme, du cylindre, de la pyramide, du cône et de la sphère; relation entre unités de volume et de capacité",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_TEMPS",
        label: "Temps",
        description: "Lecture de l'heure (12h et 24h); durée; conversions (secondes, minutes, heures, jours, semaines, mois, années); calculs avec le temps",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2"],
        competencesPFEQ: ["MAT-C1"],
      },
    ],
  },
  {
    id: "MATH_STATS_PROBA",
    label: "Statistiques et probabilités",
    emoji: "📊",
    notions: [
      {
        id: "MATH_COLLECTE_DONNEES",
        label: "Collecte et représentation de données",
        description: "Questionnaires et sondages; tableaux de fréquences; diagrammes (à bandes, circulaire, à ligne brisée, pictogramme, histogramme); interprétation et analyse de graphiques",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["MAT-C2", "MAT-C3"],
      },
      {
        id: "MATH_MESURES_TENDANCE",
        label: "Mesures de tendance centrale",
        description: "Moyenne arithmétique, médiane, mode; étendue; données aberrantes; diagramme à tige et feuilles; boîte à moustaches",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_PROBABILITES",
        label: "Probabilités",
        description: "Expérience aléatoire; espace échantillonnal; événements (certain, impossible, probable); probabilité théorique et fréquentielle; dénombrement (principe de multiplication, arrangements, combinaisons)",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
      {
        id: "MATH_REGRESSION",
        label: "Corrélation et régression",
        description: "Nuages de points; corrélation (positive, négative, nulle, force); droite de régression; coefficient de corrélation",
        cycles: ["SECONDAIRE_C2"],
        competencesPFEQ: ["MAT-C3"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FRANÇAIS LANGUE D'ENSEIGNEMENT
// ─────────────────────────────────────────────────────────────────────────────
const FRANCAIS_SEQUENCES: SequencePFEQ[] = [
  {
    id: "FRA_LECTURE",
    label: "Lecture et compréhension",
    emoji: "📖",
    notions: [
      {
        id: "FRA_TEXTE_NARRATIF",
        label: "Texte narratif",
        description: "Compréhension de textes narratifs (conte, roman, nouvelle, récit d'aventure); personnages, lieu, temps, péripéties, dénouement; inférences; reprise de l'information",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C1"],
      },
      {
        id: "FRA_TEXTE_INFORMATIF",
        label: "Texte informatif et descriptif",
        description: "Identification de l'idée principale et des idées secondaires; organisateurs textuels; reformulation; résumé; textes documentaires, articles encyclopédiques",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C1"],
      },
      {
        id: "FRA_TEXTE_POETIQUE",
        label: "Texte poétique et dramatique",
        description: "Poème, chanson, comptine; identification des procédés poétiques (rime, refrain, vers, strophe, comparaison, métaphore, personnification); texte dramatique",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C1"],
      },
      {
        id: "FRA_TEXTE_ARGUMENTATIF",
        label: "Texte argumentatif et explicatif",
        description: "Thèse, arguments, exemples, contre-arguments; marqueurs de relation logiques; éditorial, lettre d'opinion, débat; texte explicatif (cause/conséquence, étapes)",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C1"],
      },
      {
        id: "FRA_STRATEGIES_LECTURE",
        label: "Stratégies de lecture",
        description: "Survol du texte; anticipation et prédiction; inférences (implicite); identification des mots clés; retour en arrière; vocabulaire en contexte; repères culturels",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C1"],
      },
    ],
  },
  {
    id: "FRA_GRAMMAIRE",
    label: "Grammaire et syntaxe",
    emoji: "✏️",
    notions: [
      {
        id: "FRA_CLASSES_MOTS",
        label: "Classes de mots",
        description: "Nom (commun, propre), déterminant (articles, adjectifs possessifs, démonstratifs, numéraux), adjectif, pronom, verbe, adverbe, préposition, conjonction; identification et manipulation",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_GROUPES_SYNTAXIQUES",
        label: "Groupes syntaxiques et phrase",
        description: "Groupe du nom (GN), groupe du verbe (GV), groupe de la préposition (GPrép), groupe de l'adjectif (GAdj); structure de la phrase de base (sujet, prédicat, complément de phrase); types de phrases (déclarative, interrogative, exclamative, impérative) et formes (positive/négative, active/passive, personnelle/impersonnelle, neutre/emphatique)",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_ACCORD_GN",
        label: "Accord dans le groupe du nom",
        description: "Accord du déterminant avec le nom; accord de l'adjectif avec le nom (genre et nombre); règles et cas particuliers (beau/bel, vieux/vieil, nouveau/nouvel); adjectifs de couleur",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_ACCORD_VERBE",
        label: "Accord du verbe avec le sujet",
        description: "Identification du sujet (GN, pronom, infinitif, subordonnée); accord du verbe (personne, nombre); cas complexes (sujets multiples, collectifs, sujet inversé, qui relatif)",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_PARTICIPE_PASSE",
        label: "Participe passé",
        description: "Accord du participe passé employé seul (comme adjectif); avec être (accord avec le sujet); avec avoir (accord avec le COD placé avant); verbes pronominaux",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_PONCTUATION",
        label: "Ponctuation",
        description: "Virgule (énumération, apposition, subordonnée, mise en relief); point, point-virgule, deux-points, guillemets, tirets; ponctuation du dialogue",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C2"],
      },
    ],
  },
  {
    id: "FRA_CONJUGAISON",
    label: "Conjugaison",
    emoji: "🔄",
    notions: [
      {
        id: "FRA_TEMPS_SIMPLES",
        label: "Temps simples de l'indicatif",
        description: "Présent de l'indicatif (tous les groupes de verbes); imparfait; futur simple; conditionnel présent — conjugaison, emploi et contexte d'utilisation",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_TEMPS_COMPOSES",
        label: "Temps composés",
        description: "Passé composé (formation avec avoir et être, accord du PP); plus-que-parfait; futur antérieur; conditionnel passé — choix de l'auxiliaire, accord",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_SUBJONCTIF_IMPERATIF",
        label: "Subjonctif et impératif",
        description: "Subjonctif présent (verbes réguliers et irréguliers courants); contextes d'utilisation (verbes de volonté, doute, émotion; conjonctions il faut que, bien que, pour que...); impératif présent",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_CONCORDANCE_TEMPS",
        label: "Concordance des temps et discours",
        description: "Cohérence des temps dans un texte; discours rapporté direct et indirect; transformation du discours; passage du présent au passé",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
    ],
  },
  {
    id: "FRA_ORTHOGRAPHE",
    label: "Orthographe et vocabulaire",
    emoji: "🔡",
    notions: [
      {
        id: "FRA_ORTHOGRAPHE_LEXICALE",
        label: "Orthographe lexicale",
        description: "Mots fréquents et difficiles selon le niveau; homophones lexicaux (mer/mère/maire, sang/cent/sens, cou/coup/coût...); mots de la même famille; préfixes et suffixes",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_HOMOPHONES_GRAMMATICAUX",
        label: "Homophones grammaticaux",
        description: "a/à, est/et, ou/où, ce/se, son/sont, on/ont, sa/ça, mais/mes/mets, leur/leurs, tout/tous, si/s'y, ni/n'y, peu/peux/peut, quand/quant, ces/ses/c'est/s'est/sait",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_VOCABULAIRE",
        label: "Vocabulaire et sens des mots",
        description: "Sens propre et figuré; synonymes et antonymes; champ lexical; formation des mots (composition, dérivation); proverbes et expressions québécoises; vocabulaire en contexte",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C1", "FRA-C2"],
      },
    ],
  },
  {
    id: "FRA_ECRITURE",
    label: "Écriture et production de textes",
    emoji: "✍️",
    notions: [
      {
        id: "FRA_STRUCTURE_TEXTE",
        label: "Structure et organisation du texte",
        description: "Introduction (sujet amené, posé, divisé), développement (paragraphes avec idée principale + exemples + conclusion partielle), conclusion (synthèse, ouverture); organisateurs textuels",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
      {
        id: "FRA_REVISION_CORRECTION",
        label: "Révision et correction de textes",
        description: "Relecture pour la cohérence; détection et correction d'erreurs grammaticales; amélioration du style (variété des phrases, des mots); utilisation du dictionnaire et des outils de référence",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["FRA-C2"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCES ET TECHNOLOGIE
// ─────────────────────────────────────────────────────────────────────────────
const SCIENCES_SEQUENCES: SequencePFEQ[] = [
  {
    id: "SCI_UNIVERS_MATERIEL",
    label: "Univers matériel",
    emoji: "⚗️",
    notions: [
      {
        id: "SCI_PROPRIETES_MATIERE",
        label: "Propriétés de la matière",
        description: "États de la matière (solide, liquide, gazeux); changements d'état (fusion, solidification, évaporation, condensation, sublimation); propriétés physiques (masse, volume, densité, couleur, texture)",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_MELANGES_SOLUTIONS",
        label: "Mélanges, solutions et séparations",
        description: "Mélanges homogènes et hétérogènes; solutions (soluté, solvant); dissolution; techniques de séparation (filtration, décantation, distillation, évaporation, tamisage)",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_ATOMES_MOLECULES",
        label: "Atomes, molécules et tableau périodique",
        description: "Structure de l'atome (proton, neutron, électron); tableau périodique des éléments; molécules et liaisons chimiques; réactions chimiques (réactifs, produits, équation)",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["SCI-C1", "SCI-C3"],
      },
      {
        id: "SCI_FORCES_MOUVEMENTS",
        label: "Forces et mouvements",
        description: "Types de forces (gravitationnelle, de frottement, d'attraction et répulsion magnétique, électrostatique); loi de Newton; vitesse, accélération; machines simples (levier, plan incliné, poulie)",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_ELECTRICITE",
        label: "Électricité et magnétisme",
        description: "Circuit électrique (en série, en parallèle); conducteurs et isolants; courant, tension (volt), résistance (ohm); loi d'Ohm; magnétisme et électromagnétisme",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
    ],
  },
  {
    id: "SCI_UNIVERS_VIVANT",
    label: "Univers vivant",
    emoji: "🌿",
    notions: [
      {
        id: "SCI_CELLULE_ORGANISATION",
        label: "Cellule et organisation du vivant",
        description: "Structure de la cellule (membrane, noyau, cytoplasme, organites); cellule animale vs végétale; tissus, organes, systèmes, organisme",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_SYSTEMES_CORPS",
        label: "Systèmes du corps humain",
        description: "Système digestif; système respiratoire; système circulatoire (cœur, artères, veines, capillaires, sang); système musculo-squelettique; système nerveux; interactions entre les systèmes",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_CLASSIFICATION",
        label: "Classification du vivant",
        description: "Règnes (animal, végétal, champignons, protistes, bactéries); caractéristiques des grands groupes; vertébrés et invertébrés; insectes; systématique et taxonomie",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_ECOSYSTEMES",
        label: "Écosystèmes et environnement",
        description: "Biomes du Québec et du monde; chaînes et réseaux alimentaires; producteurs, consommateurs, décomposeurs; perturbations écologiques; biodiversité; espèces envahissantes; enjeux environnementaux",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1", "SCI-C2"],
      },
      {
        id: "SCI_GENETIQUE_EVOLUTION",
        label: "Génétique et évolution",
        description: "ADN et gènes; chromosomes; hérédité (dominant/récessif); mutations; évolution et sélection naturelle; adaptation; spéciation",
        cycles: ["SECONDAIRE_C2"],
        competencesPFEQ: ["SCI-C1"],
      },
    ],
  },
  {
    id: "SCI_TERRE_ESPACE",
    label: "Terre et espace",
    emoji: "🌍",
    notions: [
      {
        id: "SCI_PHENOMENES_METEO",
        label: "Phénomènes atmosphériques et météo",
        description: "Cycle de l'eau; précipitations (pluie, neige, grêle); nuages et types; vent et pression atmosphérique; érosion et sédimentation; changements climatiques",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_SYSTEME_SOLAIRE",
        label: "Système solaire et astronomie",
        description: "Planètes et leurs caractéristiques; Lune (phases, marées); étoiles et constellations; galaxies; mouvements de la Terre (rotation, révolution); saisons; éclipses",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["SCI-C1"],
      },
      {
        id: "SCI_GEOLOGIE",
        label: "Géologie et structure de la Terre",
        description: "Structure interne (noyau, manteau, croûte); roches (ignées, sédimentaires, métamorphiques) et minéraux; cycle des roches; volcans et tremblements de terre; tectonique des plaques",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C1"],
      },
    ],
  },
  {
    id: "SCI_TECHNOLOGIE",
    label: "Technologie",
    emoji: "⚙️",
    notions: [
      {
        id: "SCI_STRUCTURES_MECANISMES",
        label: "Structures et mécanismes",
        description: "Types de structures (massive, treillis, coque); résistance, stabilité, rigidité; mécanismes de transmission du mouvement (engrenages, poulies, courroies); systèmes mécaniques",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C3"],
      },
      {
        id: "SCI_DEMARCHE_TECHNOLOGIQUE",
        label: "Démarche technologique et conception",
        description: "Problème technologique; cahier des charges; schéma de conception; prototype; test et évaluation; optimisation; contraintes et critères",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["SCI-C3"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERS SOCIAL
// ─────────────────────────────────────────────────────────────────────────────
const UNIVERS_SOCIAL_SEQUENCES: SequencePFEQ[] = [
  {
    id: "US_GEOGRAPHIE",
    label: "Géographie",
    emoji: "🗺️",
    notions: [
      {
        id: "US_LECTURE_CARTES",
        label: "Lecture de cartes et repérage",
        description: "Rose des vents; latitude et longitude; échelle; légende; atlas; projections cartographiques; localisation de pays, capitales, continents, mers et océans",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["US-C2"],
      },
      {
        id: "US_QUEBEC_CANADA",
        label: "Québec et Canada",
        description: "Régions administratives du Québec; régions physiographiques; ressources naturelles; industries et économie régionale; enjeux environnementaux québécois",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3"],
        competencesPFEQ: ["US-C1"],
      },
      {
        id: "US_MONDE_CONTEMPORAIN",
        label: "Monde et enjeux contemporains",
        description: "Mondialisation; développement durable; migrations; inégalités Nord-Sud; enjeux climatiques; organisations internationales (ONU, OTAN, Union européenne)",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["US-C2"],
      },
    ],
  },
  {
    id: "US_HISTOIRE",
    label: "Histoire",
    emoji: "📜",
    notions: [
      {
        id: "US_PREMIERES_NATIONS",
        label: "Premières Nations et Inuit",
        description: "Civilisations autochtones avant l'arrivée des Européens; modes de vie, croyances, organisation sociale; contacts avec les Européens; impacts de la colonisation; enjeux actuels",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["US-C1"],
      },
      {
        id: "US_NOUVELLE_FRANCE",
        label: "Nouvelle-France et colonisation",
        description: "Exploration et colonisation française; vie quotidienne en Nouvelle-France; traite des fourrures; relations avec les autochtones; Conquête britannique (1759-1760); Traité de Paris",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["US-C1"],
      },
      {
        id: "US_CANADA_CONFEDERATION",
        label: "Canada et Confédération",
        description: "Acte de Québec (1774); Acte constitutionnel (1791); Acte d'Union (1840); Confédération canadienne (1867); évolution politique jusqu'au XXe siècle; Charte des droits et libertés",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["US-C1"],
      },
      {
        id: "US_QUEBEC_XXE",
        label: "Québec contemporain (XXe-XXIe siècle)",
        description: "Révolution tranquille; nationalisme et indépendantisme; référendums; Loi 101 et protection du français; évolution des droits; Québec dans le monde; enjeux identitaires",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["US-C1"],
      },
      {
        id: "US_CIVILISATIONS_ANCIENNES",
        label: "Civilisations et sociétés anciennes",
        description: "Égypte ancienne, Mésopotamie, Grèce antique, Rome antique; Moyen Âge; Renaissance; Révolution industrielle; révolutions américaine et française; guerres mondiales",
        cycles: ["SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["US-C1"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANGLAIS LANGUE SECONDE
// ─────────────────────────────────────────────────────────────────────────────
const ANGLAIS_SEQUENCES: SequencePFEQ[] = [
  {
    id: "ANG_COMMUNICATION_ORALE",
    label: "Communication orale",
    emoji: "🗣️",
    notions: [
      {
        id: "ANG_VOCABULAIRE_BASE",
        label: "Vocabulaire de base et expressions",
        description: "Vocabulary for everyday topics (school, family, sports, food, weather, hobbies); common expressions and idioms; phonics and pronunciation",
        cycles: ["PRIMAIRE_C1", "PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1"],
        competencesPFEQ: ["ANG-C1"],
      },
      {
        id: "ANG_CONVERSATION",
        label: "Conversations et interactions",
        description: "Greetings and introductions; asking and answering questions; giving directions; expressing opinions; debates and discussions; formal vs informal language",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["ANG-C1"],
      },
    ],
  },
  {
    id: "ANG_LECTURE_ECRITURE",
    label: "Lecture et écriture",
    emoji: "📝",
    notions: [
      {
        id: "ANG_COMPREHENSION_LECTURE",
        label: "Reading comprehension",
        description: "Short texts, stories, articles; main idea and details; inference; vocabulary in context; reading strategies (skimming, scanning)",
        cycles: ["PRIMAIRE_C2", "PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["ANG-C2"],
      },
      {
        id: "ANG_GRAMMAIRE",
        label: "Grammar and writing",
        description: "Verb tenses (present simple, present continuous, past simple, future); subject-verb agreement; articles; plurals; sentences and paragraphs; punctuation in English",
        cycles: ["PRIMAIRE_C3", "SECONDAIRE_C1", "SECONDAIRE_C2"],
        competencesPFEQ: ["ANG-C2", "ANG-C3"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM COMPLET
// ─────────────────────────────────────────────────────────────────────────────
export const CURRICULUM_PFEQ: Partial<Record<string, DomainesPFEQ>> = {
  MATHEMATIQUES:    { sequences: MATH_SEQUENCES },
  FRANCAIS:         { sequences: FRANCAIS_SEQUENCES },
  SCIENCES:         { sequences: SCIENCES_SEQUENCES },
  UNIVERS_SOCIAL:   { sequences: UNIVERS_SOCIAL_SEQUENCES },
  ANGLAIS:          { sequences: ANGLAIS_SEQUENCES },
};

/** Retourne les notions filtrées par niveau scolaire */
export function getNotionsPourNiveau(
  matiere: string,
  niveauScolaire: string
): SequencePFEQ[] {
  const curriculum = CURRICULUM_PFEQ[matiere];
  if (!curriculum) return [];

  const cycle = NIVEAU_TO_CYCLE[niveauScolaire];
  if (!cycle) return curriculum.sequences;

  return curriculum.sequences
    .map((seq) => ({
      ...seq,
      notions: seq.notions.filter((n) => n.cycles.includes(cycle)),
    }))
    .filter((seq) => seq.notions.length > 0);
}

/** Retourne une notion par ID */
export function getNotionById(id: string): NotionPFEQ | undefined {
  for (const curriculum of Object.values(CURRICULUM_PFEQ)) {
    if (!curriculum) continue;
    for (const seq of curriculum.sequences) {
      const notion = seq.notions.find((n) => n.id === id);
      if (notion) return notion;
    }
  }
  return undefined;
}
