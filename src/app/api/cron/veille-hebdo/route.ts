import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { rechercherWeb, formaterContexteWeb, type TavilyResult } from "@/lib/tavily/client";
import { anthropic } from "@/lib/ai/client";
import { logClaude } from "@/lib/api-usage/logger";
import { ApiService } from "@/generated/prisma";
import { sendVeilleHebdo } from "@/lib/email/send-veille-hebdo";

// ── Cron — Veille hebdomadaire (vendredi 23h58 heure Montréal = samedi 03h58 UTC) ──
// Appelé par Vercel Cron (vercel.json). Protégé par CRON_SECRET.
// Génère un rapport Veille EdTech + Opportunités via Tavily + Claude,
// le sauvegarde dans le journal AgentLog et l'envoie par email aux ADMIN/SUPER_ADMIN.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max (Vercel Pro)

// ── Profil ÉduRéussite QC ────────────────────────────────────────────────────

const PROFIL_EDU = `Tu travailles pour ÉduRéussite QC, une plateforme éducative québécoise propulsée par l'IA.
Mission : accompagner les élèves du primaire et du secondaire (niveaux 1 à 11) dans leur parcours scolaire grâce à une approche personnalisée, inclusive et basée sur le PFEQ (Programme de formation de l'école québécoise).
Contexte : québécois francophone, collaboration parent-enseignant-spécialiste, gamification bienveillante, accessibilité.
Secteurs cibles : familles, commissions scolaires, écoles privées, MEES, MIFI, organismes communautaires en éducation.`;

// ── Helper Claude ─────────────────────────────────────────────────────────────

