import type { Questionnaire } from "./questionnaire-types";

export const questionnairePsychoeducateur: Questionnaire = {
  domaine: "PSYCHOEDUCATEUR",
  titreFr: "Évaluation du bien-être et de l'adaptation scolaire",
  titreEn: "Well-being and school adaptation assessment",
  descriptionFr:
    "Ce questionnaire explore la motivation, l'estime de soi, les comportements d'adaptation et les habiletés sociales de votre enfant dans le contexte scolaire et familial.",
  descriptionEn:
    "This questionnaire explores your child's motivation, self-esteem, adaptive behaviours and social skills in school and family contexts.",
  instructionEchelleFr:
    "Pour chaque affirmation, indiquez à quelle fréquence c'est vrai pour votre enfant : 0 = Jamais ou rarement · 1 = À l'occasion · 2 = Souvent · 3 = Très souvent / tout le temps",
  instructionEchelleEn:
    "For each statement, indicate how often it is true for your child: 0 = Never or rarely · 1 = Sometimes · 2 = Often · 3 = Very often / almost always",
  sections: [
    {
      id: "motivation",
      titreFr: "Motivation scolaire",
      titreEn: "Academic motivation",
      items: [
        { id: "mot01", fr: "Montre peu d'intérêt pour les activités scolaires.", en: "Shows little interest in school activities." },
        { id: "mot02", fr: "Dit souvent qu'il/elle ne voit pas l'utilité d'apprendre.", en: "Often says he/she does not see the point of learning." },
        { id: "mot03", fr: "Ne fournit pas d'efforts quand une tâche lui semble difficile.", en: "Does not put in effort when a task seems difficult." },
        { id: "mot04", fr: "Abandonne rapidement sans essayer.", en: "Gives up quickly without trying." },
        { id: "mot05", fr: "N'exprime jamais de fierté ou de satisfaction quand il/elle réussit.", en: "Never expresses pride or satisfaction when succeeding." },
        { id: "mot06", fr: "A besoin de récompenses extérieures pour s'investir dans les tâches.", en: "Needs external rewards to engage in tasks." },
      ],
    },
    {
      id: "estime_de_soi",
      titreFr: "Estime de soi scolaire",
      titreEn: "Academic self-esteem",
      items: [
        { id: "est01", fr: "Dit souvent qu'il/elle est « nul(le) » ou « stupide ».", en: "Often says he/she is 'dumb' or 'stupid'." },
        { id: "est02", fr: "Croit que ses efforts ne changeront rien à ses résultats.", en: "Believes that effort will not change his/her results." },
        { id: "est03", fr: "Se compare défavorablement à ses camarades.", en: "Unfavourably compares him/herself to classmates." },
        { id: "est04", fr: "Refuse les défis par peur de l'échec ou du ridicule.", en: "Refuses challenges out of fear of failure or ridicule." },
        { id: "est05", fr: "Réagit très mal aux critiques ou aux corrections.", en: "Reacts very poorly to criticism or corrections." },
      ],
    },
    {
      id: "comportement_adaptation",
      titreFr: "Comportements d'adaptation",
      titreEn: "Adaptive behaviours",
      items: [
        { id: "ada01", fr: "Adopte des comportements pour éviter les situations scolaires difficiles (fait semblant d'être malade, refuse d'aller à l'école).", en: "Adopts behaviours to avoid difficult school situations (pretends to be sick, refuses to go to school)." },
        { id: "ada02", fr: "Perturbe la classe pour attirer l'attention ou éviter une tâche.", en: "Disrupts the class to get attention or avoid a task." },
        { id: "ada03", fr: "Défie les règles ou l'autorité de façon répétée.", en: "Repeatedly defies rules or authority." },
        { id: "ada04", fr: "Ment pour éviter les conséquences de ses difficultés scolaires.", en: "Lies to avoid consequences of his/her academic difficulties." },
        { id: "ada05", fr: "S'isole ou refuse de participer aux activités de groupe.", en: "Withdraws or refuses to participate in group activities." },
      ],
    },
    {
      id: "habiletes_sociales",
      titreFr: "Habiletés sociales",
      titreEn: "Social skills",
      items: [
        { id: "soc01", fr: "A du mal à initier ou maintenir des amitiés.", en: "Has difficulty initiating or maintaining friendships." },
        { id: "soc02", fr: "N'arrive pas à gérer les conflits de façon appropriée.", en: "Cannot manage conflicts in an appropriate way." },
        { id: "soc03", fr: "Est facilement influençable par ses pairs.", en: "Is easily influenced by peers." },
        { id: "soc04", fr: "A du mal à lire les expressions faciales ou les signaux sociaux.", en: "Has difficulty reading facial expressions or social cues." },
        { id: "soc05", fr: "Est souvent victime ou auteur d'intimidation.", en: "Is often a victim or perpetrator of bullying." },
      ],
    },
    {
      id: "stress_scolaire",
      titreFr: "Stress et refus scolaire",
      titreEn: "School stress and refusal",
      items: [
        { id: "str01", fr: "Présente des symptômes physiques (maux de ventre, de tête) les matins d'école.", en: "Has physical symptoms (stomach ache, headache) on school mornings." },
        { id: "str02", fr: "Pleure ou fait des crises avant d'aller à l'école.", en: "Cries or has tantrums before going to school." },
        { id: "str03", fr: "A des cauchemars ou des troubles du sommeil liés à l'école.", en: "Has nightmares or sleep disturbances related to school." },
        { id: "str04", fr: "Exprime une forte anxiété à l'idée des examens ou des évaluations.", en: "Expresses strong anxiety about tests or assessments." },
      ],
    },
    {
      id: "ouvertes_psy",
      titreFr: "Questions ouvertes",
      titreEn: "Open questions",
      questions: [
        {
          id: "psy_ouv01",
          fr: "Comment décririez-vous l'attitude générale de votre enfant envers l'école ? A-t-elle changé au fil du temps ?",
          en: "How would you describe your child's general attitude toward school? Has it changed over time?",
          placeholderFr: "Ex : Il/elle aimait l'école en maternelle mais depuis le primaire...",
          placeholderEn: "E.g.: He/she enjoyed school in kindergarten but since elementary school...",
        },
        {
          id: "psy_ouv02",
          fr: "Y a-t-il eu des événements importants dans la vie de votre enfant (déménagement, séparation, deuil, changement d'école) qui pourraient expliquer certaines difficultés ?",
          en: "Have there been significant events in your child's life (moving, separation, bereavement, school change) that might explain some difficulties?",
          placeholderFr: "Ex : Séparation des parents il y a 2 ans, changement d'école en septembre...",
          placeholderEn: "E.g.: Parents' separation 2 years ago, school change in September...",
        },
        {
          id: "psy_ouv03",
          fr: "Votre enfant bénéficie-t-il/elle d'un suivi psychologique ou psychoéducatif actuellement ? Si oui, lequel ?",
          en: "Is your child currently receiving psychological or psychoeducational support? If so, what kind?",
          placeholderFr: "Ex : Oui, rencontres avec un psychologue scolaire toutes les deux semaines...",
          placeholderEn: "E.g.: Yes, meetings with a school psychologist every two weeks...",
        },
      ],
    },
  ],
};
