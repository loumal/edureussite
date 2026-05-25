import "dotenv/config";
import { prisma } from "@/lib/prisma/client";

const EVAL_ID = "eval_charbel_j1_1778956726770";

async function main() {
  await prisma.evaluationRequest.update({
    where: { id: EVAL_ID },
    data: { rapportEmailSentAt: new Date() },
  });
  console.log("rapportEmailSentAt marqué.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
