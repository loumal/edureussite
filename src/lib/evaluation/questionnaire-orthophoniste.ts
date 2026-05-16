import type { Questionnaire } from "./questionnaire-types";

export const questionnaireOrthophoniste: Questionnaire = {
  domaine: "ORTHOPHONISTE",
  titreFr: "Évaluation du langage oral et écrit",
  titreEn: "Oral and written language assessment",
  descriptionFr:
    "Ce questionnaire explore les habiletés langagières de votre enfant : expression orale, compréhension, conscience phonologique et lien entre le langage oral et l'écrit.",
  descriptionEn:
    "This questionnaire explores your child's language abilities: oral expression, comprehension, phonological awareness and the link between spoken and written language.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "expression_orale",
      titreFr: "Expression orale",
      titreEn: "Oral expression",
      items: [
        { id: "exp01", fr: "A du mal à trouver ses mots (fait des pauses, dit « euh » souvent).", en: "Has difficulty finding words (pauses frequently, says 'um' often)." },
        { id: "exp02", fr: "Utilise des phrases courtes et peu élaborées pour son âge.", en: "Uses short, underdeveloped sentences for his/her age." },
        { id: "exp03", fr: "Confond des mots qui se ressemblent (p. ex. « cheval » pour « château »).", en: "Confuses similar-sounding words (e.g., says one word when meaning another)." },
        { id: "exp04", fr: "A du mal à raconter une histoire ou un événement dans le bon ordre.", en: "Has difficulty telling a story or event in the correct sequence." },
        { id: "exp05", fr: "Bégaie ou répète des sons/syllabes en parlant.", en: "Stutters or repeats sounds/syllables when speaking." },
        { id: "exp06", fr: "Son discours est difficile à comprendre pour des personnes peu familières.", en: "His/her speech is difficult to understand for unfamiliar listeners." },
        { id: "exp07", fr: "Évite de prendre la parole devant les autres.", en: "Avoids speaking in front of others." },
      ],
    },
    {
      id: "comprehension_orale",
      titreFr: "Compréhension orale",
      titreEn: "Oral comprehension",
      items: [
        { id: "com01", fr: "A du mal à suivre des consignes données oralement.", en: "Has difficulty following verbally given instructions." },
        { id: "com02", fr: "Répond à côté de la question lors d'échanges.", en: "Gives off-topic answers during conversations." },
        { id: "com03", fr: "Comprend mieux quand on lui montre (support visuel) que quand on lui explique.", en: "Understands better with visual support than with verbal explanation alone." },
        { id: "com04", fr: "Ne comprend pas les blagues, le sarcasme ou le sens figuré.", en: "Does not understand jokes, sarcasm, or figurative language." },
        { id: "com05", fr: "A besoin de faire répéter souvent pour bien comprendre.", en: "Often needs things repeated to understand correctly." },
        { id: "com06", fr: "A du mal à suivre une conversation à plusieurs participants.", en: "Has difficulty following a multi-person conversation." },
      ],
    },
    {
      id: "phonologie",
      titreFr: "Conscience phonologique",
      titreEn: "Phonological awareness",
      items: [
        { id: "pho01", fr: "A du mal à repérer les rimes dans des comptines ou des mots.", en: "Has difficulty identifying rhymes in nursery rhymes or words." },
        { id: "pho02", fr: "Confond des sons proches à l'oral (p. ex. « b » et « p », « f » et « v »).", en: "Confuses similar sounds when speaking (e.g., 'b' and 'p', 'f' and 'v')." },
        { id: "pho03", fr: "A du mal à segmenter les syllabes dans un mot.", en: "Has difficulty segmenting syllables in a word." },
        { id: "pho04", fr: "Peine à manipuler les sons (enlever un son d'un mot, inverser des syllabes).", en: "Has difficulty manipulating sounds (removing a sound from a word, reversing syllables)." },
        { id: "pho05", fr: "Confond la correspondance entre les lettres et les sons qu'elles représentent.", en: "Confuses the correspondence between letters and the sounds they represent." },
      ],
    },
    {
      id: "ecart_oral_ecrit",
      titreFr: "Écart entre oral et écrit",
      titreEn: "Gap between oral and written language",
      items: [
        { id: "eco01", fr: "Comprend bien à l'oral mais a du mal avec le texte écrit.", en: "Understands well orally but struggles with written text." },
        { id: "eco02", fr: "S'exprime bien à l'oral mais produit des textes écrits très limités.", en: "Expresses well orally but produces very limited written texts." },
        { id: "eco03", fr: "La lecture à voix haute est beaucoup plus difficile que la compréhension orale.", en: "Reading aloud is much harder than oral comprehension." },
        { id: "eco04", fr: "A du mal à passer d'une idée exprimée oralement à une idée écrite.", en: "Has difficulty moving from an orally expressed idea to a written one." },
      ],
    },
    {
      id: "vocabulaire",
      titreFr: "Vocabulaire et sémantique",
      titreEn: "Vocabulary and semantics",
      items: [
        { id: "voc01", fr: "Utilise un vocabulaire pauvre pour son âge.", en: "Uses limited vocabulary for his/her age." },
        { id: "voc02", fr: "A du mal à expliquer le sens d'un mot inconnu en contexte.", en: "Has difficulty explaining the meaning of an unknown word in context." },
        { id: "voc03", fr: "Confond des mots de sens proche (synonymes, antonymes).", en: "Confuses words with similar meanings (synonyms, antonyms)." },
        { id: "voc04", fr: "Donne des définitions vagues ou imprécises.", en: "Gives vague or imprecise definitions." },
      ],
    },
    {
      id: "ouvertes_ortho",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "oph_ouv01",
          fr: "Décrivez comment votre enfant communique à la maison : est-ce qu'il/elle initie des conversations, pose des questions, raconte sa journée ?",
          en: "Describe how your child communicates at home: does he/she initiate conversations, ask questions, recount his/her day?",
          placeholderFr: "Ex : Il/elle parle peu spontanément mais répond quand on lui pose des questions...",
          placeholderEn: "E.g.: He/she rarely speaks spontaneously but answers when asked questions...",
        },
        {
          id: "oph_ouv02",
          fr: "Y a-t-il eu un suivi en orthophonie ou une évaluation antérieure du langage ? Si oui, quand et avec quels résultats ?",
          en: "Has there been previous speech-language therapy or a prior language assessment? If so, when and with what results?",
          placeholderFr: "Ex : Oui, suivi de 6 mois en 2023, travail sur la prononciation...",
          placeholderEn: "E.g.: Yes, 6 months of therapy in 2023, worked on pronunciation...",
        },
        {
          id: "oph_ouv03",
          fr: "Dans quelle(s) situation(s) les difficultés langagières de votre enfant sont-elles les plus visibles ?",
          en: "In which situation(s) are your child's language difficulties most visible?",
          placeholderFr: "Ex : En classe lors des exposés, ou lors des repas en famille...",
          placeholderEn: "E.g.: In class during presentations, or during family meals...",
        },
      ],
    },
  ],
};
