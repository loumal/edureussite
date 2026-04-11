import type { PrismaClient, Matiere, NiveauScolaire, Province } from "@/generated/prisma";

const TYPE_LABEL: Record<string, string> = {
  RECHERCHE_SCIENTIFIQUE: "Recherche scientifique",
  GUIDE_PEDAGOGIQUE: "Guide pédagogique",
  STRATEGIE_INTERVENTION: "Stratégie d'intervention",
  RESULTAT_ETUDE: "Résultat d'étude",
  RESSOURCE_PARENTALE: "Ressource parentale",
  AUTRE: "Document",
};

export interface ContexteOptions {
  matiere?: Matiere;
  niveauScolaire?: NiveauScolaire;
  province?: Province;
}

export async function getContexteDocuments(
  prisma: PrismaClient,
  options?: ContexteOptions
): Promise<string> {
  const { matiere, niveauScolaire, province = "QC" } = options ?? {};

  // Filtre intelligent : documents sans restriction OU documents correspondant à la matière/niveau
  // + filtre par province : retourne uniquement les documents de la province de l'élève
  const docs = await prisma.documentPedagogique.findMany({
    where: {
      actif: true,
      province,
      ...(matiere || niveauScolaire
        ? {
            AND: [
              matiere
                ? { OR: [{ matieres: { isEmpty: true } }, { matieres: { has: matiere } }] }
                : {},
              niveauScolaire
                ? { OR: [{ niveaux: { isEmpty: true } }, { niveaux: { has: niveauScolaire } }] }
                : {},
            ],
          }
        : {}),
    },
    orderBy: [{ type: "asc" }, { annee: "desc" }],
    take: 20,
  });

  if (docs.length === 0) return "";

  const sections = docs.map((d) => {
    const meta: string[] = [];
    if (d.auteurs) meta.push(`Auteurs : ${d.auteurs}`);
    if (d.annee) meta.push(`Année : ${d.annee}`);
    if (d.source) meta.push(`Source : ${d.source}`);
    if (d.motsCles.length > 0) meta.push(`Mots-clés : ${d.motsCles.join(", ")}`);
    if (d.matieres.length > 0) meta.push(`Matières : ${d.matieres.join(", ")}`);
    if (d.niveaux.length > 0) meta.push(`Niveaux : ${d.niveaux.join(", ")}`);

    return `--- [${TYPE_LABEL[d.type] ?? d.type}] ${d.titre} ---
${meta.length > 0 ? meta.join(" | ") + "\n" : ""}${d.contenu}`;
  });

  return `
═══ DOCUMENTS PÉDAGOGIQUES ET RECHERCHES DE RÉFÉRENCE ═══
Les documents suivants ont été sélectionnés par l'équipe ÉduRéussite QC pour enrichir votre analyse. Intégrez leurs enseignements dans vos recommandations lorsqu'ils sont pertinents au profil de l'élève.

${sections.join("\n\n")}

═══ FIN DES DOCUMENTS DE RÉFÉRENCE ═══
`;
}
