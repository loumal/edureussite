import "dotenv/config";
import { genererEtSauvegarderRapports } from "@/lib/evaluation/report-service";

const EVAL_ID = "eval_charbel_j1_1778956726770";

async function main() {
  console.log(`Génération des rapports pour ${EVAL_ID}…`);
  await genererEtSauvegarderRapports(EVAL_ID);
  console.log("Terminé — vérifiez le statut en DB.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
