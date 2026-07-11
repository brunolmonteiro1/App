// Relatório executivo (Fase 6): gera dados estruturados e Markdown.
// Percentuais finais SÓ sobre `reviewed`; modo preliminar (ai_coded) é rotulado como tal.

import { average, getCodedScores, MATURITY_FUNNEL, RADAR_AXES, type CodedSermon } from "./aggregates";
import { prisma } from "./db";
import { SCORE_FIELDS } from "./coding/score-fields";

export interface ReportData {
  generatedAt: string;
  mode: "final" | "preliminar";
  totals: { sermons: number; coded: number; reviewed: number; used: number };
  axes: { axis: string; value: number; n: number }[];
  strengths: { label: string; value: number; n: number }[];
  opportunities: { label: string; value: number; n: number }[];
  funnel: { label: string; value: number; n: number }[];
  iscByYear: { year: number; isc: number; n: number }[];
  bySeries: { series: string; n: number; orthodoxy: number | null; orthopraxy: number | null }[];
  doctrines: { label: string; avg: number; n: number; central: number }[];
  reliability: { axis: string; exact: number; adjacent: number; n: number }[] | null;
}

const AGGREGATE_FIELDS = new Set([
  "orthodoxyScore", "orthopraxyScore", "spiritualityScore", "pastoralHealthScore", "biblicalHealthScore",
]);

export async function buildReportData(preliminary: boolean): Promise<ReportData> {
  const onlyReviewed = !preliminary;
  const [rows, sermons, coded, reviewed, satRows] = await Promise.all([
    getCodedScores({ onlyReviewed }),
    prisma.sermon.count({ where: { isSermon: true } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "ai_coded" } }),
    prisma.sermonAnalysis.count({ where: { analysisStatus: "reviewed" } }),
    prisma.saturationMetric.findMany({
      where: { iscRatio: { not: null } },
      select: { iscRatio: true, sermon: { select: { year: true } } },
    }),
  ]);

  const axes = RADAR_AXES.map(({ axis, field }) => {
    const { value, n } = average(rows, field);
    return { axis, value: Number(value.toFixed(2)), n };
  });

  // Forças/oportunidades: campos específicos (não agregados), com n mínimo
  const specific = SCORE_FIELDS.filter((f) => !AGGREGATE_FIELDS.has(f.field));
  const ranked = specific
    .map((f) => {
      const { value, n } = average(rows, f.field);
      return { label: f.label, value: Number(value.toFixed(2)), n };
    })
    .filter((r) => r.n >= Math.min(3, rows.length) && r.n > 0)
    .sort((a, b) => b.value - a.value);
  const strengths = ranked.slice(0, 6);
  const opportunities = [...ranked].reverse().slice(0, 6);

  const funnel = MATURITY_FUNNEL.map(({ label, field }) => {
    const { value, n } = average(rows, field);
    return { label, value: Number(value.toFixed(2)), n };
  });

  const iscMap = new Map<number, { sum: number; n: number }>();
  for (const r of satRows) {
    const y = r.sermon.year;
    if (!y || r.iscRatio == null) continue;
    const acc = iscMap.get(y) ?? { sum: 0, n: 0 };
    acc.sum += r.iscRatio;
    acc.n += 1;
    iscMap.set(y, acc);
  }
  const iscByYear = [...iscMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, { sum, n }]) => ({ year, isc: Number((sum / n).toFixed(1)), n }));

  const seriesMap = new Map<string, CodedSermon[]>();
  for (const r of rows) {
    if (!r.series) continue;
    const list = seriesMap.get(r.series) ?? [];
    list.push(r);
    seriesMap.set(r.series, list);
  }
  const bySeries = [...seriesMap.entries()]
    .map(([series, list]) => {
      const o = average(list, "orthodoxyScore");
      const p = average(list, "orthopraxyScore");
      return {
        series,
        n: list.length,
        orthodoxy: o.n > 0 ? Number(o.value.toFixed(2)) : null,
        orthopraxy: p.n > 0 ? Number(p.value.toFixed(2)) : null,
      };
    })
    .sort((a, b) => b.n - a.n);

  // Doutrinas (Eixo 2): média, n e centralidade (score >= 4)
  const doctrineFields = SCORE_FIELDS.filter(
    (f) => f.axis === "2. Ortodoxia" && f.field !== "orthodoxyScore"
  );
  const doctrines = doctrineFields
    .map((f) => {
      const { value, n } = average(rows, f.field);
      const central = rows.filter((r) => {
        const s = (r.scores as unknown as Record<string, number | null>)[f.field];
        return s !== null && s !== undefined && s >= 4;
      }).length;
      return { label: f.label, avg: Number(value.toFixed(2)), n, central };
    })
    .filter((r) => r.n > 0)
    .sort((a, b) => b.avg - a.avg);

  // Confiabilidade IA×revisor: revisadas com snapshot, comparação por eixo
  const reviewedWithSnapshot = await prisma.sermonAnalysis.findMany({
    where: { analysisStatus: "reviewed", aiScoresJson: { not: null } },
    select: { sermonId: true, aiScoresJson: true, sermon: { select: { scores: true } } },
  });
  let reliability: ReportData["reliability"] = null;
  if (reviewedWithSnapshot.length > 0) {
    const axisFields = new Map<string, string[]>();
    for (const f of SCORE_FIELDS) {
      const list = axisFields.get(f.axis) ?? [];
      list.push(f.field);
      axisFields.set(f.axis, list);
    }
    reliability = [...axisFields.entries()].map(([axis, fields]) => {
      let exact = 0, adjacent = 0, n = 0;
      for (const row of reviewedWithSnapshot) {
        const ai = JSON.parse(row.aiScoresJson!) as Record<string, number | null>;
        const final = row.sermon.scores as unknown as Record<string, number | null> | null;
        if (!final) continue;
        for (const f of fields) {
          const a = ai[f], b = final[f];
          if (a == null || b == null) continue;
          n++;
          if (a === b) { exact++; adjacent++; }
          else if (Math.abs(a - b) <= 1) adjacent++;
        }
      }
      return {
        axis,
        exact: n > 0 ? Number(((exact / n) * 100).toFixed(0)) : 0,
        adjacent: n > 0 ? Number(((adjacent / n) * 100).toFixed(0)) : 0,
        n,
      };
    }).filter((r) => r.n > 0);
  }

  return {
    generatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    mode: preliminary ? "preliminar" : "final",
    totals: { sermons, coded, reviewed, used: rows.length },
    axes,
    strengths,
    opportunities,
    funnel,
    iscByYear,
    bySeries,
    doctrines,
    reliability,
  };
}

