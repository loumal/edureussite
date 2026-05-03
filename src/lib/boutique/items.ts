export type CategorieItem = "avatar" | "titre";

export interface ItemBoutique {
  id: string;
  categorie: CategorieItem;
  label: string;
  emoji: string;
  description: string;
  prix: number; // 0 = gratuit/par défaut
  gradient?: string; // Tailwind gradient classes for avatars
  couleurTitre?: string; // CSS color for title text
  defaut?: boolean; // item de départ, toujours débloqué
}

// ── AVATARS ──────────────────────────────────────────────────────────────────
// Chaque avatar change le fond du cercle de profil dans la nav + boutique

export const AVATARS: ItemBoutique[] = [
  {
    id: "avatar_violet",
    categorie: "avatar",
    label: "Violet Classique",
    emoji: "🟣",
    description: "Le look de départ.",
    prix: 0,
    gradient: "from-[#5B4FCF] to-[#9C27B0]",
    defaut: true,
  },
  {
    id: "avatar_soleil",
    categorie: "avatar",
    label: "Soleil d'Or",
    emoji: "☀️",
    description: "Brille comme le soleil !",
    prix: 200,
    gradient: "from-[#F59E0B] to-[#EF4444]",
  },
  {
    id: "avatar_ocean",
    categorie: "avatar",
    label: "Bleu Océan",
    emoji: "🌊",
    description: "Aussi profond que la mer.",
    prix: 400,
    gradient: "from-[#0EA5E9] to-[#6366F1]",
  },
  {
    id: "avatar_feu",
    categorie: "avatar",
    label: "Feu Ardent",
    emoji: "🔥",
    description: "Pour les esprits enflammés.",
    prix: 700,
    gradient: "from-[#EF4444] to-[#F97316]",
  },
  {
    id: "avatar_foret",
    categorie: "avatar",
    label: "Forêt Enchantée",
    emoji: "🌿",
    description: "Mystérieux et naturel.",
    prix: 1000,
    gradient: "from-[#10B981] to-[#0D9488]",
  },
  {
    id: "avatar_bonbon",
    categorie: "avatar",
    label: "Bonbon Rose",
    emoji: "🍬",
    description: "Doux et pétillant !",
    prix: 1200,
    gradient: "from-[#EC4899] to-[#A855F7]",
  },
  {
    id: "avatar_galaxie",
    categorie: "avatar",
    label: "Galaxie",
    emoji: "🌌",
    description: "Parmi les étoiles.",
    prix: 2000,
    gradient: "from-[#1E1B4B] to-[#4F46E5]",
  },
  {
    id: "avatar_arc_en_ciel",
    categorie: "avatar",
    label: "Arc-en-ciel",
    emoji: "🌈",
    description: "Le plus rare de tous !",
    prix: 3500,
    gradient: "from-[#F43F5E] via-[#F59E0B] to-[#3B82F6]",
  },
];

// ── TITRES ────────────────────────────────────────────────────────────────────
// Un titre décoratif affiché sous le nom dans le menu + dashboard hero

export const TITRES: ItemBoutique[] = [
  {
    id: "titre_aucun",
    categorie: "titre",
    label: "Sans titre",
    emoji: "—",
    description: "Aucun titre affiché.",
    prix: 0,
    defaut: true,
  },
  {
    id: "titre_curieux",
    categorie: "titre",
    label: "Curieux·se",
    emoji: "🔍",
    description: "Pour ceux qui posent des questions.",
    prix: 150,
    couleurTitre: "#0EA5E9",
  },
  {
    id: "titre_champion",
    categorie: "titre",
    label: "Champion·ne",
    emoji: "🏆",
    description: "Mérité avec brio.",
    prix: 500,
    couleurTitre: "#F59E0B",
  },
  {
    id: "titre_prodige",
    categorie: "titre",
    label: "Prodige",
    emoji: "⚡",
    description: "Talent naturel reconnu.",
    prix: 1000,
    couleurTitre: "#8B5CF6",
  },
  {
    id: "titre_explorateur",
    categorie: "titre",
    label: "Grand·e Explorateur·trice",
    emoji: "🗺️",
    description: "Aucune notion ne te résiste.",
    prix: 1500,
    couleurTitre: "#10B981",
  },
  {
    id: "titre_legendaire",
    categorie: "titre",
    label: "Légendaire",
    emoji: "🌟",
    description: "Le titre ultime.",
    prix: 4000,
    couleurTitre: "#F43F5E",
  },
];

export const TOUS_LES_ITEMS: ItemBoutique[] = [...AVATARS, ...TITRES];

// ── Helpers ───────────────────────────────────────────────────────────────────

export interface Cosmetiques {
  debloquesIds: string[];
  avatarEquipe: string;
  titreEquipe: string;
}

export const COSMETIQUES_DEFAUT: Cosmetiques = {
  debloquesIds: ["avatar_violet", "titre_aucun"],
  avatarEquipe: "avatar_violet",
  titreEquipe: "titre_aucun",
};

export function parseCosmetiques(raw: unknown): Cosmetiques {
  if (!raw || typeof raw !== "object") return COSMETIQUES_DEFAUT;
  const c = raw as Partial<Cosmetiques>;
  return {
    debloquesIds: Array.isArray(c.debloquesIds) ? c.debloquesIds : COSMETIQUES_DEFAUT.debloquesIds,
    avatarEquipe: c.avatarEquipe ?? COSMETIQUES_DEFAUT.avatarEquipe,
    titreEquipe: c.titreEquipe ?? COSMETIQUES_DEFAUT.titreEquipe,
  };
}

export function getGradientAvatar(avatarId: string): string {
  const item = AVATARS.find((a) => a.id === avatarId);
  return item?.gradient ?? "from-[#5B4FCF] to-[#9C27B0]";
}

export function getTitreEquipe(titreId: string): ItemBoutique | null {
  if (titreId === "titre_aucun") return null;
  return TITRES.find((t) => t.id === titreId) ?? null;
}