async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 2000
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ── Route principale ──────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Vérification du secret Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // ── Récupérer les admins à notifier ────────────────────────────────────
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
        suspended: false,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucun admin actif trouvé" });
    }

    // Utiliser le premier SUPER_ADMIN comme auteur du log
    const systemUserId =
      admins.find((a) => a.role === "SUPER_ADMIN")?.id ?? admins[0].id;

    const dateStr = new Date().toLocaleDateString("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Toronto",
    });

    // ── Recherches Tavily en parallèle ─────────────────────────────────────
    const [webEdtechQC, webIaEdu, oppA, oppB, oppC] = await Promise.all([
      rechercherWeb(
        "tendances EdTech Québec éducation numérique intelligence artificielle 2025",
        { maxResults: 8, searchDepth: "advanced" }
      ),
      rechercherWeb(
        "IA intelligence artificielle éducation pédagogie innovations 2025 Québec Canada",
        { maxResults: 6, searchDepth: "advanced" }
      ),
      rechercherWeb(
        "appel projets subvention MEES MIFI MEI Québec EdTech financement éducation 2025",
        { maxResults: 5, searchDepth: "advanced" }
      ),
      rechercherWeb(
        "programme financement fédéral éducation Canada ISDE EDSC appel offres EdTech 2025",
        { maxResults: 5, searchDepth: "advanced" }
      ),
      rechercherWeb(
        "commissions scolaires CSS Québec partenariat technologie éducative numérique 2025",
        { maxResults: 4, searchDepth: "advanced" }
      ),
    ]);

    // Dédoublonner les résultats opportunités
    const seenOpp = new Set<string>();
    const uniqueOppResults: TavilyResult[] = [
      ...oppA.results,
      ...oppB.results,
      ...oppC.results,
    ].filter((r) => {
      if (seenOpp.has(r.url)) return false;
      seenOpp.add(r.url);
      return true;
    }).slice(0, 12);

    // ── Analyses Claude en parallèle ───────────────────────────────────────

    const SYSTEM_VEILLE = `${PROFIL_EDU}

Tu es l'analyste de veille stratégique d'ÉduRéussite QC. Tu analyses les tendances EdTech et de l'éducation numérique en contexte québécois et canadien.
Sois concis, factuel, structuré, orienté recommandations concrètes. Réponds en Markdown.
Utilise les données web fournies en priorité et cite les sources si pertinent.`;

    const SYSTEM_OPP = `${PROFIL_EDU}

Tu es le chargé des partenariats stratégiques d'ÉduRéussite QC. Tu identifies des opportunités concrètes de financement, d'appels à candidature et de partenariat.
Nomme les programmes réels, les organismes actifs, les montants si connus, et les fenêtres d'opportunité. Sois précis et actionnable. Réponds en Markdown.
Appuie-toi sur les données web fournies.`;

    const [veilleEdtech, veilleIA, opportunites] = await Promise.all([
      callClaude(
        SYSTEM_VEILLE,
        `RAPPORT VEILLE HEBDOMADAIRE — ${dateStr}

Analyse les tendances actuelles de l'EdTech et de l'éducation numérique au Québec et au Canada.

=== DONNÉES WEB RÉCENTES ===
${formaterContexteWeb(webEdtechQC.results)}
=== FIN DES DONNÉES ===

Structure ton rapport ainsi :

## 🔍 Faits saillants de la semaine
(3 à 5 points clés les plus importants)

## 📈 Tendances à surveiller
(Évolutions technologiques, pédagogiques, réglementaires)

## 🏫 Ce qui concerne directement ÉduRéussite QC
(Impacts, opportunités ou menaces spécifiques à notre contexte)

## ⚡ Actions recommandées cette semaine
(2 à 4 actions concrètes et prioritaires)`,
        2000
      ),

      callClaude(
        SYSTEM_VEILLE,
        `VEILLE IA EN ÉDUCATION — ${dateStr}

Analyse les avancées récentes de l'IA appliquée à l'éducation et leur impact potentiel pour ÉduRéussite QC.

=== DONNÉES WEB RÉCENTES ===
${formaterContexteWeb(webIaEdu.results)}
=== FIN DES DONNÉES ===

Structure :

## 🤖 Innovations IA marquantes
(Nouveaux outils, modèles, usages pédagogiques)

## ⚠️ Risques et débats actuels
(Éthique, biais, dépendance, enjeux réglementaires)

## 💡 Opportunités pour ÉduRéussite QC
(Comment capitaliser sur ces avancées)`,
        1500
      ),

      callClaude(
        SYSTEM_OPP,
        `VEILLE OPPORTUNITÉS — ${dateStr}

Identifie les opportunités de financement, appels à candidature et partenariats disponibles pour ÉduRéussite QC au Québec, au Canada et à l'international.

=== DONNÉES WEB RÉCENTES ===
${formaterContexteWeb(uniqueOppResults)}
=== FIN DES DONNÉES ===

Pour chaque opportunité (liste de 6 à 10), inclure :
- **Nom du programme ou de l'organisme** — type (financement | appel à candidature | partenariat)
- Montant ou valeur estimée si connu
- Échéance ou fenêtre de dépôt
- Priorité : 🔴 Haute | 🟡 Moyenne | 🟢 À surveiller
- Prochaine action recommandée (1 phrase)

---

À la fin, ajoute une section :
## 📌 Top 3 actions immédiates
Les 3 opportunités à prioriser cette semaine, avec raison.`,
        2500
      ),
    ]);

    // ── Sauvegarder dans le journal AgentLog ───────────────────────────────
    const CLAUDE_INPUT = 3 / 1_000_000;
    const CLAUDE_OUTPUT = 15 / 1_000_000;

    const totalInputTokens =
      veilleEdtech.inputTokens + veilleIA.inputTokens + opportunites.inputTokens;
    const totalOutputTokens =
      veilleEdtech.outputTokens + veilleIA.outputTokens + opportunites.outputTokens;

    await Promise.all([
      prisma.agentLog.create({
        data: {
          agentType: "VEILLE",
          action: `Veille hebdo automatique — ${dateStr}`,
          prompt: `[CRON AUTOMATIQUE] Veille EdTech QC/CA + IA Éducation — ${dateStr}`,
          output:
            "## Veille EdTech — Québec & Canada\n\n" +
            veilleEdtech.text +
            "\n\n---\n\n## IA en Éducation\n\n" +
            veilleIA.text,
          inputTokens: veilleEdtech.inputTokens + veilleIA.inputTokens,
          outputTokens: veilleEdtech.outputTokens + veilleIA.outputTokens,
          coutUSD:
            (veilleEdtech.inputTokens + veilleIA.inputTokens) * CLAUDE_INPUT +
            (veilleEdtech.outputTokens + veilleIA.outputTokens) * CLAUDE_OUTPUT,
          adminId: systemUserId,
        },
      }),
      prisma.agentLog.create({
        data: {
          agentType: "PARTENARIAT",
          action: `Opportunités hebdo automatique — ${dateStr}`,
          prompt: `[CRON AUTOMATIQUE] Veille opportunités TOUS/TOUS — ${dateStr}`,
          output: opportunites.text,
          inputTokens: opportunites.inputTokens,
          outputTokens: opportunites.outputTokens,
          coutUSD:
            opportunites.inputTokens * CLAUDE_INPUT +
            opportunites.outputTokens * CLAUDE_OUTPUT,
          adminId: systemUserId,
        },
      }),
    ]);

    // Log d'utilisation API
    logClaude({
      service: ApiService.CLAUDE_ANALYSE,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      userId: systemUserId,
    });

    // ── Consolider toutes les sources ──────────────────────────────────────
    const seenSources = new Set<string>();
    const allSources: TavilyResult[] = [
      ...webEdtechQC.results,
      ...webIaEdu.results,
      ...uniqueOppResults,
    ].filter((r) => {
      if (seenSources.has(r.url)) return false;
      seenSources.add(r.url);
      return true;
    }).slice(0, 15);

    // ── Envoyer les emails aux admins ──────────────────────────────────────
    let emailsEnvoyes = 0;
    const erreurs: string[] = [];

    for (const admin of admins) {
      try {
        await sendVeilleHebdo({
          adminEmail: admin.email,
          adminNom: admin.name ?? "Admin",
          date: new Date(),
          veilleEdtech: veilleEdtech.text,
          veilleIA: veilleIA.text,
          opportunites: opportunites.text,
          sources: allSources,
        });
        emailsEnvoyes++;
        // Pause pour respecter la limite Resend (5 req/s)
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        const msg = `${admin.email}: ${err instanceof Error ? err.message : String(err)}`;
        erreurs.push(msg);
        console.error("[cron/veille-hebdo] Email failed:", msg);
      }
    }

    const dureeMs = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      date: dateStr,
      emailsEnvoyes,
      adminsNotifies: admins.length,
      sourcesWeb: allSources.length,
      tokensUtilises: { input: totalInputTokens, output: totalOutputTokens },
      dureeMs,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    });
  } catch (err) {
    console.error("[cron/veille-hebdo] Erreur critique:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