const LIMITATIONS = `## Limitações declaradas (fixas)

- Transcrições automáticas do YouTube (sem pontuação; possíveis erros de reconhecimento);
- Datas parcialmente estimadas por interpolação;
- Ausência de timestamps (evidência textual, não temporal);
- A análise mede o **púlpito dominical**, não toda a vida formativa da igreja (grupos, aconselhamento e cursos não estão no corpus);
- Não há dados de engajamento da congregação neste corpus;
- Codificação por IA revisada por humano — não é juízo pastoral automático;
- Codebook versão 1.`;

export function buildMarkdown(d: ReportData): string {
  const denom = `${d.totals.used} pregações ${d.mode === "final" ? "revisadas" : "codificadas (PRELIMINAR)"} de ${d.totals.sermons}`;
  const modeWarning =
    d.mode === "preliminar"
      ? `\n> **ATENÇÃO — RELATÓRIO PRELIMINAR.** Baseado em codificação por IA ainda não revisada. Não usar como resultado final nem citar percentuais deste documento ao presbitério.\n`
      : "";
  const lines: string[] = [
    `# Resumo Executivo — Dashboard de Saúde Teológica e Formação Pastoral`,
    ``,
    `**A Casa da Rocha** · gerado em ${d.generatedAt} · base: ${denom} (${d.totals.reviewed} revisadas · ${d.totals.coded} aguardando revisão)`,
    modeWarning,
    `> Linguagem metodológica: este relatório descreve **ênfases observadas** e **hipóteses de oportunidade formativa**. Não julga intenção, não acusa e não conclui além dos dados. Toda recomendação é **trilha complementar**, nunca mudança do púlpito.`,
    ``,
    `## Radar dos eixos (score médio 0–5)`,
    ``,
    `| Eixo | Média | n |`,
    `|---|---|---|`,
    ...d.axes.map((a) => `| ${a.axis} | ${a.n > 0 ? a.value.toFixed(2) : "—"} | ${a.n} |`),
    ``,
    `## Principais forças observadas`,
    ``,
    ...d.strengths.map((s, i) => `${i + 1}. **${s.label}** — média ${s.value.toFixed(2)} (n=${s.n})`),
    ``,
    `## Oportunidades de formação (hipóteses a validar)`,
    ``,
    ...d.opportunities.map(
      (s, i) => `${i + 1}. **${s.label}** — média ${s.value.toFixed(2)} (n=${s.n}) — candidata a trilha complementar`
    ),
    ``,
    `## Funil de maturidade (Eixo 8)`,
    ``,
    `| Estágio | Média | n |`,
    `|---|---|---|`,
    ...d.funnel.map((f) => `| ${f.label} | ${f.value.toFixed(2)} | ${f.n} |`),
    ``,
    `## Índice de Saturação Crítica por ano (métrica lexical)`,
    ``,
    `| Ano | ISC médio | n |`,
    `|---|---|---|`,
    ...d.iscByYear.map((r) => `| ${r.year} | ${r.isc}% | ${r.n} |`),
    ``,
    `_ISC = menções de crítica ao sistema / menções do Evangelho × 100. Frequência de vocabulário — não mede intenção._`,
    ``,
    `## Doutrinas (Eixo 2 — média e centralidade)`,
    ``,
    `| Doutrina | Média | Central (score ≥4) | n |`,
    `|---|---|---|---|`,
    ...d.doctrines.map((r) => `| ${r.label} | ${r.avg.toFixed(2)} | ${r.central} | ${r.n} |`),
    ``,
    `_Centralidade = nº de pregações onde a doutrina é eixo forte/central, sempre com evidência textual._`,
    ``,
    `## Por série (ortodoxia × ortopraxia médias)`,
    ``,
    `| Série | Codificadas | Ortodoxia | Ortopraxia |`,
    `|---|---|---|---|`,
    ...d.bySeries.map(
      (s) => `| ${s.series} | ${s.n} | ${s.orthodoxy ?? "—"} | ${s.orthopraxy ?? "—"} |`
    ),
    ``,
  ];
  if (d.reliability && d.reliability.length > 0) {
    lines.push(
      `## Confiabilidade do método (concordância IA × revisor)`,
      ``,
      `| Eixo | Concordância exata | Concordância adjacente (±1) | comparações |`,
      `|---|---|---|---|`,
      ...d.reliability.map((r) => `| ${r.axis} | ${r.exact}% | ${r.adjacent}% | ${r.n} |`),
      ``,
      `_Comparação entre os scores originais da IA e os scores finais após revisão humana._`,
      ``
    );
  }
  lines.push(LIMITATIONS, ``, `---`, ``, `_Todo dado deste relatório é auditável no dashboard (página Evidências): cada score relevante está ancorado em trecho literal da transcrição, com link para a pregação e o vídeo original._`);
  return lines.join("\n");
}
