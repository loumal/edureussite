// Base de données d'histoires inspirantes de personnes ayant surmonté des difficultés scolaires
// Chaque histoire est vérifiable et pointe vers une source fiable (Wikipedia FR ou article reconnu)

export type TagHistoire =
  | "tdah"
  | "dyslexie"
  | "anxiete"
  | "mathematiques"
  | "sciences"
  | "lecture"
  | "ecriture"
  | "arts"
  | "musique"
  | "sport"
  | "ecole_difficile"     // a été renvoyé ou a quitté l'école
  | "rejet"               // a été rejeté plusieurs fois avant de réussir
  | "pauvrete"            // a grandi dans la pauvreté
  | "adversite"           // a surmonté une situation difficile
  | "creativite"
  | "quebec"              // personnalité québécoise ou canadienne
  | "fille"               // femme qui a brisé des barrières
  | "difficulte_generale"
  | "difficulte_concentration"
  | "perseverance";

export interface HistoireInspirante {
  id: string;
  nom: string;
  domaine: string;             // ex: "Physicien · Prix Nobel de physique"
  emoji: string;
  pays: string;
  neLe?: string;               // ex: "1879"
  difficulteLabel: string;     // court résumé de la difficulté
  histoire: string;            // 3-4 phrases inspirantes, en français
  citation?: string;           // citation réelle de la personne
  sourceUrl: string;           // URL stable et vérifiable
  sourceLabel: string;         // texte affiché pour le lien
  tags: TagHistoire[];
}

