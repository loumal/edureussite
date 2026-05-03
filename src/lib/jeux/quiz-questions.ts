export interface QuizQuestion {
  q: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  categorie: "maths" | "francais" | "sciences" | "culture" | "quebec";
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── MATHÉMATIQUES ────────────────────────────────────────────────────────────
  { q: "Combien font 7 × 8 ?", options: ["54", "56", "63", "48"], correct: 1, categorie: "maths" },
  { q: "Quel est le double de 36 ?", options: ["62", "68", "72", "76"], correct: 2, categorie: "maths" },
  { q: "Combien font 144 ÷ 12 ?", options: ["10", "11", "12", "13"], correct: 2, categorie: "maths" },
  { q: "Quelle est la racine carrée de 81 ?", options: ["7", "8", "9", "10"], correct: 2, categorie: "maths" },
  { q: "Un triangle a combien de côtés ?", options: ["2", "3", "4", "5"], correct: 1, categorie: "maths" },
  { q: "Combien font 15 % de 200 ?", options: ["20", "25", "30", "35"], correct: 2, categorie: "maths" },
  { q: "Quelle est la valeur de π (arrondi) ?", options: ["2,14", "3,14", "4,14", "5,14"], correct: 1, categorie: "maths" },
  { q: "Combien font 2³ ?", options: ["6", "8", "9", "12"], correct: 1, categorie: "maths" },
  { q: "Quel est le périmètre d'un carré de côté 5 cm ?", options: ["10 cm", "15 cm", "20 cm", "25 cm"], correct: 2, categorie: "maths" },
  { q: "Combien font 1000 × 0,001 ?", options: ["0,1", "1", "10", "100"], correct: 1, categorie: "maths" },
  { q: "Quelle fraction est égale à 0,75 ?", options: ["1/2", "2/3", "3/4", "4/5"], correct: 2, categorie: "maths" },
  { q: "Combien font 3² + 4² ?", options: ["14", "25", "49", "7"], correct: 1, categorie: "maths" },
  { q: "Quel est l'aire d'un rectangle 6 cm × 4 cm ?", options: ["20 cm²", "24 cm²", "28 cm²", "18 cm²"], correct: 1, categorie: "maths" },
  { q: "Combien font 500 + 375 + 125 ?", options: ["900", "950", "1000", "1050"], correct: 2, categorie: "maths" },
  { q: "Quel nombre est premier ?", options: ["21", "27", "29", "33"], correct: 2, categorie: "maths" },

  // ── FRANÇAIS ─────────────────────────────────────────────────────────────────
  { q: "Quel est le féminin de « acteur » ?", options: ["Acteure", "Actrice", "Acteuse", "Acteurse"], correct: 1, categorie: "francais" },
  { q: "Quelle phrase est correcte ?", options: ["Il sont parti.", "Ils sont partis.", "Ils est partis.", "Ils sont partie."], correct: 1, categorie: "francais" },
  { q: "Quel mot est un adjectif ?", options: ["Courir", "Rapidement", "Rapide", "Rapidité"], correct: 2, categorie: "francais" },
  { q: "Quel est le pluriel de « bijou » ?", options: ["Bijous", "Bijoux", "Bijoues", "Bijouaux"], correct: 1, categorie: "francais" },
  { q: "Quelle figure de style est « ton sourire est un soleil » ?", options: ["Métaphore", "Comparaison", "Personnification", "Hyperbole"], correct: 0, categorie: "francais" },
  { q: "Quel auteur a écrit « Les Misérables » ?", options: ["Molière", "Victor Hugo", "Voltaire", "Zola"], correct: 1, categorie: "francais" },
  { q: "Quel est l'antonyme de « courageux » ?", options: ["Fort", "Peureux", "Timide", "Lâche"], correct: 3, categorie: "francais" },
  { q: "Combien y a-t-il de syllabes dans « extraordinaire » ?", options: ["4", "5", "6", "7"], correct: 2, categorie: "francais" },
  { q: "Quelle est la nature du mot « vraiment » ?", options: ["Adjectif", "Verbe", "Adverbe", "Nom"], correct: 2, categorie: "francais" },
  { q: "Quel temps est « il aurait mangé » ?", options: ["Conditionnel présent", "Conditionnel passé", "Subjonctif", "Plus-que-parfait"], correct: 1, categorie: "francais" },

  // ── SCIENCES ─────────────────────────────────────────────────────────────────
  { q: "Quelle planète est la plus proche du Soleil ?", options: ["Vénus", "Mars", "Mercure", "Terre"], correct: 2, categorie: "sciences" },
  { q: "De quoi est composée l'eau ?", options: ["H₂O", "CO₂", "O₂", "H₂S"], correct: 0, categorie: "sciences" },
  { q: "Quel organe pompe le sang ?", options: ["Poumons", "Foie", "Rein", "Cœur"], correct: 3, categorie: "sciences" },
  { q: "Quelle est la vitesse de la lumière ?", options: ["100 000 km/s", "200 000 km/s", "300 000 km/s", "400 000 km/s"], correct: 2, categorie: "sciences" },
  { q: "Combien d'os a le corps humain adulte ?", options: ["106", "186", "206", "256"], correct: 2, categorie: "sciences" },
  { q: "Quelle est la formule du dioxyde de carbone ?", options: ["CO", "CO₂", "C₂O", "C₂O₂"], correct: 1, categorie: "sciences" },
  { q: "Quel animal est un mammifère ?", options: ["Tortue", "Requin", "Dauphin", "Grenouille"], correct: 2, categorie: "sciences" },
  { q: "Quelle planète a les anneaux les plus visibles ?", options: ["Jupiter", "Uranus", "Neptune", "Saturne"], correct: 3, categorie: "sciences" },
  { q: "Que produit la photosynthèse ?", options: ["CO₂ + Eau", "O₂ + Glucose", "Azote + Eau", "CO₂ + Glucose"], correct: 1, categorie: "sciences" },
  { q: "Quelle est l'unité de mesure de l'électricité (intensité) ?", options: ["Volt", "Watt", "Ampère", "Ohm"], correct: 2, categorie: "sciences" },

  // ── CULTURE GÉNÉRALE ─────────────────────────────────────────────────────────
  { q: "Combien de pays sont membres de l'ONU ?", options: ["153", "173", "193", "213"], correct: 2, categorie: "culture" },
  { q: "Quel est le pays le plus grand du monde ?", options: ["Canada", "Chine", "États-Unis", "Russie"], correct: 3, categorie: "culture" },
  { q: "Quel sport se joue avec un volant ?", options: ["Tennis", "Badminton", "Squash", "Ping-pong"], correct: 1, categorie: "culture" },
  { q: "Qui a peint la Joconde ?", options: ["Michel-Ange", "Picasso", "Léonard de Vinci", "Raphaël"], correct: 2, categorie: "culture" },
  { q: "Quelle est la monnaie du Japon ?", options: ["Yuan", "Won", "Yen", "Ringgit"], correct: 2, categorie: "culture" },
  { q: "Quelle est la plus haute montagne du monde ?", options: ["K2", "Mont Blanc", "Aconcagua", "Everest"], correct: 3, categorie: "culture" },
  { q: "Quel pays a inventé les pâtes ?", options: ["France", "Grèce", "Italie", "Chine"], correct: 3, categorie: "culture" },
  { q: "Combien d'anneaux compte le drapeau olympique ?", options: ["4", "5", "6", "7"], correct: 1, categorie: "culture" },
  { q: "Quel instrument a 88 touches ?", options: ["Orgue", "Piano", "Accordéon", "Synthétiseur"], correct: 1, categorie: "culture" },
  { q: "Qui a écrit Harry Potter ?", options: ["Tolkien", "Rowling", "Lewis", "Martin"], correct: 1, categorie: "culture" },

  // ── CULTURE QUÉBÉCOISE ───────────────────────────────────────────────────────
  { q: "Quelle ville est la capitale du Québec ?", options: ["Montréal", "Québec", "Laval", "Gatineau"], correct: 1, categorie: "quebec" },
  { q: "Quel est le symbole de la fête nationale du Québec ?", options: ["Érable", "Fleur de lys", "Castor", "Orignal"], correct: 1, categorie: "quebec" },
  { q: "Quel fleuve traverse le Québec ?", options: ["Mississippi", "Saint-Laurent", "Ottawa", "Richelieu"], correct: 1, categorie: "quebec" },
  { q: "Quel sport est considéré comme le sport national du Canada ?", options: ["Football", "Baseball", "Hockey", "Curling"], correct: 2, categorie: "quebec" },
  { q: "Quelle plante donne le sirop d'érable ?", options: ["Bouleau", "Érablière", "Chêne", "Érable à sucre"], correct: 3, categorie: "quebec" },
  { q: "Quel est le prénom du fondateur de Montréal ?", options: ["Jacques", "Samuel", "Paul", "Pierre"], correct: 2, categorie: "quebec" },
  { q: "Quel animal figure sur les armoiries du Québec ?", options: ["Orignal", "Castor", "Lion", "Aigle"], correct: 2, categorie: "quebec" },
  { q: "En quelle année la loi 101 a-t-elle été adoptée ?", options: ["1967", "1977", "1987", "1997"], correct: 1, categorie: "quebec" },
  { q: "Quelle ville accueille le Festival de Jazz ?", options: ["Québec", "Laval", "Montréal", "Sherbrooke"], correct: 2, categorie: "quebec" },
  { q: "Quel est le surnom de l'équipe de hockey de Montréal ?", options: ["Les Sénateurs", "Le Canadien", "Le Tricolore", "Les Glorieux"], correct: 3, categorie: "quebec" },
];

export function getRandomQuestions(n = 10): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
