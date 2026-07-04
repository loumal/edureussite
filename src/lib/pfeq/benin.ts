/**
 * Curriculum de la République du Bénin — Approche Par Compétences (APC)
 * Référence : Nouveaux Programmes d'Éducation (NPE) — MEMP / MESTFP / DIPIQ
 * Approche : APC + APS (Approche Par Situations) — cadre UEMOA harmonisé
 *
 * Structure :
 *   Primaire  : 3 sous-cycles × 2 ans → CI/CP · CE1/CE2 · CM1/CM2
 *   Secondaire : Collège (6ème→3ème / BEPC) + Lycée (2nde→Terminale / BAC)
 *   Lycée      : séries A1, A2, B, C, D, E
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CycleBenin =
  | "BJ_PRIMAIRE_C1"   // CI + CP     (sous-cycle élémentaire)
  | "BJ_PRIMAIRE_C2"   // CE1 + CE2   (sous-cycle moyen)
  | "BJ_PRIMAIRE_C3"   // CM1 + CM2   (sous-cycle supérieur)
  | "BJ_COLLEGE_C1"    // 6ème + 5ème
  | "BJ_COLLEGE_C2"    // 4ème + 3ème
  | "BJ_LYCEE_2NDE"    // 2nde (tronc commun + séries)
  | "BJ_LYCEE_1ERE"    // 1ère (toutes séries)
  | "BJ_LYCEE_TERM";   // Terminale (toutes séries)

export type SerieBeninLycee = "A1" | "A2" | "B" | "C" | "D" | "E";

export interface NotionBenin {
  id: string;
  label: string;
  description: string;        // used in AI prompt
  niveaux: CycleBenin[];
  series?: SerieBeninLycee[]; // undefined = commun à toutes les séries
  competenceAPC?: string[];   // codes de compétences APC officiels
}

export interface SequenceBenin {
  id: string;
  label: string;
  emoji: string;
  notions: NotionBenin[];
}

// ─── Mapping NiveauScolaire → CycleBenin ─────────────────────────────────────

export const NIVEAU_TO_CYCLE_BENIN: Record<string, CycleBenin> = {
  PRIMAIRE_1: "BJ_PRIMAIRE_C1",
  PRIMAIRE_2: "BJ_PRIMAIRE_C1",
  PRIMAIRE_3: "BJ_PRIMAIRE_C2",
  PRIMAIRE_4: "BJ_PRIMAIRE_C2",
  PRIMAIRE_5: "BJ_PRIMAIRE_C3",
  PRIMAIRE_6: "BJ_PRIMAIRE_C3",
  SECONDAIRE_1: "BJ_COLLEGE_C1",
  SECONDAIRE_2: "BJ_COLLEGE_C1",
  SECONDAIRE_3: "BJ_COLLEGE_C2",
  SECONDAIRE_4: "BJ_COLLEGE_C2",
  SECONDAIRE_5: "BJ_LYCEE_2NDE",
  SECONDAIRE_6: "BJ_LYCEE_1ERE",
  SECONDAIRE_7: "BJ_LYCEE_TERM",
};

// ─────────────────────────────────────────────────────────────────────────────
// FRANÇAIS
// ─────────────────────────────────────────────────────────────────────────────

const FRANCAIS_BJ: SequenceBenin[] = [
  {
    id: "BJ_FR_LECTURE",
    label: "Lecture et compréhension",
    emoji: "📖",
    notions: [
      {
        id: "BJ_FR_PHONETIQUE",
        label: "Phonétique et décodage",
        description: "Association graphème-phonème; lecture de mots-clés (Dado, Béré, Sotima, Dossou); phonèmes complexes (ou, on, an, ch, gn, oi); lecture courante de phrases et petits textes illustrés",
        niveaux: ["BJ_PRIMAIRE_C1"],
        competenceAPC: ["C2-APC-FR"],
      },
      {
        id: "BJ_FR_LECTURE_ANALYTIQUE",
        label: "Lecture analytique de textes",
        description: "Lecture de textes narratifs et descriptifs; identification de la structure du texte; enrichissement lexical par le contexte; textes littéraires adaptés au milieu béninois",
        niveaux: ["BJ_PRIMAIRE_C2", "BJ_PRIMAIRE_C3", "BJ_COLLEGE_C1"],
        competenceAPC: ["C2-APC-FR"],
      },
      {
        id: "BJ_FR_OEUVRES_INTEGRALES",
        label: "Étude d'œuvres intégrales",
        description: "Analyse d'œuvres intégrales (romans béninois et négro-africains, pièces de théâtre, recueils poétiques); repérage des figures de style (métaphore, métonymie, hyperbole); analyse de la modalisation",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C2-APC-FR", "C3-APC-FR"],
      },
      {
        id: "BJ_FR_TEXTES_LYCEE",
        label: "Littérature et analyse critique",
        description: "Analyse critique de textes littéraires variés (romans, poésie, essais); argumentation écrite et orale; discours indirect et concordance des temps; étude stylistique avancée",
        niveaux: ["BJ_LYCEE_2NDE", "BJ_LYCEE_1ERE", "BJ_LYCEE_TERM"],
        series: ["A1", "A2"],
        competenceAPC: ["C1-APC-FR", "C2-APC-FR", "C3-APC-FR"],
      },
    ],
  },
  {
    id: "BJ_FR_GRAMMAIRE",
    label: "Grammaire et orthographe",
    emoji: "✍️",
    notions: [
      {
        id: "BJ_FR_CLASSES_MOTS",
        label: "Classes de mots",
        description: "Nom, verbe, déterminants, pronoms personnels sujets; adjectif qualificatif et accord en genre et nombre dans le GN; compléments d'objet direct et indirect; compléments circonstanciels (temps, lieu, cause)",
        niveaux: ["BJ_PRIMAIRE_C2", "BJ_PRIMAIRE_C3"],
        competenceAPC: ["C2-APC-FR"],
      },
      {
        id: "BJ_FR_PHRASES_COMPLEXES",
        label: "Phrase complexe et subordination",
        description: "Structure de la phrase complexe (propositions principales et subordonnées); compléments circonstanciels complexes (but, conséquence, condition); voix active et passive; figures de style",
        niveaux: ["BJ_PRIMAIRE_C3", "BJ_COLLEGE_C1", "BJ_COLLEGE_C2"],
        competenceAPC: ["C2-APC-FR"],
      },
      {
        id: "BJ_FR_ORTHOGRAPHE",
        label: "Orthographe et accords complexes",
        description: "Accord du participe passé avec avoir et être; concordance des temps; accord du groupe nominal étendu; dictée et auto-correction",
        niveaux: ["BJ_PRIMAIRE_C3", "BJ_COLLEGE_C1"],
        competenceAPC: ["C2-APC-FR"],
      },
    ],
  },
  {
    id: "BJ_FR_CONJUGAISON",
    label: "Conjugaison",
    emoji: "🔤",
    notions: [
      {
        id: "BJ_FR_TEMPS_PRIMAIRE",
        label: "Temps du primaire",
        description: "Présent et futur de l'indicatif (verbes du 1er groupe au CI/CP/CE1); imparfait de l'indicatif (CE2); passé composé, passé simple et impératif présent (CM1/CM2)",
        niveaux: ["BJ_PRIMAIRE_C1", "BJ_PRIMAIRE_C2", "BJ_PRIMAIRE_C3"],
        competenceAPC: ["C2-APC-FR"],
      },
      {
        id: "BJ_FR_TEMPS_COLLEGE",
        label: "Temps du collège et du lycée",
        description: "Subjonctif présent; conditionnel présent et passé; discours indirect (concordance des temps); voix passive à tous les temps usuels",
        niveaux: ["BJ_COLLEGE_C1", "BJ_COLLEGE_C2", "BJ_LYCEE_2NDE", "BJ_LYCEE_1ERE", "BJ_LYCEE_TERM"],
        competenceAPC: ["C2-APC-FR"],
      },
    ],
  },
  {
    id: "BJ_FR_PRODUCTION_ECRITE",
    label: "Production d'écrits",
    emoji: "📝",
    notions: [
      {
        id: "BJ_FR_REDACTION_PRIMAIRE",
        label: "Rédaction au primaire",
        description: "Copie de phrases courtes, dictée de mots réguliers; description orale d'images; récits narratifs simples; lettre simple; correspondance administrative (demande d'autorisation de voyage)",
        niveaux: ["BJ_PRIMAIRE_C1", "BJ_PRIMAIRE_C2", "BJ_PRIMAIRE_C3"],
        competenceAPC: ["C2-APC-FR", "C3-APC-FR"],
      },
      {
        id: "BJ_FR_REDACTION_COLLEGE",
        label: "Rédaction au collège",
        description: "Textes narratifs, descriptifs, informatifs; dialogue de théâtre; argumentation simple; lettre personnelle et formelle; compte-rendu d'événement",
        niveaux: ["BJ_COLLEGE_C1", "BJ_COLLEGE_C2"],
        competenceAPC: ["C2-APC-FR", "C3-APC-FR"],
      },
      {
        id: "BJ_FR_DISSERTATION",
        label: "Dissertation et commentaire de texte",
        description: "Méthodologie de la dissertation littéraire; commentaire composé; écrit d'invention; exposé argumenté oral; analyse de sujet et plan détaillé",
        niveaux: ["BJ_LYCEE_2NDE", "BJ_LYCEE_1ERE", "BJ_LYCEE_TERM"],
        competenceAPC: ["C1-APC-FR", "C2-APC-FR", "C3-APC-FR"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHÉMATIQUES
// ─────────────────────────────────────────────────────────────────────────────

const MATH_BJ: SequenceBenin[] = [
  {
    id: "BJ_MATH_NUMERIATION",
    label: "Numération et calcul",
    emoji: "🔢",
    notions: [
      {
        id: "BJ_MATH_NOMBRES_CI_CP",
        label: "Nombres et opérations élémentaires (CI/CP)",
        description: "Numération intuitive de 0 à 9 (CI) puis 0 à 99 (CP) avec manipulations réelles (bâtonnets, graines, cailloux); regroupement en dizaines et unités; tableau de numération; addition et soustraction en ligne et posées sans retenue; résolution de problèmes concrets de réunion et de partage",
        niveaux: ["BJ_PRIMAIRE_C1"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_NOMBRES_CE1_CE2",
        label: "Numération étendue et multiplication (CE1/CE2)",
        description: "Extension du domaine numérique jusqu'à 9 999; soustraction posée avec retenue; algorithme de la multiplication posée; introduction de la division en ligne comme opération inverse; résolution de problèmes additifs, soustractifs et multiplicatifs; introduction aux fractions et aux nombres décimaux",
        niveaux: ["BJ_PRIMAIRE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_NOMBRES_CM1_CM2",
        label: "Millions, milliards, fractions et décimaux (CM1/CM2)",
        description: "Numération jusqu'aux milliards; fractions simples (notion partie-tout, comparaison, addition même dénominateur); nombres décimaux (partie entière, partie décimale, conversions); calcul mental rapide et estimation; opérations complexes sur les fractions et les décimaux",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_NOMBRES_COLLEGE",
        label: "Ensembles de nombres au collège",
        description: "Ensembles N, Z, Q, D, R; calculs sur entiers, décimaux et rationnels; fractions complexes, simplification, PGCD/PPCM; multiples et diviseurs; puissances de 10; racines carrées; identités remarquables du second degré; factorisation et développement d'expressions algébriques",
        niveaux: ["BJ_COLLEGE_C1", "BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_2ND_DEGRE",
        label: "Trinôme du second degré (2nde)",
        description: "Résolution systématique des équations et inéquations du second degré ax²+bx+c=0; calcul du discriminant Δ; factorisation de trinômes; signe d'un trinôme; étude de l'ordre dans R",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_SUITES",
        label: "Suites numériques (1ère et Terminale)",
        description: "Suites arithmétiques et géométriques (raison, terme général, somme des n premiers termes, monotonie, convergence); limite d'une suite; suites récurrentes",
        niveaux: ["BJ_LYCEE_1ERE", "BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
    ],
  },
  {
    id: "BJ_MATH_PROPORTIONNALITE",
    label: "Proportionnalité et grandeurs",
    emoji: "📐",
    notions: [
      {
        id: "BJ_MATH_PROPORTIONNALITE_PRIMAIRE",
        label: "Proportionnalité au primaire",
        description: "Propriétés de linéarité additive et multiplicative; résolution de problèmes de pourcentage, d'échelle cartographique, de vitesse moyenne, de partage proportionnel, d'intérêt et de règle de trois",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-MATH", "C3-APC-MATH"],
      },
      {
        id: "BJ_MATH_STATISTIQUES_PRIMAIRE",
        label: "Statistiques élémentaires",
        description: "Lecture et interprétation de graphiques en barres ou circulaires; organisation de données statistiques simples; comparaison élémentaire de probabilités simples",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_STATISTIQUES_COLLEGE",
        label: "Statistiques à une variable (collège)",
        description: "Traitement de séries statistiques à une variable; calcul de la moyenne, médiane, mode, étendue; représentation graphique; interprétation des indicateurs de dispersion",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_PROBABILITES_LYCEE",
        label: "Probabilités et statistiques bidimensionnelles (Terminale)",
        description: "Dénombrement (combinaisons, permutations, arrangements); probabilités conditionnelles; variables aléatoires discrètes; loi binomiale; loi de Poisson; statistiques bidimensionnelles (nuage de points, covariance, ajustement linéaire par moindres carrés)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
    ],
  },
  {
    id: "BJ_MATH_GEOMETRIE",
    label: "Géométrie et mesures",
    emoji: "📏",
    notions: [
      {
        id: "BJ_MATH_GEO_PRIMAIRE_C1",
        label: "Figures planes et repérage spatial (CI/CP)",
        description: "Reconnaissance des figures planes fondamentales (carré, triangle, cercle, rectangle); repérage spatial (haut/bas, gauche/droite, devant/derrière); comparaison des grandeurs (longueur, masse, contenance); lecture des heures pleines",
        niveaux: ["BJ_PRIMAIRE_C1"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_PRIMAIRE_C2",
        label: "Géométrie plane CE1/CE2",
        description: "Tracé de segments à la règle; symétrie axiale; caractéristiques du losange; tracé d'angles droits, aigus et obtus à l'équerre; mesures de longueurs (m, cm, km) et de masses (g, kg) et de contenances (l, dl, cl)",
        niveaux: ["BJ_PRIMAIRE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_PRIMAIRE_C3",
        label: "Géométrie avancée CM1/CM2",
        description: "Droites parallèles et perpendiculaires; caractérisation des triangles (rectangle, isocèle, équilatéral) et quadrilatères (carré, rectangle, parallélogramme); calcul du périmètre, de l'aire des figures planes composées et du volume des solides usuels (cube, pavé droit, cylindre, prisme)",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_COLLEGE_C1",
        label: "Géométrie plane et espace (6ème/5ème)",
        description: "Droites parallèles et perpendiculaires; angles et bissectrices; repérage cartésien; médiatrice d'un segment; polygones réguliers; cercle; prisme droit (représentation en perspective cavalière, tracé de patrons, aire latérale, volume)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_COLLEGE_C2",
        label: "Vecteurs et géométrie analytique (4ème/3ème)",
        description: "Vecteur dans le plan (somme, relation de Chasles, coordonnées); médiatrice, hauteur; pyramide et boule (représentation et volumes); théorème de la droite des milieux; équations cartésiennes de droites; théorème de Thalès (direct et réciproque); trigonométrie dans le triangle rectangle (cosinus, sinus, tangente)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_LYCEE_2NDE",
        label: "Calcul vectoriel et fonctions de référence (2nde)",
        description: "Calcul vectoriel plan; barycentre de deux ou trois points; étude globale des fonctions numériques de référence (carré, inverse, racine carrée : variations, courbes); droites dans le plan",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_GEO_LYCEE_1ERE",
        label: "Trigonométrie circulaire et géométrie de l'espace (1ère)",
        description: "Trigonométrie circulaire (formules d'addition, de duplication, de linéarisation); équations trigonométriques; géométrie de l'espace (parallélisme et orthogonalité de droites et de plans, sections planes)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
    ],
  },
  {
    id: "BJ_MATH_ANALYSE",
    label: "Analyse et calcul différentiel",
    emoji: "📈",
    notions: [
      {
        id: "BJ_MATH_FONCTIONS_COLLEGE",
        label: "Fonctions affines (3ème)",
        description: "Notion de fonction; fonctions affines (f(x)=ax+b), représentation graphique; résolution graphique et algébrique de systèmes d'équations linéaires à deux inconnues; équations et inéquations du premier degré dans R",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_DERIVATION",
        label: "Dérivation et étude de fonctions (1ère)",
        description: "Dérivée d'une fonction en un point; dérivée d'une somme, d'un produit, d'un quotient; dérivée des fonctions usuelles; calcul des limites; étude analytique complète et représentation graphique de fonctions rationnelles et irrationnelles",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_INTEGRALES",
        label: "Primitives, intégrales et équations différentielles (Terminale)",
        description: "Fonctions logarithme (naturel et décimal), exponentielle, puissances; théorème des valeurs intermédiaires; calcul des primitives d'une fonction continue; intégrales définies; calcul d'aires de domaines planes; intégration par parties; résolution d'équations différentielles linéaires du 1er et 2nd ordre",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
      {
        id: "BJ_MATH_COMPLEXES",
        label: "Nombres complexes (Terminale)",
        description: "Construction de l'ensemble C; écritures algébrique, trigonométrique et exponentielle d'un nombre complexe; module et argument; résolution d'équations du second degré à coefficients complexes; applications géométriques (isométries, homothéties, similitudes)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "E"],
        competenceAPC: ["C1-APC-MATH"],
      },
    ],
  },
  {
    id: "BJ_MATH_ALGEBRE",
    label: "Algèbre et calcul littéral",
    emoji: "🧮",
    notions: [
      {
        id: "BJ_MATH_CALCUL_LITTERAL",
        label: "Calcul littéral (5ème/4ème)",
        description: "Introduction aux écritures littérales liées aux aires et volumes; propriétés des multiples et diviseurs; simplification de fractions complexes; puissances de 10; identités remarquables du second degré (développement et factorisation)",
        niveaux: ["BJ_COLLEGE_C1", "BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-MATH"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVT — Sciences de la Vie et de la Terre
// ─────────────────────────────────────────────────────────────────────────────

const SVT_BJ: SequenceBenin[] = [
  {
    id: "BJ_SVT_VIVANT_PRIMAIRE",
    label: "Le vivant au primaire (EST)",
    emoji: "🌱",
    notions: [
      {
        id: "BJ_SVT_CORPS_HYGIENE",
        label: "Corps humain et hygiène (CI/CP)",
        description: "Identification anatomique des parties du corps humain; règles élémentaires d'hygiène corporelle (brossage des dents, lavage des mains au savon); distinction entre animaux sauvages et domestiques; identification des organes et besoins fondamentaux des plantes",
        niveaux: ["BJ_PRIMAIRE_C1"],
        competenceAPC: ["C3-APC-SVT"],
      },
      {
        id: "BJ_SVT_VIE_PLANTES",
        label: "Vie végétale et cycle des êtres vivants (CE1/CE2)",
        description: "Étude du cycle de vie d'un insecte ou d'un vertébré; croissance végétale expérimentale à partir de graines locales (arachide, maïs); étude des caractéristiques morphologiques des principaux groupes d'êtres vivants",
        niveaux: ["BJ_PRIMAIRE_C2"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
      {
        id: "BJ_SVT_CORPS_DIGESTION",
        label: "Appareil digestif et circulatoire (CM1/CM2)",
        description: "Étude de l'appareil digestif de l'homme et de la digestion des aliments solides; assimilation de l'eau; étude de l'appareil circulatoire (rôle du sang, organes de la circulation, description anatomique et composition du cœur, muscle cardiaque)",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_NUTRITION_PRIMAIRE",
        label: "Nutrition et biochimie alimentaire (CM2)",
        description: "Rôle physiologique des aliments; facteurs de variations des besoins énergétiques (âge, sexe, climat, activité physique); rôle biochimique protecteur des vitamines et sels minéraux; étude clinique de la malnutrition (marasme, kwashiorkor)",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_ALIMENTATION",
    label: "Alimentation et nutrition humaine",
    emoji: "🍽️",
    notions: [
      {
        id: "BJ_SVT_NUTRITION_6EME",
        label: "Alimentation et besoins nutritionnels (6ème)",
        description: "Définition de l'aliment; classification en aliments simples (glucides, lipides, protides, eau, sels minéraux, vitamines) et composés (lait, pain); tests de caractérisation chimique au laboratoire (amidon par eau iodée, ions Ca²⁺ par oxalate d'ammonium, ions Cl⁻ par nitrate d'argent); besoins quantitatifs (ration alimentaire, facteurs de variation); maladies nutritionnelles (marasme, kwashiorkor, obésité); conservation des denrées alimentaires locales (séchage, réfrigération, salage, fumage)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_REGIMES_RESPIRATION",
    label: "Diversité des êtres vivants et respiration",
    emoji: "🌬️",
    notions: [
      {
        id: "BJ_SVT_REGIMES_ALIMENTAIRES",
        label: "Régimes alimentaires animaux (6ème)",
        description: "Comportements d'observation, de poursuite et de capture; denture des phytophages (vache: barre, estomac à 4 poches) et zoophages (chat: canines développées, tube digestif court); adaptation anatomique des pièces buccales des insectes et vertébrés",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_RESPIRATION",
        label: "Respiration chez les êtres vivants (6ème)",
        description: "Mise en évidence expérimentale des échanges gazeux respiratoires (eau de chaux, rouge de crésol); diversité des organes respiratoires (poumons, branchies, trachées, peau); renouvellement des fluides respiratoires; pollution de l'air et des eaux",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_REPRODUCTION",
    label: "Reproduction et développement",
    emoji: "🌸",
    notions: [
      {
        id: "BJ_SVT_REPRO_PLANTES",
        label: "Reproduction chez les plantes sans fleurs (5ème)",
        description: "Diversité: champignons à chapeau, mousses, fougères; reproduction asexuée par spores (dissémination, germination, mycélium); reproduction sexuée (organes mâles et femelles, fécondation en présence d'eau, alternance des générations)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_CROISSANCE_INVERTEBRES",
        label: "Croissance et développement des invertébrés (5ème)",
        description: "Métamorphose complète (Bombyx du mûrier: œuf, chenille, chrysalide, papillon) et incomplète (criquet: œuf, larve, mues, adulte); croissance des mollusques (courbes de croissance de l'escargot, phénomène de la mue)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_PARASITES",
        label: "Invertébrés nuisibles et parasites (5ème)",
        description: "Ravages du criquet pèlerin sur les cultures; moustique Anophèle femelle vecteur du Plasmodium falciparum (paludisme); parasitisme intestinal (Ascaris, Ténia: cycle, contamination, conséquences); lutte intégrée (mécanique, biologique, chimique)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
      {
        id: "BJ_SVT_REPRO_HUMAINE",
        label: "Reproduction humaine (4ème)",
        description: "Changements physiologiques et hormonaux de la puberté; anatomie des appareils reproducteurs mâle et femelle; cycles ovarien et utérin; fécondation; développement embryonnaire; accouchement; méthodes contraceptives modernes et naturelles",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-SVT", "C3-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_IMMUNOLOGIE_GENETIQUE",
    label: "Immunologie et génétique",
    emoji: "🧬",
    notions: [
      {
        id: "BJ_SVT_IMMUNOLOGIE",
        label: "Immunologie humaine (3ème)",
        description: "Barrières naturelles de l'organisme; réaction inflammatoire locale (immunité innée, phagocytose); immunité adaptative humorale (lymphocytes B, anticorps) et cellulaire (lymphocytes T tueurs); immunisation artificielle (vaccination préventive et sérothérapie curative)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_GENETIQUE_3EME",
        label: "Génétique formelle (3ème)",
        description: "Localisation de l'information génétique dans le noyau cellulaire; mécanismes de la mitose et de la méiose; transmission de caractères héréditaires; anomalies chromosomiques (trisomie 21)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_GEOLOGIE",
    label: "Géologie et tectonique",
    emoji: "🌍",
    notions: [
      {
        id: "BJ_SVT_GEOLOGIE_4EME",
        label: "Géologie interne (4ème)",
        description: "Dynamique de la lithosphère; théorie de la dérive des continents; étude des séismes (ondes sismiques, magnitude, localisation de l'épicentre) et du volcanisme (types de volcans, produits émis)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_TECTONIQUE_LYCEE",
        label: "Tectonique des plaques (1ère D)",
        description: "Tectonique des plaques (preuves, mouvements, zones de subduction et d'accrétion); magmatisme associé aux contextes tectoniques; formation des chaînes de montagnes",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["D"],
        competenceAPC: ["C1-APC-SVT"],
      },
    ],
  },
  {
    id: "BJ_SVT_CYTOLOGIE",
    label: "Cytologie et biologie cellulaire",
    emoji: "🔬",
    notions: [
      {
        id: "BJ_SVT_CYTOLOGIE_2NDE",
        label: "Cytologie et biologie végétale (2nde D)",
        description: "Définition ultrastructurale de la cellule comme unité fondamentale du vivant (organites: noyau, membrane, cytoplasme, mitochondrie, chloroplaste au microscope électronique); analyse morphologique et anatomique de l'appareil racinaire (absorption racinaire, osmose); pathologies hydriques (choléra, dysenterie amibienne, hépatite A)",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["D"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_ADN_1ERE",
        label: "ADN et biosynthèse des protéines (1ère D)",
        description: "Structure de la molécule d'ADN (double hélice, bases azotées, liaisons hydrogène); réplication semi-conservative; mécanismes de biosynthèse des protéines (transcription nucléaire ADN→ARNm, code génétique, traduction cytoplasmique par les ribosomes)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["D"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_METABOLISME_TERM",
        label: "Métabolisme cellulaire (Terminale D)",
        description: "Analyse moléculaire de la photosynthèse (phase photochimique dans la membrane des thylakoïdes, phase biochimique du cycle de Calvin dans le stroma); respiration cellulaire (glycolyse cytoplasmique, cycle de Krebs mitochondrial, chaîne respiratoire et phosphorylation oxydative)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["D"],
        competenceAPC: ["C1-APC-SVT"],
      },
      {
        id: "BJ_SVT_NEURO_TERM",
        label: "Neurophysiologie (Terminale D)",
        description: "Anatomie de l'arc réflexe (réflexe myotatique); genèse et conduction du potentiel d'action le long de la membrane axonale; mécanismes moléculaires de la transmission synaptique chimique neuro-neuronique et neuro-musculaire (acétylcholine, récepteurs, canaux ioniques chimio-dépendants)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["D"],
        competenceAPC: ["C1-APC-SVT"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PCT — Physique-Chimie-Technologie
// ─────────────────────────────────────────────────────────────────────────────

const PCT_BJ: SequenceBenin[] = [
  {
    id: "BJ_PCT_EST_PRIMAIRE",
    label: "Éducation Scientifique et Technologique (EST – Primaire)",
    emoji: "🔭",
    notions: [
      {
        id: "BJ_PCT_ETATS_MATIERE_PRIMAIRE",
        label: "États physiques de l'eau (CE1/CE2)",
        description: "États physiques de l'eau (solidification, fusion, vaporisation); utilisation empirique du thermomètre à alcool pour relever des températures; étude de la perméabilité de différents types de sols du milieu béninois",
        niveaux: ["BJ_PRIMAIRE_C2"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_ELECTRICITE_PRIMAIRE",
        label: "Circuits électriques et sécurité (CM1/CM2)",
        description: "Étude des circuits électriques ménagers; conducteurs et isolants; règles de sécurité liées au courant alternatif du secteur; propriétés physiques des gaz (compressibilité, expansibilité)",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
    ],
  },
  {
    id: "BJ_PCT_ELECTRICITE",
    label: "Électricité et électronique",
    emoji: "⚡",
    notions: [
      {
        id: "BJ_PCT_CIRCUIT_6EME",
        label: "Circuit électrique simple (6ème)",
        description: "Notion de circuit électrique simple; rôles des dipôles (générateur/pile, récepteur/lampe, interrupteur, fils de connexion); conducteurs et isolants du milieu de vie; sens conventionnel du courant continu; réalisation d'un montage et schéma normalisé; fabrication d'une lampe de poche",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_COURANT_ALTERNATIF_5EME",
        label: "Courant alternatif et sécurité électrique (5ème)",
        description: "Différence entre courant continu et alternatif; caractéristiques de la tension du secteur (tension sinusoïdale, phase, neutre, prise de terre); dangers d'électrisation et électrocution; causes du court-circuit et de la surcharge; fusibles, disjoncteur différentiel et prise de terre",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_LOI_OHMS_4EME",
        label: "Loi d'Ohm et mesures électriques (4ème)",
        description: "Mesure de l'intensité (ampèremètre en série) et de la tension (voltmètre en dérivation); utilisation du multimètre; tracé de la caractéristique intensité-tension d'un conducteur ohmique; formulation mathématique de la loi d'Ohm : U = R·I",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_ENERGIE_ELEC_3EME",
        label: "Énergie électrique et installation domestique (3ème)",
        description: "Puissance électrique en courant continu et alternatif monophasé (P = U·I); énergie électrique consommée (E = P·t); structure d'une installation électrique domestique; décryptage d'une facture SBEE; électrolyse (phénomène, réactions aux électrodes); réalisation d'un électrolyseur d'eau",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_COURANT_CONTINU_2NDE",
        label: "Courant continu et composants électroniques (2nde C/D)",
        description: "Nature physique du courant continu (électrons libres dans les métaux, ions dans les solutions); lois d'association des dipôles en courant continu (lois des nœuds, loi des mailles); caractéristiques des dipôles passifs (conducteurs ohmiques, varistances, thermistances, diodes) et actifs; conception pratique et soudure de circuits simples (amplificateur, redresseur)",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_PILES_1ERE",
        label: "Piles électrochimiques et oxydoréduction (1ère C/D)",
        description: "Notion de couple d'oxydoréduction; classification qualitative des couples redox; constitution et fonctionnement d'une pile électrochimique (pile Daniell); écriture des demi-équations aux électrodes; calcul de la force électromotrice; dosage d'oxydoréduction (manganimétrie, dosage ion ferreux ou vitamine C)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
    ],
  },
  {
    id: "BJ_PCT_CHIMIE",
    label: "Chimie et transformations de la matière",
    emoji: "⚗️",
    notions: [
      {
        id: "BJ_PCT_MELANGES_6EME",
        label: "Mélanges et séparations (6ème)",
        description: "Mélanges homogènes et hétérogènes; dissolution et solubilité (soluté, solvant, solution saturée); techniques physiques de séparation (décantation, filtration, centrifugation, vaporisation); initiation à la distillation; fabrication d'un alambic artisanal",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_COMBUSTIONS_6EME",
        label: "Combustions vives (6ème)",
        description: "Combustion vive du carbone, du fer et d'une bougie dans le dioxygène; identification des réactifs et des produits; conservation de la masse au cours d'une transformation chimique; dangers des combustions (incendies, asphyxie par CO); pollution de l'air par gaz d'échappement",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_STRUCTURE_MATIERE_5EME",
        label: "Structure moléculaire de la matière (5ème)",
        description: "Notion de molécule comme assemblage d'atomes; formule chimique brute de corps purs moléculaires simples; modèle moléculaire appliqué aux propriétés physiques des états de la matière, de la dissolution et de la miscibilité",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_ATOME_4EME",
        label: "Structure de l'atome et métaux (4ème)",
        description: "Constitution microscopique de l'atome (noyau chargé positivement avec protons et neutrons, nuage électronique, neutralité électrique); propriétés physiques et mécaniques des métaux usuels (fer, cuivre, aluminium, zinc : densité, conductibilité, malléabilité, ductilité); liaisons covalentes simples; représentation géométrique plane de molécules (H₂, O₂, H₂O, CO₂, CH₄)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_REACTIONS_3EME",
        label: "Réactions chimiques en solution aqueuse (3ème)",
        description: "Échelle de pH et mesure expérimentale (papier pH, indicateurs colorés héliantine/phénolphtaléine); action de l'acide chlorhydrique sur le fer (équation ionique, ions Fe²⁺, dégagement de H₂); combustion complète et incomplète du méthane et du butane; introduction aux polymères (PE, PVC); problématique environnementale des déchets plastiques au Bénin",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_ATOME_CLASSIFICATION_2NDE",
        label: "Structure de l'atome et classification périodique (2nde)",
        description: "Constitution de l'atome (numéro atomique Z, nombre de masse A, configuration électronique en couches K, L, M); classification périodique moderne des éléments (3 premières périodes); molécules et représentation de Lewis; mole, constante d'Avogadro, masse molaire, volume molaire, concentration molaire et massique",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_CHIMIE_ORGANIQUE_1ERE",
        label: "Chimie organique – Hydrocarbures et alcools (1ère C/D)",
        description: "Alcanes, alcènes, alcynes : nomenclature IUPAC, formules développées, isomérie de chaîne et de position, réactions de combustion, substitution et addition; alcools (classes, nomenclature, déshydratation, oxydation ménagée → aldéhydes, cétones, acides carboxyliques)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_CHIMIE_ORGANIQUE_TERM",
        label: "Chimie organique fonctionnelle (Terminale C/D)",
        description: "Nomenclature et réactivité des amines (trois classes, caractère nucléophile), acides carboxyliques et dérivés (anhydrides, chlorures d'acyles, esters, amides); acides α-aminés (formule générale, représentation de Fischer, chiralité, énantiomères D et L, liaison peptidique); cinétique chimique (vitesse de réaction, facteurs : température, concentration, catalyseurs); réaction d'estérification-hydrolyse (réversibilité, état d'équilibre, constante d'équilibre)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
    ],
  },
  {
    id: "BJ_PCT_PHYSIQUE",
    label: "Physique – Mécanique, optique et ondes",
    emoji: "🔭",
    notions: [
      {
        id: "BJ_PCT_ETATS_MATIERE_6EME",
        label: "États et changements d'états de la matière (6ème)",
        description: "États physiques solide, liquide, gazeux et interprétation moléculaire; changements d'états physiques (fusion, solidification, vaporisation, liquéfaction); étude du principe de la congélation; fabrication d'un dispositif de formation de la glace",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_LUMIERE_5EME",
        label: "Propagation de la lumière (5ème)",
        description: "Sources de lumière primaires et secondaires; propagation rectiligne dans un milieu transparent et homogène; formation des ombres et de la pénombre; chambre noire; éclipses de Soleil et de Lune; propriétés des gaz (compressibilité, expansibilité, pression atmosphérique); dilatation et contraction thermiques des liquides; fabrication d'un thermomètre à alcool",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_OPTIQUE_4EME",
        label: "Réflexion et réfraction de la lumière (4ème)",
        description: "Réflexion sur un miroir plan (lois de Snell-Descartes); phénomène de la réfraction; réalisation d'un périscope à miroirs; propriétés d'élasticité d'un ressort hélicoïdal; fabrication d'un dynamomètre et d'une chambre noire avec matériaux de récupération béninois",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT", "C3-APC-PCT"],
      },
      {
        id: "BJ_PCT_FORCES_3EME",
        label: "Mécanique, forces et énergie (3ème)",
        description: "Équilibre d'un solide soumis à deux ou trois forces coplanaires; relation poids-masse P = m·g (g: intensité de la pesanteur); poussée d'Archimède; énergie potentielle de pesanteur, énergie cinétique de translation, conservation de l'énergie mécanique; lentilles minces convergentes et divergentes; construction géométrique de l'image; relation de grandissement",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_MECANIQUE_2NDE",
        label: "Mécanique newtonienne et chocs (2nde C/D)",
        description: "Cinématique rectiligne (vecteur position, vecteur vitesse moyenne et instantanée); interactions mécaniques, force, principe de l'inertie (1ère loi de Newton); quantité de mouvement; étude mécanique des chocs et collisions rectilignes simples (conservation de la quantité de mouvement p = m·v); pollution des eaux (nitrates, métaux lourds, détergents)",
        niveaux: ["BJ_LYCEE_2NDE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_ENERGIE_MECANIQUE_1ERE",
        label: "Énergie mécanique et thermodynamique (1ère C/D)",
        description: "Cinématique (mouvement rectiligne uniformément varié, mouvement circulaire uniforme, vecteurs vitesse et accélération); travail et puissance d'une force; énergie cinétique (translation et rotation), théorème de l'énergie cinétique; énergie potentielle de pesanteur; conservation de l'énergie mécanique; calorimétrie (chaleur, capacité thermique massique, chaleurs latentes de changement d'état)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_ONDES_1ERE",
        label: "Vibrations, ondes et interférences (1ère C/D)",
        description: "Mouvement vibratoire harmonique simple; propagation d'une onde mécanique progressive (corde, surface de l'eau); phénomène d'interférences mécaniques (superposition d'ondes cohérentes)",
        niveaux: ["BJ_LYCEE_1ERE"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_CHAMPS_TERM",
        label: "Champ électrostatique et champ magnétique (Terminale C/D)",
        description: "Interaction électrostatique, loi de Coulomb, vecteur champ électrostatique, condensateur plan; champ magnétique (pôles d'un aimant, faces d'une bobine, solénoïde, bobines de Helmholtz); force de Lorentz, trajectoire circulaire d'une particule chargée dans un champ magnétique; spectrographe de masse et cyclotron; induction et auto-induction électromagnétiques (loi de Lenz, FEM induite)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_MOUVEMENTS_TERM",
        label: "Mouvements dans les champs de force (Terminale C/D)",
        description: "Établissement des trois lois de Newton; mouvement d'un projectile dans un champ de pesanteur uniforme (équations horaires, trajectoire parabolique, flèche, portée); mouvement d'une particule chargée dans un champ électrique uniforme (déflexion électrique) et magnétique (force de Lorentz); oscillateurs mécaniques (système solide-ressort) et électriques (circuit LC libre, circuit RLC amorti)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_OPTIQUE_ONDES_TERM",
        label: "Optique ondulatoire et polarisation (Terminale C/D)",
        description: "Interférences lumineuses (fentes de Young); diffraction de la lumière par un réseau (incidence normale et quelconque); formules du prisme; dispersion de la lumière; polarisation rectiligne (loi de Malus)",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
      {
        id: "BJ_PCT_NUCLEAIRE_TERM",
        label: "Physique atomique et nucléaire (Terminale C/D)",
        description: "Radioactivité naturelle (α, β⁻, β⁺, γ); lois de conservation de Soddy; loi de décroissance radioactive; période radioactive (demi-vie); réactions nucléaires provoquées (fission et fusion); défaut de masse; relation d'Einstein E=mc²; énergie de liaison",
        niveaux: ["BJ_LYCEE_TERM"],
        series: ["C", "D", "E"],
        competenceAPC: ["C1-APC-PCT"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTOIRE-GÉOGRAPHIE (Éducation Sociale au primaire)
// ─────────────────────────────────────────────────────────────────────────────

const HIST_GEO_BJ: SequenceBenin[] = [
  {
    id: "BJ_HG_EDUCATION_SOCIALE",
    label: "Éducation Sociale (ES) – Primaire",
    emoji: "🏫",
    notions: [
      {
        id: "BJ_HG_CIVISME_CI_CP",
        label: "Civisme et vie en collectivité (CI/CP)",
        description: "Premières règles de politesse (saluer, remercier); hygiène collective; trois couleurs du drapeau béninois (vert, jaune, rouge); respect des aînés; solidarité; honnêteté; refrain de l'hymne national L'Aube Nouvelle; devise nationale",
        niveaux: ["BJ_PRIMAIRE_C1"],
        competenceAPC: ["C3-APC-HG"],
      },
      {
        id: "BJ_HG_GEO_LOCALE",
        label: "Géographie locale et points cardinaux (CE1/CE2)",
        description: "Étude géographique de l'école et du quartier; repérage des points cardinaux (Est, Ouest, Nord, Sud); règles de vie en famille et en classe; droits de l'enfant; géographie de la commune et du département; organisation administrative communale; origines historiques de la commune",
        niveaux: ["BJ_PRIMAIRE_C2"],
        competenceAPC: ["C3-APC-HG"],
      },
      {
        id: "BJ_HG_BENIN_PRIMAIRE",
        label: "Géographie et histoire du Bénin (CM1/CM2)",
        description: "Géographie physique du Bénin (relief, climats soudano-guinéens, végétation de savanes et forêts galeries); royaumes précoloniaux (Nikki, Danxomè, Hogbonou); migrations de peuplement; réseau hydrographique (Ouémé, Couffo, Mono, Niger au nord); colonisation et résistance du Roi Béhanzin (batailles de Dogba, Kpokissa, Cana); proclamation de l'indépendance le 1er août 1960; République du Bénin: pouvoirs Exécutif, Législatif, Judiciaire",
        niveaux: ["BJ_PRIMAIRE_C3"],
        competenceAPC: ["C1-APC-HG", "C3-APC-HG"],
      },
    ],
  },
  {
    id: "BJ_HG_HISTOIRE",
    label: "Histoire",
    emoji: "📜",
    notions: [
      {
        id: "BJ_HG_PREHISTOIRE",
        label: "Préhistoire africaine et croyances (6ème)",
        description: "Notion de chronologie historique et sources documentaires; Préhistoire africaine (berceau de l'humanité, hominisation, évolution morphologique et technologique de l'homme préhistorique); apport des croyances religieuses (Islam, Christianisme, Vaudoun) à la culture de la paix et à la cohésion sociale nationale",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_EGYPTE",
        label: "Égypte pharaonique (5ème)",
        description: "Structures politiques, sociales, religieuses de l'Égypte pharaonique; avancées technologiques et architecturales; impact historique sur les civilisations du continent africain",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_AFRIQUE_XVI_XIX",
        label: "Afrique XVIe–XIXe siècle et traite négrière (4ème)",
        description: "L'Afrique du XVIe au XIXe siècle; impact de la traite négrière transatlantique et arabo-musulmane sur le développement du continent; causes, formes et conséquences",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_COLONISATION_GUERRES",
        label: "Colonisation européenne et guerres mondiales (3ème)",
        description: "Colonisation européenne (XIXe-XXe siècle): causes économiques, scientifiques, religieuses; résistances dahoméennes; étude géopolitique des Première et Deuxième Guerres mondiales; décolonisation et indépendances africaines",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_ROYAUMES_DAHOMEY",
        label: "Royaumes précoloniaux du Dahomey (2nde)",
        description: "Histoire ancienne de l'Afrique (civilisations de la vallée du Nil); émergence des royaumes précoloniaux du Dahomey; structures politiques, sociales et économiques",
        niveaux: ["BJ_LYCEE_2NDE"],
        competenceAPC: ["C1-APC-HG"],
      },
    ],
  },
  {
    id: "BJ_HG_GEOGRAPHIE",
    label: "Géographie",
    emoji: "🗺️",
    notions: [
      {
        id: "BJ_HG_MILIEU_INTERTROPICAL",
        label: "Milieu intertropical africain (6ème)",
        description: "Théorie générale du milieu (interactions dynamiques entre milieu physique, biologique et humain); importance économique et agricole des milieux intertropicaux en Afrique (climat, savanes, cultures de rente)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_MILIEU_ARIDE",
        label: "Milieux arides et Sahel africain (5ème)",
        description: "Analyse des écosystèmes et des modes de vie dans les milieux arides et semi-arides africains (le cas du Sahel); causes et conséquences de la désertification; modes d'adaptation des populations",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_AFRIQUE_OUEST",
        label: "Géographie de l'Afrique de l'Ouest (4ème)",
        description: "Étude géographique et économique régionale de l'Afrique de l'Ouest (climatologie, démographie, ressources minières, agriculture de rente)",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-HG"],
      },
      {
        id: "BJ_HG_GEO_BENIN_COLLEGE",
        label: "Géographie complète du Bénin (3ème)",
        description: "Géographie physique (fleuves, relief, sol), démographique et économique complète de la République du Bénin; agriculture de subsistance et de rente (le coton); poids de l'économie informelle; enjeux d'aménagement du territoire national",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C1-APC-HG", "C3-APC-HG"],
      },
      {
        id: "BJ_HG_ATMOSPHERE_MONDE",
        label: "Atmosphère et zones climatiques mondiales (2nde)",
        description: "Dynamique de l'atmosphère terrestre; zones climatiques mondiales; éléments du temps et du climat; changements climatiques et enjeux environnementaux",
        niveaux: ["BJ_LYCEE_2NDE"],
        competenceAPC: ["C1-APC-HG"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANGLAIS
// ─────────────────────────────────────────────────────────────────────────────

const ANGLAIS_BJ: SequenceBenin[] = [
  {
    id: "BJ_ANG_GRAMMAIRE",
    label: "Grammaire anglaise",
    emoji: "🗣️",
    notions: [
      {
        id: "BJ_ANG_PRESENT_6EME",
        label: "Présent simple et continu (6ème)",
        description: "Présent simple (affirmations, négations, questions); présent continu (be + V-ing); vocabulaire de base (salutations, présentation personnelle, famille, école, environnement); emploi de l'auxiliaire do/does",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C2-APC-ANG"],
      },
      {
        id: "BJ_ANG_PASSE_5EME",
        label: "Prétérit et descriptions (5ème)",
        description: "Prétérit régulier et irrégulier pour raconter des événements passés; écriture de courts paragraphes descriptifs; vocabulaire thématique (environnement, vie quotidienne, nature)",
        niveaux: ["BJ_COLLEGE_C1"],
        competenceAPC: ["C2-APC-ANG"],
      },
      {
        id: "BJ_ANG_MODAUX_4EME",
        label: "Modaux et présent parfait (4ème)",
        description: "Modaux (can, must, should, would); présent parfait (have + participe passé); expression écrite de lettres personnelles; vocabulaire de la vie scolaire et sociale",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C2-APC-ANG"],
      },
      {
        id: "BJ_ANG_AVANCE_3EME",
        label: "Voix passive et discours indirect (3ème)",
        description: "Maîtrise avancée de la syntaxe passive (tous les temps); discours indirect (concordance des temps); rédaction structurée de dissertations ou d'exposés argumentés; vocabulaire avancé",
        niveaux: ["BJ_COLLEGE_C2"],
        competenceAPC: ["C2-APC-ANG"],
      },
      {
        id: "BJ_ANG_LYCEE",
        label: "Anglais au lycée",
        description: "Structures complexes (conditionnels, subordonnées relatives avancées, propositions gérondives et infinitives); production écrite argumentée; expression orale et compréhension de textes authentiques; vocabulaire académique et professionnel",
        niveaux: ["BJ_LYCEE_2NDE", "BJ_LYCEE_1ERE", "BJ_LYCEE_TERM"],
        competenceAPC: ["C2-APC-ANG"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM BÉNIN — Export principal
// ─────────────────────────────────────────────────────────────────────────────

export const CURRICULUM_BENIN: Partial<Record<string, { sequences: SequenceBenin[] }>> = {
  FRANCAIS:         { sequences: FRANCAIS_BJ },
  MATHEMATIQUES:    { sequences: MATH_BJ },
  SVT:              { sequences: SVT_BJ },
  PCT:              { sequences: PCT_BJ },
  UNIVERS_SOCIAL:   { sequences: HIST_GEO_BJ },
  ANGLAIS:          { sequences: ANGLAIS_BJ },
};

/**
 * Retourne les notions APC béninoises filtrées par niveau scolaire.
 * Optionnellement filtrées par série au lycée.
 */
export function getNotionsBenin(
  matiere: string,
  niveauScolaire: string,
  serie?: SerieBeninLycee
): SequenceBenin[] {
  const curriculum = CURRICULUM_BENIN[matiere];
  if (!curriculum) return [];

  const cycle = NIVEAU_TO_CYCLE_BENIN[niveauScolaire];
  if (!cycle) return curriculum.sequences;

  return curriculum.sequences
    .map((seq) => ({
      ...seq,
      notions: seq.notions.filter((n) => {
        if (!n.niveaux.includes(cycle)) return false;
        if (serie && n.series && !n.series.includes(serie)) return false;
        return true;
      }),
    }))
    .filter((seq) => seq.notions.length > 0);
}

/** Retourne une notion béninoise par ID */
export function getNotionBeninById(id: string): NotionBenin | undefined {
  for (const curriculum of Object.values(CURRICULUM_BENIN)) {
    if (!curriculum) continue;
    for (const seq of curriculum.sequences) {
      const notion = seq.notions.find((n) => n.id === id);
      if (notion) return notion;
    }
  }
  return undefined;
}
