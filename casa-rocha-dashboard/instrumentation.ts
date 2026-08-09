// Hook de instrumentação do Next: roda uma vez no startup do servidor.
// Retoma a fila de codificação (Rodada H) — jobs 'running' órfãos (processo
// caiu no meio) voltam para 'queued' e o worker recomeça sozinho, sem depender
// do navegador. Só no runtime Node (não no edge).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { resumeOrphans, startWorker } = await import("@/lib/coding/worker");
    const revived = await resumeOrphans();
    if (revived > 0) console.log(`→ Fila de codificação: ${revived} job(s) órfão(s) retomado(s).`);
    const { started } = startWorker();
    if (started) console.log("→ Worker de codificação iniciado.");
  } catch (e) {
    console.error("Falha ao iniciar o worker de codificação:", e);
  }
}
