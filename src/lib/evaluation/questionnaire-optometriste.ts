import type { Questionnaire } from "./questionnaire-types";

export const questionnaireOptometriste: Questionnaire = {
  domaine: "OPTOMETRISTE",
  titreFr: "Évaluation des habiletés visuelles fonctionnelles",
  titreEn: "Functional visual skills assessment",
  descriptionFr:
    "Ce questionnaire explore les indices d'inconfort visuel, de fatigue oculaire et de difficultés de traitement visuel qui pourraient affecter les apprentissages de votre enfant.",
  descriptionEn:
    "This questionnaire explores signs of visual discomfort, eye strain and visual processing difficulties that may affect your child's learning.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "inconfort_visuel",
      titreFr: "Inconfort visuel",
      titreEn: "Visual discomfort",
      items: [
        { id: "vis01", fr: "Se plaint de maux de tête après avoir lu ou regardé un écran.", en: "Complains of headaches after reading or looking at a screen." },
        { id: "vis02", fr: "Se frotte les yeux fréquemment lors de la lecture.", en: "Rubs eyes frequently while reading." },
        { id: "vis03", fr: "Cligne des yeux de façon excessive.", en: "Blinks excessively." },
        { id: "vis04", fr: "Plisse les yeux pour mieux voir (tableau, livre, écran).", en: "Squints to see better (board, book, screen)." },
        { id: "vis05", fr: "Se plaint que les lettres bougent, se dédoublent ou sont floues.", en: "Complains that letters move, double, or appear blurry." },
        { id: "vis06", fr: "Évite la lumière vive ou est sensible à l'éclairage fluorescent.", en: "Avoids bright light or is sensitive to fluorescent lighting." },
      ],
    },
    {
      id: "suivi_visuel",
      titreFr: "Suivi visuel et lecture",
      titreEn: "Visual tracking and reading",
      items: [
        { id: "sui01", fr: "Perd facilement sa place en lisant (saute des lignes, relit la même ligne).", en: "Easily loses his/her place while reading (skips lines, re-reads the same line)." },
        { id: "sui02", fr: "Suit la ligne avec son doigt pour ne pas se perdre.", en: "Tracks the line with his/her finger to avoid losing place." },
        { id: "sui03", fr: "Lit nettement mieux quand il/elle cache le reste du texte.", en: "Reads noticeably better when the rest of the text is covered." },
        { id: "sui04", fr: "Se rapproche beaucoup du livre ou de l'écran pour lire.", en: "Gets very close to the book or screen to read." },
        { id: "sui05", fr: "Lit à voix haute de façon hésitante même des mots connus.", en: "Reads aloud hesitatingly even familiar words." },
      ],
    },
    {
      id: "discrimination_visuelle",
      titreFr: "Discrimination visuelle",
      titreEn: "Visual discrimination",
      items: [
        { id: "dis01", fr: "Confond des lettres visuellement similaires (b/d, p/q, m/n).", en: "Confuses visually similar letters (b/d, p/q, m/n)." },
        { id: "dis02", fr: "Confond des chiffres visuellement similaires (6/9, 3/8).", en: "Confuses visually similar digits (6/9, 3/8)." },
        { id: "dis03", fr: "A du mal à copier des figures ou des lettres en les reproduisant fidèlement.", en: "Has difficulty faithfully copying figures or letters." },
        { id: "dis04", fr: "A du mal à distinguer les détails importants dans une image ou une carte géographique.", en: "Has difficulty distinguishing important details in an image or map." },
      ],
    },
    {
      id: "fatigue_adaptation",
      titreFr: "Fatigue et adaptation visuelle",
      titreEn: "Visual fatigue and adaptation",
      items: [
        { id: "fat01", fr: "Se fatigue rapidement lors de tâches de lecture ou d'écriture (< 15 minutes).", en: "Gets tired quickly during reading or writing tasks (< 15 minutes)." },
        { id: "fat02", fr: "A du mal à alterner la vision de loin et de près (tableau → cahier).", en: "Has difficulty alternating between near and far vision (board → notebook)." },
        { id: "fat03", fr: "Performe mieux le matin que l'après-midi pour les tâches visuelles.", en: "Performs better in the morning than the afternoon on visual tasks." },
        { id: "fat04", fr: "L'inconfort visuel augmente au fil d'une session de lecture prolongée.", en: "Visual discomfort increases over a prolonged reading session." },
      ],
    },
    {
      id: "ouvertes_opto",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "opto_ouv01",
          fr: "Votre enfant a-t-il/elle déjà eu un examen de la vue ? Si oui, quand ? Des lunettes lui ont-elles été prescrites ?",
          en: "Has your child ever had an eye exam? If so, when? Were glasses prescribed?",
          placeholderFr: "Ex : Oui, l'an dernier, lunettes prescrites mais rarement portées...",
          placeholderEn: "E.g.: Yes, last year, glasses prescribed but rarely worn...",
        },
        {
          id: "opto_ouv02",
          fr: "Dans quelles situations les difficultés visuelles de votre enfant semblent-elles les plus importantes ?",
          en: "In which situations do your child's visual difficulties seem most significant?",
          placeholderFr: "Ex : Surtout en classe, le soir pour les devoirs, ou avec les jeux vidéo...",
          placeholderEn: "E.g.: Mainly in class, in the evening for homework, or with video games...",
        },
      ],
    },
  ],
};
