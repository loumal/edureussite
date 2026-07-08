import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { anthropic } from "@/lib/ai/client";
import { auth } from "@/lib/auth/config";
import type { NiveauScolaire } from "@/generated/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

const NIVEAU_LABEL: Partial<Record<NiveauScolaire, string>> = {
  PRIMAIRE_1: "1re année primaire", PRIMAIRE_2: "2e année primaire",
  PRIMAIRE_3: "3e année primaire", PRIMAIRE_4: "4e année primaire",
  PRIMAIRE_5: "5e année primaire", PRIMAIRE_6: "6e année primaire",
  SECONDAIRE_1: "1re secondaire", SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire", SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire", SECONDAIRE_6: "6e secondaire", SECONDAIRE_7: "Terminale",
};

async function claudeAvecRetry(
  params: Parameters<typeof anthropic.messages.create>[0],
  maxRetries = 3
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (anthropic.messages.create(params) as Promise<any>);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isRateLimit = status === 429 || status === 529 || status === 503;
      if (attempt === maxRetries || !isRateLimit) throw err;
      await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 16000)));
    }
  }
  throw new Error("claude: max retries exceeded");
}

// POST /api/lecture/generer-questions
// Appelé en fire-and-forget par LectureClient après terminerSessionLecture (LIVRE_PERSO).
// Génère les 5 questions Giasson depuis la transcription audio, met à jour le statut.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { sessionId } = await req.json() as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    // Vérifier que la session appartient à cet utilisateur
    const profil = await prisma.profilEleve.findUnique({
      where: { userId: session.user.id },
      select: { id: true, niveauScolaire: true, prenom: true },
    });
    if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const sessionLecture = await prisma.sessionLecture.findUnique({
      where: { id: sessionId, eleveId: profil.id },
      select: { id: true, statut: true, texteTranscrit: true, titreLivre: true, auteurLivre: true, niveauLecture: true },
    });

    if (!sessionLecture || sessionLecture.statut !== "GENERANT_QUESTIONS") {
      return NextResponse.json({ ok: true, skipped: true }); // déjà traitée ou inexistante
    }

    const niveauLabel = NIVEAU_LABEL[profil.niveauScolaire] ?? profil.niveauScolaire;
    const texteSource = sessionLecture.texteTranscrit;
    const contexteLecture = texteSource
      ? `Texte lu à voix haute par l'élève :\n\n${texteSource.slice(0, 3000)}`
      : `Livre : "${sessionLecture.titreLivre ?? "?"}"${sessionLecture.auteurLivre ? ` de ${sessionLecture.auteurLivre}` : ""} (niveau ${sessionLecture.niveauLecture ?? "?"})`;

    const qResp = await claudeAvecRetry({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Tu es un orthopédagogue expert en compréhension de lecture (modèle Giasson).
Génère 5 questions de compréhension pour ${profil.prenom}, élève de ${niveauLabel}.

${contexteLecture}

5 questions en français québécois naturel, une par niveau Giasson :
- MICROPROCESSUS (fait explicite dans le texte)
- INTEGRATION (anaphore, pronom ou connecteur logique)
- MACROPROCESSUS (idée principale ou résumé)
- ELABORATION_CAUSAL (lien cause-effet implicite)
- ELABORATION_PREDICTIF (prédiction ou inférence pragmatique)

RÉPONDS UNIQUEMENT avec ce JSON :
[{"id":"q1","niveau":"MICROPROCESSUS","question":"..."},{"id":"q2","niveau":"INTEGRATION","question":"..."},{"id":"q3","niveau":"MACROPROCESSUS","question":"..."},{"id":"q4","niveau":"ELABORATION_CAUSAL","question":"..."},{"id":"q5","niveau":"ELABORATION_PREDICTIF","question":"..."}]`,
      }],
    });

    let questions: object[] = [];
    try {
      const raw = qResp.content[0].type === "text" ? (qResp.content[0].text ?? "[]") : "[]";
      questions = JSON.parse(raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()) as object[];
    } catch {
      questions = [];
    }

    // Questions de secours si la génération a échoué
    if (questions.length === 0) {
      questions = [
        { id: "q1", niveau: "MICROPROCESSUS", question: "Décris en une phrase ce dont il est question dans ce que tu as lu." },
        { id: "q2", niveau: "INTEGRATION", question: "Y a-t-il un mot ou une expression que tu n'as pas compris ? Lequel ?" },
        { id: "q3", niveau: "MACROPROCESSUS", question: "Quelle est l'idée principale de ce que tu as lu ?" },
        { id: "q4", niveau: "ELABORATION_CAUSAL", question: "Pourquoi penses-tu que cela s'est produit ?" },
        { id: "q5", niveau: "ELABORATION_PREDICTIF", question: "Si tu continuais à lire, que penses-tu qu'il se passerait ensuite ?" },
      ];
    }

    await prisma.sessionLecture.update({
      where: { id: sessionId },
      data: { statut: "QUESTIONS", questions: questions as never },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[generer-questions] erreur:", err);
    // Marquer comme QUESTIONS avec questions génériques pour ne pas bloquer l'élève
    const { sessionId } = await (async () => {
      try { return await req.json() as { sessionId?: string }; } catch { return {}; }
    })();
    if (sessionId) {
      await prisma.sessionLecture.update({
        where: { id: sessionId },
        data: {
          statut: "QUESTIONS",
          questions: [
            { id: "q1", niveau: "MICROPROCESSUS", question: "Décris en une phrase ce dont il est question dans ce que tu as lu." },
            { id: "q2", niveau: "INTEGRATION", question: "Y a-t-il un mot ou une expression que tu n'as pas compris ? Lequel ?" },
            { id: "q3", niveau: "MACROPROCESSUS", question: "Quelle est l'idée principale de ce que tu as lu ?" },
            { id: "q4", niveau: "ELABORATION_CAUSAL", question: "Pourquoi penses-tu que cela s'est produit ?" },
            { id: "q5", niveau: "ELABORATION_PREDICTIF", question: "Si tu continuais à lire, que penses-tu qu'il se passerait ensuite ?" },
          ] as never,
        },
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, fallback: true });
  }
}
