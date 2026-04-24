import { createTRPCRouter, adminProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { anthropic } from "@/lib/ai/client";
import { logClaude } from "@/lib/api-usage/logger";
import { rechercherWeb, formaterContexteWeb, type TavilyResult } from "@/lib/tavily/client";
import { sendCampagneEmail } from "@/lib/email/send-campagne-email";
import { waitUntil } from "@vercel/functions";
import { Role } from "@/generated/prisma";

// ─── Profil de l'organisation (system prompt de base) ────────────────────────

const PROFIL_EDU = `
Tu travailles pour ÉduRéussite QC, une plateforme éducative québécoise propulsée par l'IA.

MISSION : Accompagner les élèves du primaire et du secondaire (niveaux 1 à 11) dans leur parcours scolaire grâce à une approche personnalisée, inclusive et basée sur le Programme de formation de l'école québécoise (PFEQ).

DIFFÉRENCIATEURS CLÉS :
- IA québécoise, contexte culturel et linguistique québécois francophone
- Respect du PFEQ (programme officiel du MEES)
- Adapté aux élèves avec besoins particuliers (TDAH, dyslexie, anxiété scolaire)
- Collaboration parent-enseignant-spécialiste en boucle
- Gamification bienveillante (badges, missions, streaks)
- Accessibilité : mode doux, voix IA (Mira), exercises adaptatifs

SECTEURS CIBLES : Familles québécoises, commissions scolaires, écoles privées, MEES, MIFI, organismes communautaires en éducation.

TON : Professionnel, chaleureux, québécois, inclusif. Jamais de jargon techno inutile.
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2000
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
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

async function logAgent(ctx: { prisma: any; user: { id: string } }, params: {
  agentType: string;
  action: string;
  prompt: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  opportuniteId?: string;
}) {
  const CLAUDE_INPUT = 3 / 1_000_000;
  const CLAUDE_OUTPUT = 15 / 1_000_000;
  const coutUSD = params.inputTokens * CLAUDE_INPUT + params.outputTokens * CLAUDE_OUTPUT;

  await ctx.prisma.agentLog.create({
    data: {
      agentType: params.agentType,
      action: params.action,
      prompt: params.prompt,
      output: params.output,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      coutUSD,
      adminId: ctx.user.id,
      opportuniteId: params.opportuniteId ?? null,
    },
  });

  logClaude({ service: "CLAUDE_ANALYSE", inputTokens: params.inputTokens, outputTokens: params.outputTokens, userId: ctx.user.id });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const agentsRouter = createTRPCRouter({

  // ══════════════════════════════════════════════════════════════════════════
  // AGENT 1 — SOCIAL MEDIA MANAGER
  // ══════════════════════════════════════════════════════════════════════════

  // ── Gestion des comptes sociaux ──────────────────────────────────────────

  getComptesSociaux: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.compteSocial.findMany({
      where: { adminId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, plateforme: true, nomCompte: true, pageId: true, actif: true, tokenExpire: true, createdAt: true },
    });
  }),

  connecterCompte: adminProcedure
    .input(z.object({
      plateforme: z.enum(["LINKEDIN", "FACEBOOK", "INSTAGRAM"]),
      nomCompte: z.string().min(1).max(200),
      pageId: z.string().max(200).optional(),
      accessToken: z.string().min(10),
      tokenExpire: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.compteSocial.create({
        data: {
          plateforme: input.plateforme,
          nomCompte: input.nomCompte,
          pageId: input.pageId ?? null,
          accessToken: input.accessToken,
          tokenExpire: input.tokenExpire ? new Date(input.tokenExpire) : null,
          adminId: ctx.user.id,
        },
        select: { id: true, plateforme: true, nomCompte: true, actif: true },
      });
    }),

  supprimerCompte: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.compteSocial.deleteMany({
        where: { id: input.id, adminId: ctx.user.id },
      });
    }),

  // ── Publications ─────────────────────────────────────────────────────────

  getPublications: adminProcedure
    .input(z.object({
      statut: z.string().optional(),
      compteId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.publicationSociale.findMany({
        where: {
          adminId: ctx.user.id,
          ...(input?.statut ? { statut: input.statut } : {}),
          ...(input?.compteId ? { compteId: input.compteId } : {}),
        },
        orderBy: [{ planifieLe: "asc" }, { createdAt: "desc" }],
        include: {
          compte: { select: { plateforme: true, nomCompte: true } },
        },
      });
    }),

  sauvegarderPublication: adminProcedure
    .input(z.object({
      compteId: z.string(),
      contenu: z.string().min(1).max(5000),
      sujet: z.string().min(1).max(300),
      typeContenu: z.enum(["TEXTE", "IMAGE", "VIDEO"]).default("TEXTE"),
      planifieLe: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.publicationSociale.create({
        data: {
          compteId: input.compteId,
          contenu: input.contenu,
          sujet: input.sujet,
          typeContenu: input.typeContenu,
          statut: input.planifieLe ? "PLANIFIE" : "BROUILLON",
          planifieLe: input.planifieLe ? new Date(input.planifieLe) : null,
          adminId: ctx.user.id,
        },
        include: { compte: { select: { plateforme: true, nomCompte: true } } },
      });
    }),

  publierPublication: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pub = await ctx.prisma.publicationSociale.findFirst({
        where: { id: input.id, adminId: ctx.user.id },
        include: { compte: true },
      });
      if (!pub) throw new TRPCError({ code: "NOT_FOUND", message: "Publication introuvable." });

      try {
        let postId: string | null = null;

        if (pub.compte.plateforme === "FACEBOOK" && pub.compte.pageId) {
          const resp = await fetch(
            `https://graph.facebook.com/v19.0/${pub.compte.pageId}/feed`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: pub.contenu, access_token: pub.compte.accessToken }),
              signal: AbortSignal.timeout(30_000),
            }
          );
          if (!resp.ok) throw new Error(await resp.text());
          const data = await resp.json() as { id: string };
          postId = data.id;

        } else if (pub.compte.plateforme === "LINKEDIN") {
          const author = pub.compte.pageId
            ? `urn:li:organization:${pub.compte.pageId}`
            : `urn:li:person:${pub.compte.pageId}`;
          const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${pub.compte.accessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
              author,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text: pub.contenu },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
            }),
            signal: AbortSignal.timeout(30_000),
          });
          if (!resp.ok) throw new Error(await resp.text());
          const headers = resp.headers;
          postId = headers.get("x-restli-id") ?? null;

        } else if (pub.compte.plateforme === "INSTAGRAM") {
          // Instagram nécessite un média — publication text-only non supportée
          throw new Error("Instagram requiert une image ou une vidéo. Ajoutez un média et publiez depuis l'app Meta Business Suite.");
        }

        await ctx.prisma.publicationSociale.update({
          where: { id: pub.id },
          data: { statut: "PUBLIE", publieLe: new Date(), postId: postId ?? null, erreur: null },
        });
        await logAgent(ctx, { agentType: "SOCIAL", action: `Publié sur ${pub.compte.plateforme}`, prompt: pub.contenu, output: `postId: ${postId}`, inputTokens: 0, outputTokens: 0 });
        return { ok: true, postId };

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        await ctx.prisma.publicationSociale.update({
          where: { id: pub.id },
          data: { statut: "ERREUR", erreur: msg },
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),

  supprimerPublication: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.publicationSociale.deleteMany({
        where: { id: input.id, adminId: ctx.user.id },
      });
    }),

  // ── Réponse aux commentaires ─────────────────────────────────────────────

  genererReponseCommentaire: adminProcedure
    .input(z.object({
      plateforme: z.enum(["LINKEDIN", "FACEBOOK", "INSTAGRAM"]),
      commentaire: z.string().min(2).max(2000),
      contextePublication: z.string().max(500).optional(),
      ton: z.enum(["PROFESSIONNEL", "CHALEUREUX", "INFORMATIF", "RECONNAISSANT"]).default("CHALEUREUX"),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le Community Manager d'ÉduRéussite QC. Tu rédiges des réponses aux commentaires sur les réseaux sociaux.
Tes réponses sont ${input.ton.toLowerCase()}, authentiques, et valorisent la communauté.
Règles : courte (2-4 phrases), personnalisée, ne jamais ignorer la question ou la préoccupation, finir par une invitation à continuer l'échange ou une question ouverte quand c'est pertinent.
Réponds UNIQUEMENT avec le texte de la réponse, prêt à poster.`;

      const prompt = `Plateforme : ${input.plateforme}
${input.contextePublication ? `Contexte de la publication : ${input.contextePublication}` : ""}
Commentaire d'un internaute : "${input.commentaire}"

Rédige une réponse ${input.ton.toLowerCase()} et engageante.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 400);
        await logAgent(ctx, { agentType: "SOCIAL", action: `Réponse commentaire ${input.plateforme}`, prompt, output: text, inputTokens, outputTokens });
        return { reponse: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération de la réponse." });
      }
    }),

  genererPost: adminProcedure
    .input(z.object({
      plateforme: z.enum(["LINKEDIN", "FACEBOOK", "INSTAGRAM"]),
      sujet: z.string().min(5).max(300),
      ton: z.enum(["PROFESSIONNEL", "INSPIRANT", "EDUCATIF", "PROMOTIONNEL"]).default("PROFESSIONNEL"),
      inclureEmoji: z.boolean().default(true),
      inclureHashtags: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le Social Media Manager d'ÉduRéussite QC. Tu rédiges des publications pour les réseaux sociaux en respectant :
- La charte éditoriale : ton ${input.ton.toLowerCase()}, authentique, québécois francophone
- Les bonnes pratiques de la plateforme ${input.plateforme}
- L'objectif : augmenter la notoriété et l'engagement de la communauté éducative québécoise
${input.inclureEmoji ? "- Inclure des emojis pertinents et sobres" : "- Pas d'emojis"}
${input.inclureHashtags ? "- Inclure 3 à 5 hashtags ciblés en fin de publication" : "- Pas de hashtags"}

Format de réponse : UNIQUEMENT le texte de la publication, prêt à copier-coller. Pas d'explication.`;

      const LONGUEURS: Record<string, string> = {
        LINKEDIN: "entre 150 et 300 mots, style article professionnel court",
        FACEBOOK: "entre 80 et 150 mots, accessible et chaleureux",
        INSTAGRAM: "entre 50 et 100 mots, accrocheur, visuel",
      };

      const prompt = `Rédige une publication ${input.plateforme} sur le sujet suivant : "${input.sujet}". Longueur souhaitée : ${LONGUEURS[input.plateforme]}.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 800);
        await logAgent(ctx, { agentType: "SOCIAL", action: `Post ${input.plateforme}`, prompt, output: text, inputTokens, outputTokens });
        return { contenu: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du post." });
      }
    }),

  genererCalendrier: adminProcedure
    .input(z.object({
      periode: z.enum(["SEMAINE", "MOIS"]),
      plateformes: z.array(z.enum(["LINKEDIN", "FACEBOOK", "INSTAGRAM"])).min(1),
      themesPrioritaires: z.string().max(300).optional(),
      dateDebut: z.string().optional(), // ISO date YYYY-MM-DD
    }))
    .mutation(async ({ ctx, input }) => {
      const debut = input.dateDebut
        ? new Date(input.dateDebut)
        : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();
      const debutStr = debut.toISOString().slice(0, 10);

      const SYSTEM = `${PROFIL_EDU}

Tu es le Social Media Manager d'ÉduRéussite QC. Tu génères des calendriers éditoriaux stratégiques.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans texte avant ou après.
Format attendu :
{
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "plateforme": "LINKEDIN" | "FACEBOOK" | "INSTAGRAM",
      "sujet": "titre court du post (max 80 car.)",
      "angle": "angle éditorial ou accroche (max 120 car.)",
      "typeContenu": "TEXTE" | "IMAGE" | "VIDEO",
      "objectif": "NOTORIETE" | "ENGAGEMENT" | "CONVERSION" | "FIDELISATION",
      "heureSuggereeTz": "HH:MM"
    }
  ]
}`;

      const nbJours = input.periode === "SEMAINE" ? 7 : 30;
      const frequenceParSemaine = input.plateformes.length <= 2 ? 3 : 5;

      const prompt = `Génère un calendrier éditorial professionnel pour ÉduRéussite QC.
Période : ${nbJours} jours à partir du ${debutStr}
Plateformes : ${input.plateformes.join(", ")}
Fréquence : environ ${frequenceParSemaine} posts/semaine au total, répartis intelligemment
${input.themesPrioritaires ? `Thèmes prioritaires : ${input.themesPrioritaires}` : "Thèmes variés : impact IA, témoignages familles, conseils parentaux, actualité scolaire Québec, gamification, inclusion TDAH/dyslexie"}

Contraintes :
- Alterner les objectifs (notoriété, engagement, conversion, fidélisation)
- Adapter le type de contenu à la plateforme (LinkedIn=texte/article, Facebook=texte+image, Instagram=image/vidéo)
- Respecter les meilleures heures de publication pour chaque plateforme (ex. LinkedIn 9h ou 12h, Instagram 11h ou 18h, Facebook 13h ou 19h)
- Varier les angles et ne jamais répéter deux posts identiques`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 3000);

        // Parser le JSON retourné
        let posts: {
          date: string; plateforme: string; sujet: string; angle: string;
          typeContenu: string; objectif: string; heureSuggereeTz: string;
        }[] = [];
        try {
          const parsed = JSON.parse(text.trim()) as { posts: typeof posts };
          posts = parsed.posts ?? [];
        } catch {
          // Fallback si Claude a quand même mis du markdown
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            try { posts = (JSON.parse(match[0]) as { posts: typeof posts }).posts ?? []; } catch { /* ignore */ }
          }
        }

        await logAgent(ctx, { agentType: "SOCIAL", action: `Calendrier ${input.periode}`, prompt, output: text, inputTokens, outputTokens });
        return { posts, raw: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du calendrier." });
      }
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // AGENT 2 — VEILLE CONCURRENTIELLE
  // ══════════════════════════════════════════════════════════════════════════

  analyserConcurrence: adminProcedure
    .input(z.object({
      concurrent: z.string().min(2).max(100),
      focusPoints: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Recherche web en temps réel
      const { results: webResults, disponible: webDispo } = await rechercherWeb(
        `${input.concurrent} EdTech plateforme éducative fonctionnalités tarifs 2024 2025`,
        { maxResults: 8, searchDepth: "advanced" }
      );
      const contextWeb = formaterContexteWeb(webResults);

      const SYSTEM = `${PROFIL_EDU}

Tu es l'analyste de veille concurrentielle d'ÉduRéussite QC. Tu analyses les plateformes EdTech concurrentes.
${webDispo ? "Des données web récentes te sont fournies ci-dessous — utilise-les en priorité, en les citant si pertinent." : "Base-toi sur ta connaissance du marché."}
Sois structuré, objectif, stratégique. Réponds en Markdown avec des sections claires.`;

      const prompt = `Analyse le concurrent "${input.concurrent}" dans le contexte EdTech québécois/canadien/international.
${input.focusPoints?.length ? `Points d'attention particuliers : ${input.focusPoints.join(", ")}` : ""}

${contextWeb ? `=== DONNÉES WEB RÉCENTES ===\n${contextWeb}\n=== FIN DES DONNÉES ===\n` : ""}

Inclure : positionnement actuel, fonctionnalités clés, modèle tarifaire, public cible, Forces, Faiblesses, Opportunités pour ÉduRéussite QC, Menaces, et recommandations stratégiques concrètes.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 2500);
        await logAgent(ctx, { agentType: "VEILLE", action: `Analyse : ${input.concurrent}`, prompt, output: text, inputTokens, outputTokens });
        return { analyse: text, sources: webResults as TavilyResult[], webDispo };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'analyse concurrentielle." });
      }
    }),

  analyserTendances: adminProcedure
    .input(z.object({
      domaine: z.enum(["EDTECH_QC", "EDTECH_CA", "EDTECH_INTERNATIONAL", "IA_EDUCATION", "SAAS_EDUCATION"]),
      horizon: z.enum(["6_MOIS", "1_AN", "3_ANS"]).default("1_AN"),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es l'analyste de veille stratégique d'ÉduRéussite QC. Tu identifies les tendances émergentes dans le secteur EdTech.
Sois prospectif, factuel, et oriente tes observations vers des recommandations concrètes pour ÉduRéussite QC.
Réponds en Markdown.`;

      const DOMAINE_LABELS: Record<string, string> = {
        EDTECH_QC: "l'EdTech québécoise",
        EDTECH_CA: "l'EdTech canadienne",
        EDTECH_INTERNATIONAL: "l'EdTech internationale",
        IA_EDUCATION: "l'IA appliquée à l'éducation",
        SAAS_EDUCATION: "le SaaS en éducation",
      };

      // Requête Tavily adaptée au domaine
      const QUERY_MAP: Record<string, string> = {
        EDTECH_QC: "tendances EdTech Québec éducation numérique 2025",
        EDTECH_CA: "EdTech Canada tendances marché éducation 2025",
        EDTECH_INTERNATIONAL: "global EdTech trends education technology 2025",
        IA_EDUCATION: "intelligence artificielle éducation tendances IA pédagogie 2025",
        SAAS_EDUCATION: "SaaS education market trends platforms 2025",
      };
      const { results: webResults, disponible: webDispo } = await rechercherWeb(
        QUERY_MAP[input.domaine] ?? "EdTech tendances 2025",
        { maxResults: 8, searchDepth: "advanced" }
      );
      const contextWeb = formaterContexteWeb(webResults);

      const prompt = `Analyse les tendances de ${DOMAINE_LABELS[input.domaine]} sur un horizon de ${input.horizon.replace("_", " ")}.

${contextWeb ? `=== DONNÉES WEB RÉCENTES ===\n${contextWeb}\n=== FIN DES DONNÉES ===\n` : ""}

Sections : Tendances technologiques, Évolution des usages pédagogiques, Opportunités de marché, Risques à anticiper, Recommandations stratégiques pour ÉduRéussite QC.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 2500);
        await logAgent(ctx, { agentType: "VEILLE", action: `Tendances : ${input.domaine}`, prompt, output: text, inputTokens, outputTokens });
        return { rapport: text, sources: webResults as TavilyResult[], webDispo };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'analyse des tendances." });
      }
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // AGENT 3 — MARKETING & GROWTH
  // ══════════════════════════════════════════════════════════════════════════

  genererCopy: adminProcedure
    .input(z.object({
      type: z.enum(["LANDING_PAGE", "EMAIL_CAMPAGNE", "TUNNEL_VENTE", "ANNONCE_PUBLICITAIRE", "PROPOSITION_VALEUR"]),
      cibleAudience: z.enum(["PARENTS", "ENSEIGNANTS", "COMMISSIONS_SCOLAIRES", "GENERAL"]),
      objectif: z.string().min(10).max(300),
      contraintes: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le Spécialiste Marketing & Growth d'ÉduRéussite QC. Tu rédiges des copies marketing percutantes.
Ton écriture est persuasive, empathique, orientée bénéfices, et respecte les valeurs d'ÉduRéussite QC.
Public cible : ${input.cibleAudience}. Réponds en Markdown.`;

      const TYPE_LABELS: Record<string, string> = {
        LANDING_PAGE: "une page d'atterrissage complète (titre, sous-titre, bénéfices, témoignage fictif, CTA)",
        EMAIL_CAMPAGNE: "un email de campagne marketing (objet, accroche, corps, CTA)",
        TUNNEL_VENTE: "un tunnel de vente en 3 étapes (sensibilisation, considération, conversion)",
        ANNONCE_PUBLICITAIRE: "une annonce publicitaire courte (Google Ads ou Facebook Ads, 3 variantes)",
        PROPOSITION_VALEUR: "une proposition de valeur unique claire et mémorable",
      };

      const prompt = `Crée ${TYPE_LABELS[input.type]} pour ÉduRéussite QC.
Objectif de campagne : ${input.objectif}
${input.contraintes ? `Contraintes : ${input.contraintes}` : ""}`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 2000);
        await logAgent(ctx, { agentType: "MARKETING", action: `Copy : ${input.type}`, prompt, output: text, inputTokens, outputTokens });
        return { copy: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du copy." });
      }
    }),

  genererPlanMarketing: adminProcedure
    .input(z.object({
      objectifCroissance: z.string().min(10).max(300),
      budget: z.enum(["FAIBLE", "MOYEN", "ELEVE"]).default("FAIBLE"),
      horizon: z.enum(["3_MOIS", "6_MOIS", "1_AN"]).default("6_MOIS"),
      contexteConcurrentiel: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le Directeur Marketing & Growth d'ÉduRéussite QC. Tu conçois des plans marketing dynamiques et réalistes.
Sois très concret : canaux, actions, métriques, priorités. Adapte au budget et au contexte québécois.
Réponds en Markdown structuré.`;

      const BUDGET_LABELS = { FAIBLE: "limité (< 2 000$ CAD/mois)", MOYEN: "moyen (2 000–10 000$ CAD/mois)", ELEVE: "élevé (> 10 000$ CAD/mois)" };

      const prompt = `Élabore un plan marketing pour ÉduRéussite QC sur ${input.horizon.replace("_", " ")}.
Objectif de croissance : ${input.objectifCroissance}
Budget : ${BUDGET_LABELS[input.budget]}
${input.contexteConcurrentiel ? `Contexte concurrentiel actuel : ${input.contexteConcurrentiel}` : ""}

Sections : Analyse de la situation, Objectifs SMART, Stratégie par canal (SEO, réseaux sociaux, partenariats, contenu), Plan d'actions mensuel, KPIs à suivre, Tests A/B recommandés.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 3000);
        await logAgent(ctx, { agentType: "MARKETING", action: `Plan marketing ${input.horizon}`, prompt, output: text, inputTokens, outputTokens });
        return { plan: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du plan marketing." });
      }
    }),

  // ── Personas & Stratégie ──────────────────────────────────────────────────

  getPersona: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.personaMarketing.findFirst({
      where: { adminId: ctx.user.id },
      orderBy: { updatedAt: "desc" },
    });
  }),

  genererPersona: adminProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.prisma.personaMarketing.findFirst({
      where: { adminId: ctx.user.id },
      orderBy: { updatedAt: "desc" },
    });

    const SYSTEM = `${PROFIL_EDU}
Tu es un expert en marketing stratégique et en design de personas.
Rédige des fiches de personas détaillées, basées sur des données réelles du marché EdTech québécois.
Format Markdown avec emojis, sections claires, données concrètes (âges, revenus, habitudes numériques).`;

    const prompt = `Génère les 4 personas clés pour ÉduRéussite QC.

Pour chaque persona, inclure :
1. Nom fictif + photo emoji + démographie (âge, situation, revenu, région du Québec)
2. Objectifs principaux (3-4 objectifs concrets)
3. Points de douleur (3-4 frustrations réelles)
4. Habitudes numériques (appareils, réseaux sociaux, heure d'utilisation)
5. Déclencheur d'achat (ce qui le convainc)
6. Message marketing idéal (1 phrase percutante)
7. Canal de communication préféré

Les 4 personas :
- La Parent Engagé(e) (parent d'un élève en difficulté ou soucieux de la réussite)
- L'Élève en Quête de Réussite (secondaire 1-5, motivation variable)
- L'Enseignant(e) Innovant(e) (cherche des outils différenciés)
- La Direction ou Commission Scolaire (décideur institutionnel)`;

    const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 3000);
    await logAgent(ctx, { agentType: "MARKETING", action: "Génération personas", prompt, output: text, inputTokens, outputTokens });

    const version = (existing?.version ?? 0) + 1;
    let saved;
    if (existing) {
      saved = await ctx.prisma.personaMarketing.update({
        where: { id: existing.id },
        data: { contenu: text, version, updatedAt: new Date() },
      });
    } else {
      saved = await ctx.prisma.personaMarketing.create({
        data: { contenu: text, version, adminId: ctx.user.id },
      });
    }
    return saved;
  }),

  getStrategie: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.strategieMarketing.findFirst({
      where: { adminId: ctx.user.id },
      orderBy: { updatedAt: "desc" },
    });
  }),

  actualiserStrategie: adminProcedure
    .input(z.object({
      contexteAdditionnel: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.strategieMarketing.findFirst({
        where: { adminId: ctx.user.id },
        orderBy: { updatedAt: "desc" },
      });

      // Chercher les tendances actuelles si Tavily disponible
      let tendances = "";
      try {
        const { results, disponible } = await rechercherWeb("stratégie marketing EdTech 2025 Quebec tendances IA éducation");
        if (disponible && results.length > 0) {
          tendances = `\n\nTENDANCES ACTUELLES (sources web) :\n${formaterContexteWeb(results)}`;
        }
      } catch { /* Tavily indisponible, continuer sans */ }

      const SYSTEM = `${PROFIL_EDU}
Tu es le CMO (Chief Marketing Officer) d'ÉduRéussite QC.
Tu élabores des stratégies marketing de pointe, data-driven, adaptées au marché EdTech québécois 2025.
Sois ultra-concret, chiffré, avec des actions immédiates et des KPIs mesurables.
Intègre les dernières tendances en IA, contenus courts, SEO, marketing automation.
Réponds en Markdown structuré et professionnel.`;

      const prompt = `Génère la stratégie marketing de pointe pour ÉduRéussite QC — ${new Date().toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}.
${input.contexteAdditionnel ? `Contexte spécifique : ${input.contexteAdditionnel}` : ""}
${tendances}

Structure OBLIGATOIRE :
## 1. Analyse de position (forces, différenciateurs, menaces)
## 2. Concurrence EdTech Québec (Alloprof, Khan Academy, Classum, autres)
## 3. Tendances technologiques à exploiter (IA, vidéos courtes, personalization)
## 4. Stratégie par canal (SEO/contenu, Meta Ads, Google Ads, TikTok/Reels, e-mail, partenariats)
## 5. Entonnoir d'acquisition (awareness → activation → rétention → référence)
## 6. Plan d'actions 90 jours (semaine par semaine)
## 7. KPIs et objectifs (CAC, LTV, taux activation, NPS)
## 8. Budget recommandé par canal
## 9. Quick wins immédiats (3 actions à lancer cette semaine)`;

      const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 4000);
      await logAgent(ctx, { agentType: "MARKETING", action: "Stratégie de pointe actualisée", prompt, output: text, inputTokens, outputTokens });

      const version = (existing?.version ?? 0) + 1;
      let saved;
      if (existing) {
        saved = await ctx.prisma.strategieMarketing.update({
          where: { id: existing.id },
          data: { contenu: text, version, updatedAt: new Date() },
        });
      } else {
        saved = await ctx.prisma.strategieMarketing.create({
          data: { contenu: text, version, adminId: ctx.user.id },
        });
      }
      return saved;
    }),

  // ── Campagnes email ───────────────────────────────────────────────────────

  getCampagnes: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.campagneEmail.findMany({
      where: { adminId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  getUsersPourCampagne: adminProcedure
    .input(z.object({
      type: z.enum(["ALL", "ROLE", "USER"]),
      roles: z.array(z.string()).optional(),
      rechercheEmail: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (input.type === "USER" && input.rechercheEmail) {
        const users = await ctx.prisma.user.findMany({
          where: {
            email: { contains: input.rechercheEmail, mode: "insensitive" },
            suspended: false,
          },
          select: { id: true, email: true, name: true, role: true },
          take: 10,
        });
        return { users, total: users.length };
      }
      const where = input.type === "ROLE" && input.roles?.length
        ? { role: { in: input.roles as Role[] }, suspended: false }
        : { suspended: false };
      const total = await ctx.prisma.user.count({ where });
      const users = await ctx.prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true },
        take: 20,
      });
      return { users, total };
    }),

  genererEmailMarketing: adminProcedure
    .input(z.object({
      typeEvenement: z.enum(["INFORMATION", "MISE_A_JOUR", "FETE", "PROMO", "AUTRE"]),
      destinataires: z.string(), // "parents", "enseignants", "tous", etc.
      sujet: z.string().min(5).max(200),
      contexte: z.string().min(10).max(600),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `Tu es expert en email marketing professionnel pour ÉduRéussite QC, une plateforme EdTech québécoise.
Tu génères des emails HTML percutants, chaleureux, professionnels.

RÈGLES ABSOLUES :
- Rédige UNIQUEMENT le corps HTML de l'email (pas le <html>, pas le <body>, juste les balises internes)
- Utilise : <p>, <h2>, <h3>, <strong>, <ul>, <li>, <a>, <br>
- Aucun CSS inline complexe — juste du texte structuré, le template se charge du style
- Ton québécois authentique, chaleureux, professionnel
- Longueur idéale : 150-300 mots
- Inclure 1 phrase d'accroche forte en ouverture`;

      const TYPE_LABELS: Record<string, string> = {
        INFORMATION: "informatif (partage d'une information importante)",
        MISE_A_JOUR: "annonce de mise à jour de la plateforme (nouvelles fonctionnalités)",
        FETE: "message festif adapté à l'occasion (chaleureux, célébratoire)",
        PROMO: "offre promotionnelle ou invitation spéciale",
        AUTRE: "communication générale",
      };

      const prompt = `Génère un email ${TYPE_LABELS[input.typeEvenement]} pour ÉduRéussite QC.

Destinataires : ${input.destinataires}
Sujet / Objet de l'email : ${input.sujet}
Contexte / Ce qu'on veut communiquer : ${input.contexte}

Génère :
1. Une ligne "OBJET: [objet email accrocheur]"
2. Puis le corps HTML de l'email (balises simples seulement)`;

      const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 1500);
      await logAgent(ctx, { agentType: "MARKETING", action: `Email campagne : ${input.typeEvenement}`, prompt, output: text, inputTokens, outputTokens });

      // Extraire l'objet et le corps
      const lines   = text.split("\n");
      const objetLine = lines.find((l) => l.toLowerCase().startsWith("objet:") || l.toLowerCase().startsWith("**objet"));
      const objet   = objetLine
        ? objetLine.replace(/^\*?\*?objet\s*:\s*\*?\*?/i, "").replace(/\*\*/g, "").trim()
        : input.sujet;
      const htmlIdx = lines.findIndex((l) => l.toLowerCase().includes("objet:") || l.toLowerCase().includes("**objet"));
      const htmlBody = lines.slice(htmlIdx + 1).join("\n").trim();

      // Version texte (strip HTML)
      const textContenu = htmlBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      return { objet, htmlContenu: htmlBody, textContenu };
    }),

  sauvegarderCampagne: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      titre: z.string().min(1).max(200),
      objet: z.string().min(1).max(200),
      htmlContenu: z.string().min(1),
      textContenu: z.string(),
      typeEvenement: z.string(),
      destinataires: z.object({
        type: z.enum(["ALL", "ROLE", "USER"]),
        roles: z.array(z.string()).optional(),
        userId: z.string().optional(),
        userEmail: z.string().optional(),
      }),
      planifieLe: z.string().optional(), // ISO datetime
    }))
    .mutation(async ({ ctx, input }) => {
      const statut = input.planifieLe ? "PLANIFIE" : "BROUILLON";
      const planifieLe = input.planifieLe ? new Date(input.planifieLe) : null;

      if (input.id) {
        return ctx.prisma.campagneEmail.update({
          where: { id: input.id, adminId: ctx.user.id },
          data: {
            titre: input.titre,
            objet: input.objet,
            htmlContenu: input.htmlContenu,
            textContenu: input.textContenu,
            typeEvenement: input.typeEvenement,
            destinataires: input.destinataires,
            statut,
            planifieLe,
          },
        });
      }
      return ctx.prisma.campagneEmail.create({
        data: {
          titre: input.titre,
          objet: input.objet,
          htmlContenu: input.htmlContenu,
          textContenu: input.textContenu,
          typeEvenement: input.typeEvenement,
          destinataires: input.destinataires,
          statut,
          planifieLe: planifieLe ?? undefined,
          adminId: ctx.user.id,
        },
      });
    }),

  envoyerCampagne: adminProcedure
    .input(z.object({ campagneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campagne = await ctx.prisma.campagneEmail.findUniqueOrThrow({
        where: { id: input.campagneId, adminId: ctx.user.id },
      });

      if (campagne.statut === "ENVOYE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cette campagne a déjà été envoyée." });
      }

      // Construire la liste des destinataires
      const dest = campagne.destinataires as { type: string; roles?: string[]; userId?: string; userEmail?: string };
      let users: { email: string; name: string | null }[] = [];

      if (dest.type === "ALL") {
        users = await ctx.prisma.user.findMany({
          where: { suspended: false, emailVerified: { not: null } },
          select: { email: true, name: true },
        });
      } else if (dest.type === "ROLE" && dest.roles?.length) {
        users = await ctx.prisma.user.findMany({
          where: { role: { in: dest.roles as Role[] }, suspended: false, emailVerified: { not: null } },
          select: { email: true, name: true },
        });
      } else if (dest.type === "USER" && dest.userEmail) {
        const u = await ctx.prisma.user.findFirst({
          where: { email: dest.userEmail, suspended: false },
          select: { email: true, name: true },
        });
        if (u) users = [u];
      }

      if (users.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun destinataire trouvé pour cette campagne." });
      }

      // Mettre à jour le statut immédiatement
      await ctx.prisma.campagneEmail.update({
        where: { id: campagne.id },
        data: { statut: "ENVOYE", envoyeLe: new Date(), nbEnvoyes: users.length },
      });

      // Envoyer en arrière-plan (waitUntil) pour ne pas bloquer la réponse
      waitUntil((async () => {
        for (const user of users) {
          try {
            await sendCampagneEmail(
              user.email,
              campagne.objet,
              campagne.htmlContenu,
              campagne.typeEvenement,
              user.name ?? undefined,
            );
          } catch (err) {
            console.error(`[campagne] Échec envoi à ${user.email}:`, err);
          }
          // Petit délai pour ne pas dépasser les limites Resend
          await new Promise((r) => setTimeout(r, 120));
        }
      })());

      return { nbEnvoyes: users.length };
    }),

  supprimerCampagne: adminProcedure
    .input(z.object({ campagneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.campagneEmail.delete({
        where: { id: input.campagneId, adminId: ctx.user.id },
      });
      return { ok: true };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // AGENT 4 — PARTENARIATS
  // ══════════════════════════════════════════════════════════════════════════

  rechercherOpportunites: adminProcedure
    .input(z.object({
      type: z.enum(["COMMISSION_SCOLAIRE", "MINISTERE_QC", "MINISTERE_CA", "ENTREPRISE", "UNIVERSITE", "INTERNATIONAL", "TOUS"]),
      region: z.enum(["QC", "CA", "INTERNATIONAL", "TOUS"]).default("TOUS"),
      contexte: z.string().max(300).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le chargé des partenariats stratégiques d'ÉduRéussite QC. Tu identifies des opportunités de partenariat réelles et pertinentes.
Appuie-toi sur ta connaissance des institutions, programmes, appels à projets et subventions au Québec, au Canada et à l'international.
Sois précis : nomme les organismes réels, les programmes existants, les fenêtres habituelles de soumission. Réponds en Markdown.`;

      const TYPE_LABELS: Record<string, string> = {
        COMMISSION_SCOLAIRE: "les commissions scolaires et centres de services scolaires du Québec",
        MINISTERE_QC: "les ministères du gouvernement du Québec (MEES, MIFI, MEI, etc.)",
        MINISTERE_CA: "les ministères et agences du gouvernement fédéral canadien (EDSC, ISDE, PCH, etc.)",
        ENTREPRISE: "les entreprises privées (EdTech, tech, télécoms, assurances, banques) au Canada",
        UNIVERSITE: "les universités, cégeps et institutions d'enseignement supérieur",
        INTERNATIONAL: "les organisations internationales (UNESCO, Francophonie, OCDE, UE, etc.)",
        TOUS: "tous types d'organisations",
      };

      const REGION_LABELS: Record<string, string> = { QC: "au Québec", CA: "au Canada", INTERNATIONAL: "à l'international", TOUS: "au Québec, au Canada et à l'international" };

      // Construire des requêtes Tavily ciblées selon le type
      const QUERIES: Record<string, string[]> = {
        COMMISSION_SCOLAIRE: ["commissions scolaires centres services scolaires Québec appel projets numérique 2025", "CSS Québec partenariat technologie éducative"],
        MINISTERE_QC: ["appel projets subvention MEES MIFI MEI Québec EdTech 2025", "programme financement éducation numérique Québec gouvernement"],
        MINISTERE_CA: ["federal Canada education technology funding ISDE EDSC 2025", "programme financement fédéral éducation Canada appel projets"],
        ENTREPRISE: ["entreprise Canada partenariat EdTech plateforme éducative Québec 2025", "investissement technologie éducation secteur privé Canada"],
        UNIVERSITE: ["université cégep Québec partenariat recherche EdTech 2025", "collaboration recherche intelligence artificielle éducation universités canadiennes"],
        INTERNATIONAL: ["UNESCO francophonie OCDE appel projets éducation numérique 2025", "international education partnership EdTech francophone funding"],
        TOUS: ["partenariat EdTech Québec Canada subvention financement éducation 2025"],
      };

      const queries = QUERIES[input.type] ?? QUERIES["TOUS"];
      const allResults: TavilyResult[] = [];
      for (const q of queries) {
        const { results } = await rechercherWeb(q, { maxResults: 5, searchDepth: "advanced" });
        allResults.push(...results);
      }
      // Dédoublonner par URL
      const seen = new Set<string>();
      const uniqueResults = allResults.filter((r) => { if (seen.has(r.url)) return false; seen.add(r.url); return true; }).slice(0, 10);
      const contextWeb = formaterContexteWeb(uniqueResults);
      const webDispo = uniqueResults.length > 0;

      const prompt = `Identifie 8 à 12 opportunités de partenariat concrètes pour ÉduRéussite QC auprès de ${TYPE_LABELS[input.type]} ${REGION_LABELS[input.region]}.
${input.contexte ? `Contexte supplémentaire : ${input.contexte}` : ""}

${contextWeb ? `=== DONNÉES WEB RÉCENTES (programmes, appels d'offres, organismes actifs) ===\n${contextWeb}\n=== FIN DES DONNÉES ===\n` : ""}

Pour chaque opportunité : Nom de l'organisation/programme, Type de partenariat possible, Valeur stratégique pour ÉduRéussite QC, Niveau de priorité (Haute/Moyenne/Faible), Lien ou référence si disponible, Prochaine action recommandée.`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 3000);
        await logAgent(ctx, { agentType: "PARTENARIAT", action: `Recherche : ${input.type}/${input.region}`, prompt, output: text, inputTokens, outputTokens });
        return { opportunites: text, sources: uniqueResults as TavilyResult[], webDispo };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la recherche d'opportunités." });
      }
    }),

  genererSoumission: adminProcedure
    .input(z.object({
      opportuniteId: z.string().optional(),
      organisation: z.string().min(2).max(200),
      typePartenariat: z.string().min(5).max(200),
      objectifPartenariat: z.string().min(10).max(500),
      exigences: z.string().max(1000).optional(),
      signataire: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const SYSTEM = `${PROFIL_EDU}

Tu es le chargé des partenariats d'ÉduRéussite QC et tu rédiges des soumissions et lettres de partenariat professionnelles.
Style : formel, québécois, orienté impact pédagogique et social. Chaque soumission doit être convaincante et personnalisée.
Réponds en Markdown avec des sections clairement délimitées pour faciliter la mise en page finale.`;

      const prompt = `Rédige une soumission / lettre d'intention de partenariat complète pour ÉduRéussite QC.

Destinataire : ${input.organisation}
Type de partenariat visé : ${input.typePartenariat}
Objectif du partenariat : ${input.objectifPartenariat}
${input.exigences ? `Exigences ou critères connus : ${input.exigences}` : ""}
${input.signataire ? `Signataire : ${input.signataire}` : ""}

Structure la soumission ainsi :
1. En-tête et formule d'appel
2. Introduction et présentation d'ÉduRéussite QC
3. Valeur ajoutée et impact pédagogique attendu
4. Description concrète du partenariat proposé
5. Alignement avec la mission de l'organisation destinataire
6. Prochaines étapes proposées
7. Formule de clôture professionnelle`;

      try {
        const { text, inputTokens, outputTokens } = await callClaude(SYSTEM, prompt, 3000);
        await logAgent(ctx, {
          agentType: "PARTENARIAT",
          action: `Soumission : ${input.organisation}`,
          prompt,
          output: text,
          inputTokens,
          outputTokens,
          opportuniteId: input.opportuniteId,
        });
        return { soumission: text };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération de la soumission." });
      }
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // GESTION DES OPPORTUNITÉS
  // ══════════════════════════════════════════════════════════════════════════

  creerOpportunite: adminProcedure
    .input(z.object({
      titre: z.string().min(3).max(200),
      organisation: z.string().min(2).max(200),
      type: z.string(),
      region: z.string().default("QC"),
      source: z.string().max(500).optional(),
      echeance: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.opportunitePartenariat.create({
        data: {
          titre: input.titre,
          organisation: input.organisation,
          type: input.type,
          region: input.region,
          source: input.source ?? null,
          echeance: input.echeance ? new Date(input.echeance) : null,
          notes: input.notes ?? null,
          adminId: ctx.user.id,
        },
      });
    }),

  updateOpportunite: adminProcedure
    .input(z.object({
      id: z.string(),
      statut: z.string().optional(),
      notes: z.string().max(1000).optional(),
      echeance: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.opportunitePartenariat.update({
        where: { id: input.id },
        data: {
          ...(input.statut !== undefined && { statut: input.statut }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.echeance !== undefined && { echeance: input.echeance ? new Date(input.echeance) : null }),
        },
      });
    }),

  getOpportunites: adminProcedure
    .input(z.object({ statut: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.opportunitePartenariat.findMany({
        where: input?.statut ? { statut: input.statut } : undefined,
        orderBy: [{ statut: "asc" }, { createdAt: "desc" }],
        include: {
          soumissions: {
            select: { id: true, action: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      });
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // JOURNAL D'ACTIVITÉ
  // ══════════════════════════════════════════════════════════════════════════

  getJournal: adminProcedure
    .input(z.object({
      agentType: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agentLog.findMany({
        where: input?.agentType ? { agentType: input.agentType } : undefined,
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        include: {
          admin: { select: { name: true, email: true } },
          opportunite: { select: { titre: true, organisation: true } },
        },
      });
    }),
});
