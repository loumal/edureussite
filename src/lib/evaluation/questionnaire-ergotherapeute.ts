import type { Questionnaire } from "./questionnaire-types";

export const questionnaireErgotherapeute: Questionnaire = {
  domaine: "ERGOTHERAPEUTE",
  titreFr: "Évaluation des habiletés motrices et sensorielles",
  titreEn: "Motor and sensory skills assessment",
  descriptionFr:
    "Ce questionnaire explore les habiletés motrices fines et globales de votre enfant, son traitement sensoriel, son autonomie dans les activités quotidiennes et sa coordination.",
  descriptionEn:
    "This questionnaire explores your child's fine and gross motor skills, sensory processing, autonomy in daily activities and coordination.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "motricite_fine",
      titreFr: "Motricité fine",
      titreEn: "Fine motor skills",
      items: [
        { id: "mfn01", fr: "A du mal à tenir un crayon ou stylo de façon fonctionnelle.", en: "Has difficulty holding a pencil or pen in a functional way." },
        { id: "mfn02", fr: "Se fatigue rapidement lors de tâches d'écriture.", en: "Tires quickly during writing tasks." },
        { id: "mfn03", fr: "A du mal à découper avec des ciseaux.", en: "Has difficulty cutting with scissors." },
        { id: "mfn04", fr: "Éprouve de la difficulté à boutonner, fermer une fermeture éclair.", en: "Has difficulty buttoning clothes or closing a zipper." },
        { id: "mfn05", fr: "A du mal à utiliser les ustensiles à table de façon appropriée.", en: "Has difficulty using utensils at the table appropriately." },
        { id: "mfn06", fr: "Colorie ou dessine de façon maladroite, sort souvent des lignes.", en: "Colors or draws clumsily, often going outside the lines." },
      ],
    },
    {
      id: "motricite_globale",
      titreFr: "Motricité globale",
      titreEn: "Gross motor skills",
      items: [
        { id: "mgl01", fr: "Trébuche ou manque d'équilibre fréquemment.", en: "Trips or lacks balance frequently." },
        { id: "mgl02", fr: "A du mal à attraper ou lancer un ballon.", en: "Has difficulty catching or throwing a ball." },
        { id: "mgl03", fr: "Évite les activités physiques par manque de confiance dans ses mouvements.", en: "Avoids physical activities due to lack of confidence in his/her movements." },
        { id: "mgl04", fr: "Est maladroit(e) dans ses déplacements (se cogne souvent).", en: "Is clumsy when moving around (bumps into things often)." },
      ],
    },
    {
      id: "traitement_sensoriel",
      titreFr: "Traitement sensoriel",
      titreEn: "Sensory processing",
      items: [
        { id: "sen01", fr: "Est très sensible aux bruits (se bouche les oreilles, est perturbé(e) par l'ambiance sonore).", en: "Is very sensitive to noise (covers ears, is disturbed by the sound environment)." },
        { id: "sen02", fr: "Est dérangé(e) par certaines textures de vêtements ou d'aliments.", en: "Is bothered by certain textures of clothing or food." },
        { id: "sen03", fr: "Est très sensible au toucher (évite d'être touché(e) ou cherche beaucoup de contact physique).", en: "Is very sensitive to touch (avoids being touched or seeks a lot of physical contact)." },
        { id: "sen04", fr: "Semble peu sensible à la douleur ou aux blessures mineures.", en: "Seems to have low sensitivity to pain or minor injuries." },
        { id: "sen05", fr: "Cherche constamment des stimulations sensorielles (se balance, tourne, frappe des objets).", en: "Constantly seeks sensory stimulation (rocks, spins, taps objects)." },
        { id: "sen06", fr: "Est facilement déstabilisé(e) dans des environnements inconnus ou bruyants.", en: "Is easily destabilized in unfamiliar or noisy environments." },
      ],
    },
    {
      id: "autonomie",
      titreFr: "Autonomie dans les activités quotidiennes",
      titreEn: "Autonomy in daily activities",
      items: [
        { id: "aut01", fr: "A du mal à s'habiller seul(e) de façon indépendante.", en: "Has difficulty dressing independently." },
        { id: "aut02", fr: "Éprouve de la difficulté à maintenir une bonne organisation dans son espace de travail.", en: "Has difficulty maintaining good organization in his/her workspace." },
        { id: "aut03", fr: "Oublie fréquemment son matériel scolaire (cahiers, stylos, effaceur).", en: "Frequently forgets school supplies (notebooks, pens, eraser)." },
        { id: "aut04", fr: "A du mal à gérer son temps lors d'activités structurées.", en: "Has difficulty managing time during structured activities." },
        { id: "aut05", fr: "Peine à suivre une routine quotidienne sans aide extérieure.", en: "Struggles to follow a daily routine without external help." },
      ],
    },
    {
      id: "posture_endurance",
      titreFr: "Posture et endurance",
      titreEn: "Posture and endurance",
      items: [
        { id: "pos01", fr: "A du mal à rester assis(e) correctement — s'affaisse, s'appuie sur le bureau.", en: "Has difficulty sitting properly — slumps, leans on the desk." },
        { id: "pos02", fr: "Se fatigue très vite lors de tâches demandant de la concentration.", en: "Gets tired very quickly during tasks requiring concentration." },
        { id: "pos03", fr: "Cherche à s'allonger ou à changer fréquemment de position.", en: "Seeks to lie down or frequently changes position." },
      ],
    },
    {
      id: "ouvertes_ergo",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "ergo_ouv01",
          fr: "Décrivez les activités quotidiennes où votre enfant a le plus de difficultés (repas, habillage, rangement, tâches scolaires).",
          en: "Describe the daily activities where your child has the most difficulty (meals, dressing, tidying, school tasks).",
          placeholderFr: "Ex : Le matin pour s'habiller, il/elle a toujours besoin d'aide pour...",
          placeholderEn: "E.g.: In the morning getting dressed, he/she always needs help with...",
        },
        {
          id: "ergo_ouv02",
          fr: "Y a-t-il des textures, des sons ou des situations sensorielles qui provoquent une réaction forte chez votre enfant ?",
          en: "Are there textures, sounds or sensory situations that trigger a strong reaction in your child?",
          placeholderFr: "Ex : Il/elle ne supporte pas les étiquettes dans ses vêtements...",
          placeholderEn: "E.g.: He/she cannot tolerate clothing tags...",
        },
        {
          id: "ergo_ouv03",
          fr: "Votre enfant a-t-il/elle déjà reçu un suivi en ergothérapie ? Si oui, quand et pour quelles raisons ?",
          en: "Has your child previously received occupational therapy? If so, when and for what reasons?",
          placeholderFr: "Ex : Oui, à l'âge de 5 ans pour des difficultés de motricité fine...",
          placeholderEn: "E.g.: Yes, at age 5 for fine motor difficulties...",
        },
      ],
    },
  ],
};
