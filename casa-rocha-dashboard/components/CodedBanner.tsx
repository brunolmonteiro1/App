import Link from "next/link";
import Badge from "./Badge";

// Banner metodológico obrigatório dos painéis interpretativos (METHODOLOGY §2/§4).
export default function CodedBanner({
  coded,
  reviewed,
  total,
  onlyReviewed,
}: {
  coded: number;
  reviewed: number;
  total: number;
  onlyReviewed: boolean;
}) {
  const used = onlyReviewed ? reviewed : coded + reviewed;
  if (used === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Nenhuma pregação codificada ainda.</strong> Este painel se popula conforme a
        codificação avança — comece na página{" "}
        <Link href="/coding" className="underline">Codificação</Link>. Até lá, nenhum
        percentual interpretativo é exibido (regra metodológica: sem dado codificado, sem número).
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <Badge kind={onlyReviewed ? "reviewed" : "ai_coded"} />
      <span>
        {used} de {total} pregações {onlyReviewed ? "revisadas" : "codificadas (IA + revisadas)"} —{" "}
        {used < total ? "dados parciais; hipóteses a validar" : "cobertura completa"}
      </span>
    </div>
  );
}
