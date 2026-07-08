import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { anthropic } from "@/lib/ai/client";
import { NiveauScolaire } from "@/generated/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const POOL_MIN = 10; // textes minimum par niveau dans le cache

const MOTS_PAR_NIVEAU: Partial<Record<NiveauScolaire, number>> = {
  PRIMAIRE_1: 110, PRIMAIRE_2: 150, PRIMAIRE_3: 200,
  PRIMAIRE_4: 260, PRIMAIRE_5: 320, PRIMAIRE_6: 380,
  SECONDAIRE_1: 430, SECONDAIRE_2: 480, SECONDAIRE_3: 530,
  SECONDAIRE_4: 580, SECONDAIRE_5: 620, SECONDAIRE_6: 650, SECONDAIRE_7: 680,
};

const NIVEAU_LABEL: Partial<Record<NiveauScolaire, string>> = {
  PRIMAIRE_1: "1re année primaire (6 ans)", PRIMAIRE_2: "2e année primaire (7 ans)",
  PRIMAIRE_3: "3e année primaire (8 ans)", PRIMAIRE_4: "4e année primaire (9 ans)",
  PRIMAIRE_5: "5e année primaire (10 ans)", PRIMAIRE_6: "6e année primaire (11 ans)",
  SECONDAIRE_1: "1re secondaire (12 ans)", SECONDAIRE_2: "2e secondaire (13 ans)",
  SECONDAIRE_3: "3e secondaire (14 ans)", SECONDAIRE_4: "4e secondaire (15 ans)",
  SECONDAIRE_5: "5e secondaire (16 ans)", SECONDAIRE_6: "6e secondaire (17 ans)", SECONDAIRE_7: "Terminale (18 ans)",
};

const NIVEAUX_ACTIFS: NiveauScolaire[] = [
  "PRIMAIRE_1", "PRIMAIRE_2", "PRIMAIRE_3", "PRIMAIRE_4", "PRIMAIRE_5", "PRIMAIRE_6",
  "SECONDAIRE_1", "SECONDAIRE_2", "SECONDAIRE_3", "SECONDAIRE_4", "SECONDAIRE_5",
];

async function genererTexteEtQuestions(niveau: NiveauScolaire): Promise<{ texte: string; nbMots: number; questionsJson: string } | null> {
  const nbMots = MOTS_PAR_NIVEAU[niveau] ?? 300;
  const label = NIVEAU_LABEL[niveau] ?? niveau;

  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Tu es un orthopédagogue. Génère un texte de lecture engageant ET 5 questions de compréhension Giasson pour un élève de ${label}.

Texte : ${nbMots} mots (±15%), narratif ou informatif, début accrocheur, français québécois naturel, aucune violence, thème varié et positif.

RÉPONDS UNIQUEMENT avec ce JSON :
{"texte":"Le texte complet ici...","questions":[{"id":"q1","niveau":"MICROPROCESSUS","question":"..."},{"id":"q2","niveau":"INTEGRATION","question":"..."},{"id":"q3","niveau":"MACROPROCESSUS","question":"..."},{"id":"q4","niveau":"ELABORATION_CAUSAL","question":"..."},{"id":"q5","niveau":"ELABORATION_PREDICTIF","question":"..."}]}`,
      }],
    });

    const raw = resp.content[0].type === "text" ? resp.content[0].text : "{}";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned) as { texte?: string; questions?: object[] };

    if (!parsed.texte || !parsed.questions?.length) return null;

    const texte = parsed.texte.trim();
    const nbMosFinal = texte.split(/\s+/).filter(Boolean).length;

    return {
      texte,
      nbMots: nbMosFinal,
      questionsJson: JSON.stringify(parsed.questions),
    };
  } catch (err) {
    console.error(`[prefill-lecture] erreur génération niveau ${niveau}:`, err);
    return null;
  }
}

// GET /api/cron/prefill-lecture-cache
// Appelé par Vercel Cron (toutes les heures). Maintient le pool à POOL_MIN textes par niveau.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const stats: Record<string, { avant: number; ajoutes: number }> = {};
  let totalAjoutes = 0;

  for (const niveau of NIVEAUX_ACTIFS) {
    const count = await prisma.texteLectureCache.count({ where: { niveauScolaire: niveau } });
    const manquants = Math.max(0, POOL_MIN - count);
    stats[niveau] = { avant: count, ajoutes: 0 };

    if (manquants === 0) continue;

    // Générer les textes manquants (séquentiel pour ne pas saturer l'API Claude)
    for (let i = 0; i < manquants; i++) {
      const result = await genererTexteEtQuestions(niveau);
      if (!result) continue;

      await prisma.texteLectureCache.create({
        data: {
          niveauScolaire: niveau,
          texte: result.texte,
          nbMots: result.nbMots,
          questionsJson: result.questionsJson,
        },
      });

      stats[niveau].ajoutes++;
      totalAjoutes++;

      // Pause entre chaque génération pour respecter les rate limits Claude
      if (i < manquants - 1) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Purger les entrées trop anciennes (> 30 jours) pour renouveler le contenu
  const il_y_a_30_jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const purge = await prisma.texteLectureCache.deleteMany({
    where: { createdAt: { lt: il_y_a_30_jours } },
  });

  console.log(`[prefill-lecture] +${totalAjoutes} textes, purge: ${purge.count}`);
  return NextResponse.json({ ok: true, totalAjoutes, purge: purge.count, stats });
}