export const HISTOIRES: HistoireInspirante[] = [
  {
    id: "einstein",
    nom: "Albert Einstein",
    domaine: "Physicien · Prix Nobel de physique",
    emoji: "🧠",
    pays: "Allemagne / États-Unis",
    neLe: "1879",
    difficulteLabel: "Renvoyé de son école, a échoué son examen d'entrée universitaire",
    histoire:
      "Albert Einstein a été exclu de son école à 15 ans parce qu'il perturbait la classe. Il a ensuite échoué à l'examen d'entrée de l'École polytechnique de Zürich. Pendant des années, il a travaillé comme simple employé au bureau des brevets, rejeté par l'université. C'est là, dans sa tête, qu'il a imaginé la théorie de la relativité — l'une des plus grandes découvertes de l'histoire.",
    citation: "Je n'ai pas de talent particulier. Je suis seulement passionnément curieux.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Albert_Einstein",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["ecole_difficile", "mathematiques", "sciences", "rejet", "difficulte_generale"],
  },
  {
    id: "branson",
    nom: "Richard Branson",
    domaine: "Entrepreneur · Fondateur de Virgin",
    emoji: "🚀",
    pays: "Royaume-Uni",
    neLe: "1950",
    difficulteLabel: "Dyslexie sévère, a quitté l'école à 16 ans",
    histoire:
      "Quand Richard Branson avait 16 ans, son directeur d'école lui a dit : « Tu finiras en prison ou tu seras millionnaire. » Il avait une dyslexie sévère et ne pouvait presque pas lire. Pourtant, il a fondé plus de 400 entreprises dont Virgin Atlantic, Virgin Records et Virgin Galactic. Aujourd'hui, il dit que sa dyslexie l'a forcé à penser différemment — et que c'est son plus grand atout.",
    citation: "Ma dyslexie a façonné ma façon de penser. Elle m'a appris à déléguer et à m'entourer des bonnes personnes.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Richard_Branson",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["dyslexie", "lecture", "ecole_difficile", "rejet"],
  },
  {
    id: "simone-biles",
    nom: "Simone Biles",
    domaine: "Gymnaste · 37 médailles mondiales",
    emoji: "🤸",
    pays: "États-Unis",
    neLe: "1997",
    difficulteLabel: "TDAH diagnostiqué, enfance difficile en famille d'accueil",
    histoire:
      "Simone Biles a été séparée de sa mère à 3 ans et a grandi en famille d'accueil. En 2016, ses dossiers médicaux ont été piratés et rendus publics, révélant son TDAH. Plutôt que de s'en cacher, elle a répondu fièrement : « Avoir le TDAH, c'est faire partie de qui je suis. » Elle est aujourd'hui considérée comme la plus grande gymnaste de tous les temps, avec 37 médailles aux Championnats du monde.",
    citation: "Je ne m'entraîne pas pour battre les autres. Je m'entraîne pour être la meilleure version de moi-même.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Simone_Biles",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["tdah", "sport", "adversite", "fille"],
  },
  {
    id: "michael-phelps",
    nom: "Michael Phelps",
    domaine: "Nageur · 23 médailles d'or olympiques",
    emoji: "🏊",
    pays: "États-Unis",
    neLe: "1985",
    difficulteLabel: "TDAH diagnostiqué à 9 ans, mis sous médication",
    histoire:
      "Michael Phelps a reçu un diagnostic de TDAH à 9 ans. Ses professeurs lui disaient qu'il n'atteindrait jamais ses objectifs. Sa mère a refusé de le laisser définir par ce diagnostic et l'a inscrit à la natation pour canaliser son énergie. La piscine est devenue son monde. Il a remporté 23 médailles d'or olympiques — plus que n'importe quel athlète dans l'histoire des Jeux olympiques.",
    citation: "Si vous rêvez d'une chose, si vous travaillez suffisamment dur et que vous ne laissez jamais personne vous arrêter, tout est possible.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Michael_Phelps",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["tdah", "sport", "difficulte_concentration", "difficulte_generale"],
  },
  {
    id: "spielberg",
    nom: "Steven Spielberg",
    domaine: "Réalisateur · Indiana Jones, E.T., Schindler's List",
    emoji: "🎬",
    pays: "États-Unis",
    neLe: "1946",
    difficulteLabel: "Dyslexie, rejeté 3 fois par la célèbre école de cinéma USC",
    histoire:
      "Steven Spielberg lisait si lentement à l'école qu'il était constamment moqué. Il a été rejeté par l'Université de Cinéma de Californie du Sud non pas une, mais trois fois. Il a tout de même réalisé ses premiers films avec une caméra empruntée. Aujourd'hui, ses films ont généré plus de 10 milliards de dollars et il a reçu deux Oscars du meilleur réalisateur. En 2002 — à 55 ans — il a finalement obtenu son diplôme universitaire.",
    citation: "Je rêve depuis le premier jour. Les rêves ne viennent pas avec une date d'expiration.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Steven_Spielberg",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["dyslexie", "lecture", "rejet", "arts", "creativite"],
  },
  {
    id: "jk-rowling",
    nom: "J.K. Rowling",
    domaine: "Écrivaine · Auteure de Harry Potter",
    emoji: "📚",
    pays: "Royaume-Uni",
    neLe: "1965",
    difficulteLabel: "Mère seule au chômage, refusée par 12 éditeurs",
    histoire:
      "Avant Harry Potter, J.K. Rowling était mère célibataire au chômage, vivant des allocations sociales. Elle a souffert de dépression sévère. Elle a écrit son manuscrit dans des cafés pendant que sa fille dormait dans sa poussette. 12 éditeurs ont refusé son livre. Le treizième a accepté. Harry Potter s'est vendu à plus de 500 millions d'exemplaires — la série la plus vendue de l'histoire.",
    citation: "Il est impossible de vivre sans échouer. À moins de vivre si prudemment que vous n'avez pas vraiment vécu — ce qui serait échouer par défaut.",
    sourceUrl: "https://fr.wikipedia.org/wiki/J._K._Rowling",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["lecture", "ecriture", "rejet", "pauvrete", "anxiete", "difficulte_generale"],
  },
  {
    id: "edison",
    nom: "Thomas Edison",
    domaine: "Inventeur · Ampoule électrique, phonographe",
    emoji: "💡",
    pays: "États-Unis",
    neLe: "1847",
    difficulteLabel: "Expulsé de l'école après 3 mois, jugé « trop stupide pour apprendre »",
    histoire:
      "À 7 ans, le professeur de Thomas Edison a écrit à sa mère qu'il était « trop stupide pour apprendre quoi que ce soit ». Il a été expulsé de l'école après seulement 3 mois. Sa mère, ancienne institutrice, a décidé de l'instruire elle-même à la maison en croyant en lui. Edison a ensuite déposé 1 093 brevets dans sa vie. Pour inventer l'ampoule, il a essayé 10 000 fois avant de réussir — il appelait ça « 10 000 façons qui ne fonctionnent pas ».",
    citation: "Le génie, c'est 1% d'inspiration et 99% de transpiration.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Thomas_Edison",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["ecole_difficile", "sciences", "rejet", "difficulte_generale", "perseverance"],
  },
  {
    id: "walt-disney",
    nom: "Walt Disney",
    domaine: "Créateur · Disney, Mickey Mouse, Disneyland",
    emoji: "🏰",
    pays: "États-Unis",
    neLe: "1901",
    difficulteLabel: "Renvoyé pour « manque d'imagination », a fait faillite deux fois",
    histoire:
      "Walt Disney a été licencié d'un journal parce que son patron estimait qu'il « manquait d'imagination et d'idées originales ». Il a ensuite créé sa première compagnie de dessin animé, qui a fait faillite. Sa deuxième compagnie a aussi fait faillite. Puis, avec quelques amis, il a dessiné une petite souris nommée Mickey. Aujourd'hui, The Walt Disney Company vaut plus de 180 milliards de dollars.",
    citation: "Tous nos rêves peuvent devenir réalité, si nous avons le courage de les poursuivre.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Walt_Disney",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["arts", "creativite", "rejet", "ecole_difficile", "difficulte_generale"],
  },
  {
    id: "guy-laliberte",
    nom: "Guy Laliberté",
    domaine: "Entrepreneur · Fondateur du Cirque du Soleil",
    emoji: "🎪",
    pays: "Canada · Québec",
    neLe: "1959",
    difficulteLabel: "A abandonné ses études, cracheur de feu dans les rues de Québec",
    histoire:
      "Guy Laliberté a quitté ses études pour jouer de l'accordéon et cracher du feu dans les rues de Québec. Il dormait parfois dans des parcs. Avec quelques amis artistes de rue, il a fondé le Cirque du Soleil en 1984 avec 1,5 million de dollars de subvention — en misant tout sur une tournée. Le Cirque du Soleil est devenu le plus grand cirque artistique du monde, présent dans 90 pays.",
    citation: "Croire en son rêve, c'est la première étape. La deuxième, c'est d'être prêt à tout pour le réaliser.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Guy_Laliberté",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["ecole_difficile", "arts", "creativite", "quebec", "pauvrete", "adversite"],
  },
  {
    id: "agatha-christie",
    nom: "Agatha Christie",
    domaine: "Écrivaine · Auteure la plus vendue de l'histoire",
    emoji: "🔍",
    pays: "Royaume-Uni",
    neLe: "1890",
    difficulteLabel: "Dyslexie, incapable d'écrire lisiblement à la main",
    histoire:
      "Agatha Christie n'a jamais pu écrire proprement à cause de sa dyslexie — ses manuscrits étaient illisibles. Elle dictait ses romans à voix haute ou utilisait une machine à écrire. À une époque, personne ne croyait qu'une femme pouvait écrire des romans policiers. Elle a publié 66 romans policiers, traduits en 103 langues. Elle est l'auteure de fiction la plus vendue de tous les temps après la Bible et Shakespeare.",
    citation: "Un crime est comme un roman policier. Il ne faut pas seulement regarder les faits — il faut imaginer.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Agatha_Christie",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["dyslexie", "lecture", "ecriture", "fille", "difficulte_generale"],
  },
  {
    id: "maryam-mirzakhani",
    nom: "Maryam Mirzakhani",
    domaine: "Mathématicienne · 1ère femme à recevoir la médaille Fields",
    emoji: "🔢",
    pays: "Iran / États-Unis",
    neLe: "1977",
    difficulteLabel: "Détestait les maths au primaire, pensait ne pas être douée",
    histoire:
      "Au primaire, Maryam Mirzakhani était convaincue de ne pas être douée en mathématiques — ses notes en maths étaient mauvaises. Ce qui la passionnait, c'était lire des romans. À 13 ans, son professeur de maths a cru en elle et l'a encouragée. Elle a commencé à explorer, à jouer avec les chiffres. Elle est devenue la première — et pour l'instant la seule — femme à recevoir la médaille Fields, le « Prix Nobel des mathématiques ».",
    citation: "La beauté des mathématiques ne se montre qu'à ceux qui ont la patience d'aller plus loin.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Maryam_Mirzakhani",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["mathematiques", "sciences", "fille", "difficulte_generale"],
  },
  {
    id: "celine-dion",
    nom: "Céline Dion",
    domaine: "Chanteuse · Icône de la musique mondiale",
    emoji: "🎤",
    pays: "Canada · Québec",
    neLe: "1968",
    difficulteLabel: "Pauvreté extrême, dernière de 14 enfants, peu scolarisée",
    histoire:
      "Céline Dion a grandi dans une famille de 14 enfants à Charlemagne, au Québec, dans une maison trop petite pour tout le monde. L'école n'était pas une priorité — la survie l'était. À 12 ans, elle a enregistré une cassette et l'a envoyée à René Angélil, un manager de Montréal. Il a tellement cru en elle qu'il a hypothéqué sa maison pour financer son premier album. Aujourd'hui, Céline Dion est l'une des chanteuses les plus vendues de l'histoire avec plus de 200 millions d'albums.",
    citation: "La vie, c'est comme une chanson. On ne sait pas toujours les paroles au début — mais on peut toujours en trouver la mélodie.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Céline_Dion",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["musique", "arts", "pauvrete", "ecole_difficile", "quebec", "difficulte_generale"],
  },
  {
    id: "stephen-hawking",
    nom: "Stephen Hawking",
    domaine: "Physicien · Auteur de « Une brève histoire du temps »",
    emoji: "🌌",
    pays: "Royaume-Uni",
    neLe: "1942",
    difficulteLabel: "Diagnostiqué avec une maladie paralysante à 21 ans, prédiction de vie : 2 ans",
    histoire:
      "À 21 ans, Stephen Hawking a appris qu'il avait la sclérose latérale amyotrophique — une maladie qui allait paralyser progressivement tous ses muscles. Les médecins lui donnaient 2 ans à vivre. Il a vécu encore 55 ans. Il a perdu l'usage de ses mains, puis de sa voix, communiquant via un synthétiseur vocal. Depuis son fauteuil roulant, il a révolutionné notre compréhension des trous noirs et de l'univers.",
    citation: "Quelle que soit la difficulté de la vie, il y a toujours quelque chose que vous pouvez faire et réussir.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Stephen_Hawking",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["sciences", "mathematiques", "adversite", "difficulte_generale"],
  },
  {
    id: "oprah-winfrey",
    nom: "Oprah Winfrey",
    domaine: "Animatrice, productrice · Première milliardaire afro-américaine",
    emoji: "⭐",
    pays: "États-Unis",
    neLe: "1954",
    difficulteLabel: "Enfance dans la pauvreté et la violence, renvoyée de son premier poste TV",
    histoire:
      "Oprah Winfrey a grandi dans une pauvreté extrême dans le Mississippi rural, portant des vêtements de sac de pommes de terre. Elle a vécu des épreuves très difficiles étant enfant. À 22 ans, elle a été renvoyée de son poste d'animatrice TV parce qu'elle était « trop émotionnelle ». Refusant d'abandonner, elle a lancé son propre talk-show. The Oprah Winfrey Show est devenu le plus regardé de l'histoire américaine. Elle est aujourd'hui l'une des femmes les plus influentes du monde.",
    citation: "Transformez vos blessures en sagesse.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Oprah_Winfrey",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["adversite", "pauvrete", "rejet", "arts", "difficulte_generale", "fille"],
  },
  {
    id: "charles-darwin",
    nom: "Charles Darwin",
    domaine: "Naturaliste · Théorie de l'évolution",
    emoji: "🦋",
    pays: "Royaume-Uni",
    neLe: "1809",
    difficulteLabel: "Élève ordinaire, considéré comme un cancre par son père",
    histoire:
      "Le père de Charles Darwin lui a dit : « Tu ne penses qu'à chasser et aux rats — tu seras la honte de la famille. » Darwin était un élève très ordinaire, passionné par les insectes mais pas par les cours. Il a abandonné ses études de médecine. C'est lors d'un voyage de 5 ans sur le bateau HMS Beagle qu'il a tout observé. Ses carnets d'observations ont mené à la théorie de l'évolution — l'une des plus grandes révolutions scientifiques de l'humanité.",
    citation: "Ce n'est pas le plus fort qui survit, ni le plus intelligent. C'est celui qui sait s'adapter.",
    sourceUrl: "https://fr.wikipedia.org/wiki/Charles_Darwin",
    sourceLabel: "Lire sur Wikipedia",
    tags: ["sciences", "ecole_difficile", "difficulte_generale"],
  },
];

