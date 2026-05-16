import type { Questionnaire } from "./questionnaire-types";

export const questionnaireAnamnese: Questionnaire = {
  domaine: "NEUROPSYCHOLOGUE",
  titreFr: "Anamnèse développementale",
  titreEn: "Developmental history",
  descriptionFr:
    "Ce questionnaire recueille l'historique développemental de votre enfant : antécédents médicaux, étapes du développement, contexte familial et services reçus. Ces informations sont essentielles pour contextualiser l'évaluation.",
  descriptionEn:
    "This questionnaire collects your child's developmental history: medical history, developmental milestones, family context and services received. This information is essential to contextualize the assessment.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "perinatal",
      titreFr: "Antécédents périnataux",
      titreEn: "Perinatal history",
      items: [
        { id: "per01", fr: "La grossesse s'est déroulée avec des complications (santé de la mère, hospitalisation, médicaments).", en: "The pregnancy involved complications (mother's health, hospitalization, medications)." },
        { id: "per02", fr: "L'accouchement a eu lieu prématurément (avant 37 semaines).", en: "Birth occurred prematurely (before 37 weeks)." },
        { id: "per03", fr: "L'enfant a nécessité une hospitalisation prolongée après la naissance.", en: "The child required prolonged hospitalization after birth." },
        { id: "per04", fr: "L'enfant a présenté des difficultés à la naissance (faible poids, jaunisse, problèmes respiratoires).", en: "The child had difficulties at birth (low weight, jaundice, breathing problems)." },
      ],
    },
    {
      id: "developpement_moteur",
      titreFr: "Développement moteur",
      titreEn: "Motor development",
      items: [
        { id: "dmot01", fr: "A atteint les étapes motrices plus tard que les autres enfants (marcher, ramper, s'asseoir).", en: "Reached motor milestones later than other children (walking, crawling, sitting)." },
        { id: "dmot02", fr: "A eu ou a encore des difficultés de coordination ou d'équilibre.", en: "Has had or still has coordination or balance difficulties." },
        { id: "dmot03", fr: "A eu du mal à apprendre à faire du vélo ou à nager.", en: "Had difficulty learning to ride a bike or swim." },
      ],
    },
    {
      id: "developpement_langage",
      titreFr: "Développement du langage",
      titreEn: "Language development",
      items: [
        { id: "dlg01", fr: "A commencé à parler plus tard que les autres enfants de son âge.", en: "Started talking later than other children of the same age." },
        { id: "dlg02", fr: "A eu des difficultés de prononciation qui ont persisté au-delà de 5–6 ans.", en: "Had pronunciation difficulties that persisted beyond age 5–6." },
        { id: "dlg03", fr: "A eu ou a des retards dans l'acquisition du vocabulaire.", en: "Has had or has delays in vocabulary acquisition." },
        { id: "dlg04", fr: "A eu du mal à construire des phrases complètes pour son âge.", en: "Had difficulty constructing complete sentences for his/her age." },
      ],
    },
    {
      id: "antecedents_medicaux",
      titreFr: "Antécédents médicaux",
      titreEn: "Medical history",
      items: [
        { id: "med01", fr: "A été diagnostiqué(e) avec un trouble neurologique, génétique ou développemental.", en: "Has been diagnosed with a neurological, genetic or developmental disorder." },
        { id: "med02", fr: "Prend ou a pris des médicaments pour des difficultés d'attention, d'humeur ou de comportement.", en: "Takes or has taken medication for attention, mood or behavioural difficulties." },
        { id: "med03", fr: "A eu des infections de l'oreille fréquentes ou des problèmes auditifs.", en: "Has had frequent ear infections or hearing problems." },
        { id: "med04", fr: "A eu ou a des problèmes de vision identifiés.", en: "Has had or has identified vision problems." },
        { id: "med05", fr: "A subi des traumatismes crâniens ou des accidents importants.", en: "Has experienced head injuries or significant accidents." },
      ],
    },
    {
      id: "contexte_familial",
      titreFr: "Contexte familial et scolaire",
      titreEn: "Family and school context",
      items: [
        { id: "fam01", fr: "Des membres de la famille immédiate ont des difficultés d'apprentissage ou d'attention similaires.", en: "Immediate family members have similar learning or attention difficulties." },
        { id: "fam02", fr: "L'enfant a vécu des événements stressants importants récemment (déménagement, séparation, deuil).", en: "The child has experienced significant stressful events recently (moving, separation, bereavement)." },
        { id: "fam03", fr: "L'enfant a changé d'école ou de milieu d'apprentissage au cours des deux dernières années.", en: "The child has changed schools or learning environment in the past two years." },
        { id: "fam04", fr: "Il y a des préoccupations liées à la qualité du sommeil de l'enfant.", en: "There are concerns related to the child's sleep quality." },
        { id: "fam05", fr: "L'alimentation ou les habitudes de vie de l'enfant sont source de préoccupation.", en: "The child's diet or lifestyle habits are a source of concern." },
      ],
    },
    {
      id: "services_anterieurs",
      titreFr: "Services et évaluations antérieurs",
      titreEn: "Prior services and assessments",
      items: [
        { id: "srv01", fr: "A déjà reçu une évaluation neuropsychologique ou psychologique.", en: "Has previously received a neuropsychological or psychological assessment." },
        { id: "srv02", fr: "A bénéficié d'un suivi en orthophonie.", en: "Has received speech-language therapy." },
        { id: "srv03", fr: "A bénéficié d'un suivi en ergothérapie.", en: "Has received occupational therapy." },
        { id: "srv04", fr: "A bénéficié d'un suivi en orthopédagogie.", en: "Has received learning support (orthopedagogical services)." },
        { id: "srv05", fr: "A bénéficié d'un plan d'intervention (PI) à l'école.", en: "Has had an individualized education plan (IEP) at school." },
      ],
    },
    {
      id: "ouvertes_anamnese",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "ana_ouv01",
          fr: "Quand avez-vous commencé à remarquer que quelque chose était différent dans le développement ou les apprentissages de votre enfant ? Décrivez.",
          en: "When did you start noticing that something was different in your child's development or learning? Please describe.",
          placeholderFr: "Ex : Dès la maternelle, on nous disait que...",
          placeholderEn: "E.g.: As early as kindergarten, we were told that...",
        },
        {
          id: "ana_ouv02",
          fr: "Résumez les évaluations ou diagnostics déjà posés pour votre enfant, et les recommandations reçues.",
          en: "Summarize any assessments or diagnoses already made for your child, and the recommendations received.",
          placeholderFr: "Ex : TDAH diagnostiqué à 7 ans, médication Biphentin, suivi psy scolaire...",
          placeholderEn: "E.g.: ADHD diagnosed at age 7, Biphentin medication, school psych follow-up...",
        },
        {
          id: "ana_ouv03",
          fr: "Y a-t-il autre chose que vous aimeriez que l'équipe spécialisée sache sur votre enfant ou votre famille ?",
          en: "Is there anything else you would like the specialist team to know about your child or family?",
          placeholderFr: "Informations supplémentaires importantes...",
          placeholderEn: "Additional important information...",
        },
      ],
    },
  ],
};
