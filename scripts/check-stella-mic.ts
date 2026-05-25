import "dotenv/config";
import { prisma } from "@/lib/prisma/client";

async function main() {
  // Provider STT & TTS actifs
  const stt = await prisma.parametreApp.findUnique({ where: { cle: "config_stt_provider" } });
  const tts = await prisma.parametreApp.findUnique({ where: { cle: "config_tts_provider" } });
  console.log("STT provider :", stt?.valeur ?? "ELEVENLABS (défaut)");
  console.log("TTS provider :", tts?.valeur ?? "ELEVENLABS (défaut)");

  // Trouver Marie Stella
  const stella = await prisma.profilEleve.findFirst({
    where: {
      OR: [
        { prenom: { contains: "stella", mode: "insensitive" } },
        { nom:    { contains: "stella", mode: "insensitive" } },
        { prenom: { contains: "marie",  mode: "insensitive" } },
      ],
    },
    select: { id: true, prenom: true, nom: true, niveauScolaire: true, userId: true },
  });
  console.log("\nÉlève trouvé :", stella);

  // Si trouvé, vérifier ses sessions récentes
  if (stella) {
    const sessions = await prisma.sessionPratique.findMany({
      where: { eleveId: stella.id },
      orderBy: { dateSession: "desc" },
      take: 3,
      select: { id: true, dateSession: true, dureeSecondes: true },
    });
    console.log("Sessions récentes :", JSON.stringify(sessions, null, 2));
  }

  // Vérifier les clés API configurées dans les env vars
  console.log("\n--- Clés API ---");
  console.log("ELEVENLABS_API_KEY :", process.env.ELEVENLABS_API_KEY ? "✓ présente" : "✗ ABSENTE");
  console.log("DEEPGRAM_API_KEY   :", process.env.DEEPGRAM_API_KEY   ? "✓ présente" : "✗ ABSENTE");
  console.log("OPENAI_API_KEY     :", process.env.OPENAI_API_KEY     ? "✓ présente" : "✗ ABSENTE");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
