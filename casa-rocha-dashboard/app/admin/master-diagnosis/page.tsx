import { notFound } from "next/navigation";
import { isMasterConfigured, isMasterAuthed, logSecurity } from "@/lib/security/master";
import MasterLogin from "@/components/master/MasterLogin";
import MasterView from "@/components/master/MasterView";

export const dynamic = "force-dynamic";

// Rota canônica do Modo Diagnóstico Interno (§29). Gate server-side além do
// middleware (defesa em profundidade, §7.4): recurso desabilitado → 404 discreto;
// autenticado → painel; não autenticado → formulário de acesso.
export default async function MasterDiagnosisPage() {
  if (!isMasterConfigured()) notFound();

  const authed = await isMasterAuthed();
  if (!authed) return <MasterLogin />;

  await logSecurity({ action: "master_view", result: "allowed", route: "/admin/master-diagnosis" });
  return <MasterView />;
}