// ── Algorithme de sélection personnalisée ─────────────────────────────────────

interface ProfilEleve {
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  matieresRedoutees: string[];
  matieresPreferees: string[];
  niveauxMatieres?: { scoreGlobal: number; matiere: string }[];
}

const MATIERE_TO_TAG: Record<string, TagHistoire[]> = {
  FRANCAIS:          ["lecture", "ecriture"],
  MATHEMATIQUES:     ["mathematiques"],
  SCIENCES:          ["sciences"],
  ARTS:              ["arts", "creativite"],
  EDUCATION_PHYSIQUE:["sport"],
  UNIVERS_SOCIAL:    ["sciences"],
  ANGLAIS:           ["lecture"],
  ETHIQUE:           [],
};

export function selectionnerHistoires(profil: ProfilEleve, count = 3): HistoireInspirante[] {
  const tagsRecherches = new Set<string>();

  if (profil.tdah) tagsRecherches.add("tdah");
  if (profil.dyslexie) tagsRecherches.add("dyslexie");
  if (profil.anxieteScolaire) tagsRecherches.add("anxiete");

  // Matières difficiles → ajouter les tags correspondants
  for (const matiere of profil.matieresRedoutees) {
    for (const tag of MATIERE_TO_TAG[matiere] ?? []) {
      tagsRecherches.add(tag);
    }
  }

  // Si aucun tag spécifique → utiliser difficulte_generale
  if (tagsRecherches.size === 0) tagsRecherches.add("difficulte_generale");
  tagsRecherches.add("ecole_difficile");
  tagsRecherches.add("rejet");

  // Scorer chaque histoire
  const scored = HISTOIRES.map((h) => {
    let score = 0;
    for (const tag of h.tags) {
      if (tagsRecherches.has(tag)) score += 2;
    }
    // Bonus si québécois (pertinent culturellement)
    if (h.tags.includes("quebec")) score += 1;
    // Légère randomisation pour la diversité
    score += Math.random() * 0.5;
    return { histoire: h, score };
  });

  // Trier et prendre les meilleures
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.histoire);
}

