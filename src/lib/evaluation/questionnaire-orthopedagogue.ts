import type { Questionnaire } from "./questionnaire-types";

export const questionnaireOrthopedagogue: Questionnaire = {
  domaine: "ORTHOPEDAGOGUE",
  titreFr: "Évaluation des apprentissages scolaires",
  titreEn: "Academic learning assessment",
  descriptionFr:
    "Ce questionnaire explore les difficultés et forces de votre enfant dans les apprentissages scolaires : lecture, écriture, mathématiques et stratégies d'apprentissage.",
  descriptionEn:
    "This questionnaire explores your child's difficulties and strengths in academic learning: reading, writing, mathematics and learning strategies.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "lecture",
      titreFr: "Lecture",
      titreEn: "Reading",
      items: [
        { id: "lec01", fr: "Lit lentement par rapport aux autres enfants de son âge.", en: "Reads slowly compared to other children of the same age." },
        { id: "lec02", fr: "Perd sa place en lisant (saute des lignes, relit la même ligne).", en: "Loses his/her place while reading (skips lines, re-reads the same line)." },
        { id: "lec03", fr: "Hésite longuement sur certains mots avant de les prononcer.", en: "Hesitates for a long time on certain words before pronouncing them." },
        { id: "lec04", fr: "Comprend mal ce qu'il/elle vient de lire.", en: "Has poor comprehension of what has just been read." },
        { id: "lec05", fr: "A du mal à repérer les informations importantes dans un texte.", en: "Has difficulty identifying key information in a text." },
        { id: "lec06", fr: "Ne comprend pas ce qui est implicite dans un texte.", en: "Does not understand what is implicit in a text." },
        { id: "lec07", fr: "Préfère nettement écouter plutôt que lire.", en: "Clearly prefers listening over reading." },
        { id: "lec08", fr: "Évite les activités qui demandent de lire.", en: "Avoids activities that require reading." },
      ],
    },
    {
      id: "ecriture",
      titreFr: "Écriture et orthographe",
      titreEn: "Writing and spelling",
      items: [
        { id: "ecr01", fr: "A du mal à organiser ses idées pour écrire.", en: "Has difficulty organizing ideas for writing." },
        { id: "ecr02", fr: "Produit des phrases courtes et peu élaborées.", en: "Produces short, underdeveloped sentences." },
        { id: "ecr03", fr: "Fait beaucoup d'erreurs d'orthographe.", en: "Makes many spelling errors." },
        { id: "ecr04", fr: "Ne relit pas ou ne corrige pas ses textes.", en: "Does not re-read or correct his/her writing." },
        { id: "ecr05", fr: "A du mal à utiliser la ponctuation correctement.", en: "Has difficulty using punctuation correctly." },
        { id: "ecr06", fr: "L'écriture est difficile à lire (écriture illisible).", en: "Handwriting is difficult to read (illegible)." },
        { id: "ecr07", fr: "Copie lentement et fait des erreurs en copiant.", en: "Copies slowly and makes errors when copying." },
      ],
    },
    {
      id: "mathematiques",
      titreFr: "Mathématiques",
      titreEn: "Mathematics",
      items: [
        { id: "mat01", fr: "Réussit les calculs simples mais échoue dès que c'est complexe.", en: "Succeeds at simple calculations but fails when it becomes complex." },
        { id: "mat02", fr: "A du mal à comprendre les problèmes écrits en mathématiques.", en: "Has difficulty understanding written math problems." },
        { id: "mat03", fr: "N'automatise pas les tables (addition, multiplication).", en: "Has not automatized tables (addition, multiplication)." },
        { id: "mat04", fr: "A du mal à organiser sa démarche pour résoudre un problème.", en: "Has difficulty organizing the steps to solve a problem." },
        { id: "mat05", fr: "Se perd dans les problèmes à plusieurs étapes.", en: "Gets lost in multi-step problems." },
        { id: "mat06", fr: "Réagit avec découragement ou anxiété face aux maths.", en: "Reacts with discouragement or anxiety when faced with math." },
      ],
    },
    {
      id: "strategies",
      titreFr: "Stratégies d'apprentissage",
      titreEn: "Learning strategies",
      items: [
        { id: "str01", fr: "Utilise peu de stratégies quand il/elle ne comprend pas.", en: "Uses few strategies when not understanding." },
        { id: "str02", fr: "A du mal à mémoriser les informations apprises.", en: "Has difficulty memorizing learned information." },
        { id: "str03", fr: "Peine à transférer ce qu'il/elle a appris à de nouvelles situations.", en: "Struggles to transfer learned knowledge to new situations." },
        { id: "str04", fr: "Apprend mieux avec des exemples concrets qu'avec des explications abstraites.", en: "Learns better with concrete examples than abstract explanations." },
        { id: "str05", fr: "Profite peu des corrections pour s'améliorer.", en: "Benefits little from corrections to improve." },
        { id: "str06", fr: "N'utilise pas ou peu les outils d'aide disponibles (synthèse vocale, etc.).", en: "Makes little or no use of available support tools (text-to-speech, etc.)." },
        { id: "str07", fr: "A besoin d'un adulte à côté pour travailler efficacement.", en: "Needs an adult nearby to work effectively." },
      ],
    },
    {
      id: "devoirs",
      titreFr: "Gestion des devoirs",
      titreEn: "Homework management",
      items: [
        { id: "dev01", fr: "Les devoirs prennent beaucoup plus de temps que prévu.", en: "Homework takes much longer than expected." },
        { id: "dev02", fr: "Évite ou reporte les devoirs tant que possible.", en: "Avoids or postpones homework as long as possible." },
        { id: "dev03", fr: "A besoin d'aide constante pour faire ses devoirs.", en: "Needs constant help to do homework." },
        { id: "dev04", fr: "Oublie de noter ses devoirs ou de les rapporter.", en: "Forgets to write down or bring back homework." },
        { id: "dev05", fr: "Remet des travaux incomplets ou non faits.", en: "Submits incomplete or unfinished work." },
      ],
    },
    {
      id: "ouvertes_ortho",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "ortho_ouv01",
          fr: "Dans quelle(s) matière(s) votre enfant a-t-il/elle le plus de difficultés ? Décrivez.",
          en: "In which subject(s) does your child have the most difficulty? Please describe.",
          placeholderFr: "Ex : En français, il/elle a du mal à...",
          placeholderEn: "E.g.: In language arts, he/she struggles with...",
        },
        {
          id: "ortho_ouv02",
          fr: "Y a-t-il une matière où votre enfant réussit mieux ou est plus à l'aise ?",
          en: "Is there a subject where your child performs better or feels more at ease?",
          placeholderFr: "Ex : En mathématiques, il/elle est plus fort(e)...",
          placeholderEn: "E.g.: In mathematics, he/she is stronger...",
        },
        {
          id: "ortho_ouv03",
          fr: "Comment votre enfant réagit-il/elle à l'échec scolaire (abandon, colère, découragement, persévérance) ?",
          en: "How does your child react to academic failure (gives up, anger, discouragement, perseverance)?",
          placeholderFr: "Décrivez sa réaction habituelle...",
          placeholderEn: "Describe his/her usual reaction...",
        },
      ],
    },
  ],
};
