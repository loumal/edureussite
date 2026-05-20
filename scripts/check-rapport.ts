import "dotenv/config";
import { prisma } from "@/lib/prisma/client";

const EVAL_ID = "eval_charbel_j1_1778956726770";

async function main() {
  const ev = await prisma.evaluationRequest.findUnique({
    where: { id: EVAL_ID },
    select: { status: true, reportGeneratedAt: true, rapportEmailSentAt: true },
  });
  console.log("Evaluation:", ev);

  const rapports = await prisma.rapportEvaluation.findMany({
    where: { evaluationId: EVAL_ID },
    select: { id: true, type: true, langue: true, generatedAt: true },
  });
  console.log("Rapports:", rapports);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