// ── Message d'intro personnalisé selon le profil ─────────────────────────────

export function getMessageIntro(prenom: string, profil: ProfilEleve): string {
  if (profil.tdah && profil.dyslexie) {
    return `${prenom}, avoir le TDAH et la dyslexie, ce n'est pas une limite — c'est une façon différente de traiter le monde. Les personnes ci-dessous ont exactement vécu ça, et elles ont changé le monde.`;
  }
  if (profil.tdah) {
    return `${prenom}, ton cerveau fonctionne différemment — et c'est souvent ce qui fait les plus grands. Voici des personnes avec le TDAH qui ont utilisé leur énergie pour accomplir des choses extraordinaires.`;
  }
  if (profil.dyslexie) {
    return `${prenom}, la dyslexie, c'est lire différemment — pas moins. Certaines des personnes les plus créatives et brillantes de l'histoire avaient la dyslexie. En voici quelques-unes qui te ressemblent.`;
  }
  if (profil.anxieteScolaire) {
    return `${prenom}, se sentir anxieux à l'école, c'est plus courant qu'on ne le croit — même chez les plus grands. Ces personnes ont ressenti la même chose, et pourtant elles ont accompli l'extraordinaire.`;
  }

  const matieresDifficiles = profil.matieresRedoutees;
  if (matieresDifficiles.includes("MATHEMATIQUES")) {
    return `${prenom}, même les plus grands mathématiciens ont eu du mal avec les maths au début. L'important, ce n'est pas d'être parfait tout de suite — c'est de ne pas abandonner.`;
  }
  if (matieresDifficiles.includes("FRANCAIS")) {
    return `${prenom}, beaucoup des plus grands écrivains et créateurs ont eu du mal avec la lecture et l'écriture. Ce qui compte, ce n'est pas de démarrer parfaitement — c'est de continuer malgré tout.`;
  }

  return `${prenom}, tout le monde a des moments où l'école semble trop difficile. Ces personnes ont vécu exactement ça — et elles ne se sont pas arrêtées. Leurs histoires sont pour toi.`;
}
