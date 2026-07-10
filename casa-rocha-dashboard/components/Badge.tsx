// Selos de proveniência e status (METHODOLOGY.md §4) — texto sempre presente,
// cor nunca carrega significado sozinha.

const STYLES: Record<string, string> = {
  lexical: "bg-blue-50 text-blue-900 border-blue-200",
  ai_coded: "bg-amber-50 text-amber-900 border-amber-200",
  reviewed: "bg-green-50 text-green-900 border-green-200",
  estimada: "bg-neutral-100 text-neutral-700 border-neutral-200",
  conflito: "bg-orange-50 text-orange-900 border-orange-200",
  saturacao_alta: "bg-orange-50 text-orange-900 border-orange-200",
  saturacao_moderada: "bg-amber-50 text-amber-900 border-amber-200",
  saturacao_baixa: "bg-neutral-100 text-neutral-700 border-neutral-200",
  nao_calculavel: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

const LABELS: Record<string, string> = {
  lexical: "métrica lexical",
  ai_coded: "codificada por IA",
  reviewed: "revisada",
  estimada: "data estimada",
  conflito: "conflito de metadados",
  saturacao_alta: "saturação alta",
  saturacao_moderada: "saturação moderada",
  saturacao_baixa: "saturação baixa",
  nao_calculavel: "não calculável",
};

export default function Badge({ kind, text }: { kind: string; text?: string }) {
  const cls = STYLES[kind] ?? "bg-neutral-100 text-neutral-700 border-neutral-200";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] leading-4 ${cls}`}>
      {text ?? LABELS[kind] ?? kind}
    </span>
  );
}
