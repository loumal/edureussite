import "dotenv/config";
import { prisma } from "@/lib/prisma/client";

const EVAL_ID = "eval_charbel_j1_1778956726770";

async function main() {
  const deleted = await prisma.rapportEvaluation.deleteMany({ where: { evaluationId: EVAL_ID } });
  console.log("Rapports supprimés:", deleted.count);
  await prisma.evaluationRequest.update({
    where: { id: EVAL_ID },
    data: { status: "FORM_COMPLETED", reportGeneratedAt: null },
  });
  console.log("Statut remis à FORM_COMPLETED");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
