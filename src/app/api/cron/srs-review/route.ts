import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

// ── Cron — Rappel révision SRS aux parents (8h Quebec = 13h UTC) ─────────────
// Envoie un email aux parents dont l'enfant a au moins une matière
// dont la révision espacée est due aujourd'hui.
// N'appelle JAMAIS l'IA — simple email de rappel.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique",
  ETHIQUE: "Éthique",
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();
  const finJour = new Date(maintenant);
  finJour.setHours(23, 59, 59, 999);

  try {
    // Niveaux matières avec révision due aujourd'hui ou en retard
    const revisionsDues = await prisma.niveauMatiere.findMany({
      where: {
        prochaineRevision: { lte: finJour },
        lacunes: { isEmpty: false }, // Seulement si des lacunes existent
      },
      include: {
        eleve: {
          select: {
            id: true,
            prenom: true,
            parents: {
              select: {
                prenom: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    // Regrouper par élève (par id pour éviter les collisions de prénom)
    const parEleve = new Map<string, { prenom: string; matieres: string[]; parents: { email: string; prenom: string }[] }>();
    for (const rev of revisionsDues) {
      const key = rev.eleve.id;
      if (!parEleve.has(key)) {
        parEleve.set(key, {
          prenom: rev.eleve.prenom,
          matieres: [],
          parents: rev.eleve.parents.map((p: { prenom: string; user: { email: string } }) => ({ email: p.user.email, prenom: p.prenom })),
        });
      }
      parEleve.get(key)!.matieres.push(MATIERE_LABEL[rev.matiere] ?? rev.matiere);
    }

    let envoyes = 0;
    const erreurs: string[] = [];

    for (const [, { prenom, matieres, parents }] of parEleve) {
      const matieresList = matieres.join(", ");
      const html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
          <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
          <p style="color: #8a909c; font-size: 13px; margin-bottom: 28px;">Révision suggérée pour aujourd'hui</p>

          <div style="background: linear-gradient(135deg, #f0eeff 0%, #fff 100%); border: 1px solid #e5e2dc; border-radius: 14px; padding: 24px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 28px; margin: 0 0 8px 0;">🎯</p>
            <h2 style="font-size: 17px; color: #0f1623; margin: 0 0 6px 0;">${prenom} a des révisions à faire</h2>
            <p style="font-size: 13px; color: #5b4fcf; font-weight: bold; margin: 0;">${matieresList}</p>
          </div>

          <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
            La plateforme a identifié des lacunes dans ces matières. Un court exercice de révision aujourd'hui consolidera les apprentissages avant qu'ils ne s'effacent.
          </p>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://edu-reussite.com"}/eleve/exercices/nouveau"
              style="display: inline-block; background: #5b4fcf; color: white; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 50px; text-decoration: none;">
              Faire la révision →
            </a>
          </div>

          <p style="font-size: 11px; color: #aab0bc; text-align: center;">
            Ce rappel est envoyé automatiquement par Édu-Réussite QC selon la progression de ${prenom}.
          </p>
        </div>
      `;

      for (const parent of parents) {
        if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
          console.log(`\n📧 [DEV] Révision SRS → ${parent.email} — enfant: ${prenom}, matières: ${matieresList}\n`);
          envoyes++;
          continue;
        }
        try {
          const { error } = await resend.emails.send({
            from: FROM,
            to: parent.email,
            subject: `🎯 ${prenom} — révision suggérée aujourd'hui : ${matieresList}`,
            html,
          });
          if (error) throw new Error(error.message);
          logResend();
          envoyes++;
          // Pause entre chaque envoi pour respecter la limite Resend (5 req/s)
          await new Promise((r) => setTimeout(r, 250));
        } catch (err) {
          erreurs.push(`${parent.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      elevesTraites: parEleve.size,
      emailsEnvoyes: envoyes,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    });
  } catch (err) {
    console.error("[cron/srs-review]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
