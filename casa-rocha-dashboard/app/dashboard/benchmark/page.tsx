import Link from "next/link";
import Badge from "@/components/Badge";
import { Card } from "@/components/Card";
import { average, getCodedScores } from "@/lib/aggregates";
import { BENCHMARK_TOPICS } from "@/lib/benchmark";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BenchmarkPage() {
  const [total, coded] = await Promise.all([
    prisma.sermon.count({ where: { isSermon: true } }),
    getCodedScores({}),
  ]);

  // Presença determinística: pregações distintas citando (livro, capítulo) de cada tema
  const presence = await Promise.all(
    BENCHMARK_TOPICS.map(async (t) => {
      const or = t.refs.flatMap((r) => r.chapters.map((ch) => ({ bookSlug: r.slug, chapter: ch })));
      const rows = await prisma.biblicalReference.findMany({
        where: { OR: or },
        select: { sermonId: true },
        distinct: ["sermonId"],
      });
      return rows.length;
    })
  );

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Cobertura vs. Igreja Saudável</h1>
        <div className="text-xs text-muted max-w-lg text-right">
          Gap analysis contra a régua de <code>HEALTH_BENCHMARK.md</code>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Lacuna = hipótese a validar.</strong> Presença baixa aqui pode significar que o tema
        aparece sem citar o texto-base, em outra série, nos grupos, no Caminho das Letras — ou fora do
        corpus dominical. Toda recomendação é <strong>trilha complementar</strong>, nunca crítica ao púlpito.
      </div>

      <Card
        title="Temas do benchmark: presença dos textos-base × centralidade codificada"
        footnote={`Presença: pregações distintas citando livro+capítulo dos textos-base (motor bíblico — determinístico, ${total} pregações). Centralidade: score médio 0–5 sobre as ${coded.length} codificadas até agora.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-hairline">
                <th className="py-2 pr-3 font-medium">Tema</th>
                <th className="py-2 pr-3 font-medium">Textos-base</th>
                <th className="py-2 pr-3 font-medium">Presença <Badge kind="lexical" text="regex" /></th>
                <th className="py-2 pr-3 font-medium">Centralidade <Badge kind="ai_coded" text="codificação" /></th>
                <th className="py-2 font-medium">Trilha complementar sugerida</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_TOPICS.map((t, i) => {
                const cent = average(coded, t.scoreField);
                const pres = presence[i];
                const presPct = (pres / Math.max(1, total)) * 100;
                return (
                  <tr key={t.topic} className="border-b border-hairline last:border-0 align-top">
                    <td className="py-2 pr-3 font-medium whitespace-nowrap">{t.topic}</td>
                    <td className="py-2 pr-3 text-secondary text-xs">
                      {t.refs.map((r, j) => (
                        <span key={j}>
                          <Link href={`/sermons?book=${r.slug}`} className="hover:underline">{r.label}</Link>
                          {j < t.refs.length - 1 ? "; " : ""}
                        </span>
                      ))}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded bg-background overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${Math.min(100, presPct)}%`, background: "var(--series-1)" }} />
                        </div>
                        <span className="tabular-nums text-xs text-secondary">{pres} de {total}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-xs">
                      {cent.n > 0 ? (
                        <>{cent.value.toFixed(2)} <span className="text-muted">(n={cent.n})</span></>
                      ) : (
                        <span className="text-muted">aguardando codificação</span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-secondary">{t.trilha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted max-w-3xl">
        Leitura correta: "texto-base pouco citado" ≠ "a igreja não ensina isso". A coluna de presença
        mede citação explícita de livro+capítulo; a de centralidade mede o tema em si (com evidência).
        As duas juntas apontam <em>onde olhar</em> — a decisão pastoral é do presbitério.
      </p>
    </div>
  );
}
