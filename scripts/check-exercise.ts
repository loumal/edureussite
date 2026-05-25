import "dotenv/config";
import { prisma } from "@/lib/prisma/client";

async function main() {
  // Quebec time 18:04 = UTC 22:04 on 2026-05-20
  const from = new Date("2026-05-20T21:45:00Z");
  const to   = new Date("2026-05-20T22:30:00Z");

  // Find eleve named Charbel
  const eleve = await prisma.profilEleve.findFirst({
    where: { prenom: { contains: "Charbel", mode: "insensitive" } },
    select: { id: true, prenom: true, nom: true },
  });
  console.log("Élève:", eleve);

  if (!eleve) {
    console.log("Élève introuvable — cherche tous les exercices récents...");
  }

  // Recent exercises around 18:04 Quebec (22:04 UTC)
  const exercices = await prisma.exerciceAssigne.findMany({
    where: {
      ...(eleve ? { eleveId: eleve.id } : {}),
      dateAssignation: { gte: from, lte: to },
    },
    include: {
      exercice: { select: { id: true, titre: true, type: true, contenu: true, createdAt: true } },
      eleve:    { select: { prenom: true, nom: true } },
    },
    orderBy: { dateAssignation: "desc" },
  });

  console.log(`\nExercices trouvés entre 21:45 et 22:30 UTC: ${exercices.length}`);
  for (const a of exercices) {
    console.log(`\n--- ${a.eleve.prenom} ${a.eleve.nom} ---`);
    console.log("  ID exercice :", a.exercice.id);
    console.log("  Titre       :", a.exercice.titre);
    console.log("  Type        :", a.exercice.type);
    console.log("  CreatedAt   :", a.exercice.createdAt);
    console.log("  Contenu     :", JSON.stringify(a.exercice.contenu, null, 2));
  }

  // Also look for broader window if nothing found
  if (exercices.length === 0) {
    const broader = await prisma.exerciceAssigne.findMany({
      where: { eleve: { prenom: { contains: "Charbel", mode: "insensitive" } } },
      include: { exercice: { select: { id: true, titre: true, type: true, contenu: true, createdAt: true } } },
      orderBy: { dateAssignation: "desc" },
      take: 5,
    });
    console.log("\nDerniers exercices de Charbel (tous):");
    for (const a of broader) {
      console.log(`  ${a.exercice.createdAt} — ${a.exercice.titre} [${a.exercice.type}]`);
      console.log("  Contenu:", JSON.stringify(a.exercice.contenu));
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
