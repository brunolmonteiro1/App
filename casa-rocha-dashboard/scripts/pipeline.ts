// Orquestrador do pipeline determinístico: importa → refs bíblicas → lexical/ISC.
// Usado no primeiro boot do container e manualmente: npx tsx scripts/pipeline.ts

import { execFileSync } from "node:child_process";

const steps = [
  "scripts/import-notebooklm-backup.ts",
  "scripts/detect-biblical-references.ts",
  "scripts/run-lexical-analysis.ts",
];

for (const step of steps) {
  console.log(`\n=== ${step} ===`);
  execFileSync("npx", ["tsx", step], { stdio: "inherit" });
}
console.log("\nPipeline concluído.");
