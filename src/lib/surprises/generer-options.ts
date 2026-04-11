/**
 * Génère 3 suggestions de surprises personnalisées selon le profil de l'enfant.
 * Aucun appel IA — règles basées sur les centres d'intérêt.
 */

interface ProfilPourOptions {
  prenom: string;
  centresInteret?: string[];
  sportFavori?: string | null;
  universMediatique?: string | null;
  autresPassions?: string | null;
}

// Options génériques toujours pertinentes
const OPTIONS_GENERIQUES = [
  "Choisir le film ou la série du soir en famille",
  "Cuisiner ensemble le plat qu'il préfère",
  "Une sortie surprise à choisir ensemble",
  "Choisir l'activité du week-end",
  "Un livre sur un sujet qu'il adore",
  "Rester debout 30 minutes de plus ce soir",
  "Inviter un ami à souper",
  "Choisir le restaurant pour le prochain repas en famille",
];

// Options par centre d'intérêt
const OPTIONS_PAR_INTERET: Record<string, string[]> = {
  SOCCER:        ["Assister à un match de soccer", "Un équipement de soccer", "Regarder un grand match ensemble"],
  HOCKEY:        ["Patiner ensemble", "Un équipement de hockey", "Regarder une partie de hockey"],
  BASKETBALL:    ["Jouer au basketball ensemble", "Un équipement de basketball"],
  NATATION:      ["Une sortie à la piscine ou au parc aquatique"],
  DANSE:         ["Un cours de danse de son choix", "Une soirée danse à la maison"],
  MUSIQUE:       ["Télécharger ses chansons préférées", "Un cours de l'instrument qu'il aime"],
  DESSIN:        ["Un kit de dessin ou de peinture", "Visiter un musée ou une galerie d'art"],
  LECTURE:       ["Choisir un livre dans sa librairie préférée", "Une heure de lecture tranquille ensemble"],
  JEUX_VIDEO:    ["Une heure de jeu vidéo supplémentaire en famille", "Choisir un nouveau jeu à essayer ensemble"],
  MANGA:         ["Un nouveau tome de son manga préféré", "Regarder un anime ensemble"],
  CUISINE:       ["Préparer ensemble une recette qu'il choisit", "Visiter une épicerie spécialisée"],
  SCIENCE:       ["Un kit d'expériences scientifiques", "Visiter un musée des sciences"],
  ANIMAUX:       ["Visiter un refuge ou une animalerie", "Une journée dans un parc nature"],
  CINEMA:        ["Soirée cinéma avec ses films préférés", "Aller au cinéma choisir le film"],
  CAMPING:       ["Une nuit en tente dans le jardin ou en forêt"],
  VOYAGE:        ["Explorer une nouvelle ville ou quartier ensemble"],
};

export function genererOptionsSurprise(profil: ProfilPourOptions): string[] {
  const suggestions = new Set<string>();

  // Options basées sur les centres d'intérêt
  for (const interet of profil.centresInteret ?? []) {
    const opts = OPTIONS_PAR_INTERET[interet.toUpperCase()];
    if (opts) {
      for (const opt of opts) {
        suggestions.add(opt);
        if (suggestions.size >= 6) break;
      }
    }
    if (suggestions.size >= 6) break;
  }

  // Options basées sur le sport favori (texte libre)
  if (profil.sportFavori && suggestions.size < 6) {
    suggestions.add(`Une activité liée à ${profil.sportFavori}`);
  }

  // Compléter avec les génériques si pas assez
  for (const opt of OPTIONS_GENERIQUES) {
    if (suggestions.size >= 6) break;
    suggestions.add(opt);
  }

  // Retourner exactement 3 (les plus pertinentes en premier)
  return [...suggestions].slice(0, 3);
}
