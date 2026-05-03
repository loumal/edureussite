import { Resend } from "resend";
import { PrismaClient } from "../src/generated/prisma/index.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load env
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
const envLocalPath = join(__dirname, "../.env.local");

try { dotenv.config({ path: envLocalPath }); } catch {}
dotenv.config({ path: envPath });

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

const DESTINATAIRES = ["peacekot2013@gmail.com", "daniotchere68@gmail.com"];
const FROM = "Édu-Réussite <support@edu-reussite.com>";

function buildHtml(prenom) {
  return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
  <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite</h1>
  <p style="font-size: 12px; color: #8a909c; margin-bottom: 28px;">www.edu-reussite.com</p>

  <p style="color: #0f1623; font-size: 15px; margin-bottom: 16px;">Bonjour <strong>${prenom}</strong>,</p>

  <p style="color: #3a4460; font-size: 14px; line-height: 1.7; margin-bottom: 16px;">
    Nous avons remarqué que vous avez créé votre compte sur <strong>Édu-Réussite</strong> aujourd'hui,
    et nous tenons d'abord à vous souhaiter chaleureusement la bienvenue dans notre communauté !
  </p>

  <p style="color: #3a4460; font-size: 14px; line-height: 1.7; margin-bottom: 16px;">
    Cependant, nous réalisons que vous avez peut-être rencontré des difficultés pour accéder
    à la plateforme après votre inscription. En effet, nous effectuions une <strong>maintenance
    importante</strong> sur notre infrastructure entre 12h et 14h aujourd'hui, ce qui a pu rendre
    la connexion impossible ou instable durant cette période.
  </p>

  <p style="color: #3a4460; font-size: 14px; line-height: 1.7; margin-bottom: 24px;">
    Nous nous en excusons sincèrement — ce n'est vraiment pas l'expérience que nous souhaitons
    vous offrir dès votre arrivée.
  </p>

  <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <p style="color: #2a7c6f; font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">✅ Tout est maintenant rétabli !</p>
    <p style="color: #3a4460; font-size: 13px; margin: 0 0 16px 0;">Vous pouvez vous connecter dès maintenant :</p>
    <a href="https://www.edu-reussite.com"
       style="display: inline-block; background: #0f1623; color: white; font-size: 14px;
              font-weight: bold; padding: 12px 28px; border-radius: 50px; text-decoration: none;">
      Accéder à la plateforme →
    </a>
  </div>

  <p style="color: #3a4460; font-size: 14px; line-height: 1.7; margin-bottom: 24px;">
    Pour tout problème ou question, notre équipe de soutien est disponible à l'adresse
    <a href="mailto:support@edu-reussite.com" style="color: #d94f2b; font-weight: bold;">support@edu-reussite.com</a>.
    Nous vous répondrons dans les plus brefs délais.
  </p>

  <p style="color: #3a4460; font-size: 14px; margin-bottom: 4px;">
    Encore une fois, toutes nos excuses pour ce désagrément, et bienvenue chez <strong>Édu-Réussite</strong> !
  </p>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;" />

  <p style="color: #0f1623; font-size: 14px; margin: 0 0 4px 0;"><strong>L'Équipe de Soutien Édu-Réussite</strong></p>
  <p style="color: #8a909c; font-size: 12px; margin: 0;">
    <a href="https://www.edu-reussite.com" style="color: #8a909c;">www.edu-reussite.com</a> ·
    <a href="mailto:support@edu-reussite.com" style="color: #8a909c;">support@edu-reussite.com</a>
  </p>
</div>`;
}

async function main() {
  // Récupérer les prénoms des destinataires
  const users = await prisma.user.findMany({
    where: { email: { in: DESTINATAIRES } },
    select: { email: true, name: true },
  });

  // Récupérer les super admins pour la copie
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { email: true },
  });
  const ccEmails = superAdmins.map((u) => u.email).filter(Boolean);

  console.log(`\n📧 Envoi à ${users.length} destinataire(s)`);
  console.log(`📋 Copie à : ${ccEmails.join(", ") || "aucun super admin trouvé"}\n`);

  for (const dest of DESTINATAIRES) {
    const user = users.find((u) => u.email === dest);
    const prenom = user?.name?.split(" ")[0] ?? "cher(e) utilisateur(trice)";

    console.log(`Envoi à ${dest} (prénom : ${prenom})...`);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: dest,
      cc: ccEmails,
      subject: "Nous vous présentons nos excuses — Édu-Réussite",
      html: buildHtml(prenom),
    });

    if (error) {
      console.error(`  ❌ Erreur : ${error.message}`);
    } else {
      console.log(`  ✅ Envoyé (id: ${data.id})`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
