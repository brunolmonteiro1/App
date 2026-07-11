// Monta o prompt de codificação por pregação (PIPELINE.md §4.2 adaptado para API).
import { SCORE_FIELDS } from "./score-fields";

const AXIS_ORDER = [
  "1. Bíblia e homilética",
  "2. Ortodoxia",
  "3. Ortopraxia",
  "4. Espiritualidade",
  "8. Saúde pastoral",
  "Transversal: ser × fazer",
];

function scoreCatalog(): string {
  const byAxis = new Map<string, string[]>();
  for (const f of SCORE_FIELDS) {
    const list = byAxis.get(f.axis) ?? [];
    list.push(`  - "${f.field}": ${f.label}`);
    byAxis.set(f.axis, list);
  }
  return AXIS_ORDER.map((axis) => `${axis}:\n${(byAxis.get(axis) ?? []).join("\n")}`).join("\n\n");
}

export function buildCodingPrompt(sermon: {
  title: string;
  series: string | null;
  year: number | null;
  transcriptText: string;
}): { system: string; user: string } {
  const system = `Você é um pesquisador de homilética empírica, teologia pastoral e análise de conteúdo, codificando pregações da igreja A Casa da Rocha (São Paulo, pregador Zé Bruno) para um estudo formativo encomendado pelo presbitério.

REGRAS INEGOCIÁVEIS:
- não faça julgamento pessoal sobre o pregador; não infira intenção, caráter ou motivação;
- não invente dados; não use conhecimento externo à transcrição;
- analise apenas evidências textuais desta transcrição;
- quando não houver evidência, use score 0 ou null e NÃO crie evidência;
- todo score 4 ou 5 DEVE ter uma evidência com citação LITERAL da transcrição (copie o trecho exatamente como está, 15-60 palavras);
- campo incerto → confiança baixa;
- não estime percentuais globais nem faça conclusão geral sobre a igreja.

ESCALA (para todos os scores):
0 = ausente ou não identificável · 1 = menção muito fraca · 2 = presença baixa · 3 = presença moderada · 4 = presença forte (eixo importante) · 5 = tema central da pregação.
Não confunda menção com centralidade: uma palavra citada uma vez não é tema central.

DISTINÇÕES IMPORTANTES:
- Ortopraxia mede prática ESTRUTURADA (chamado concreto, passo aplicável), não exortação genérica "vivam o evangelho".
- "practicalMethodScore": há caminho prático aplicável? 0 = nenhum método; 5 = passos claros e acionáveis.
- "ontological_vs_pragmatic": o tema aplicado dominante é ensinado como identidade/ser ("morra para o ego") = "ontologico"; como método/fazer ("faça X nesta semana") = "pragmatico"; ambos = "equilibrado".
- Scores de "risco" (passividade, cinismo/elitismo) são riscos a monitorar no discurso, não acusações; exigem evidência como qualquer 4-5.

CAMPOS DE SCORE (use exatamente estes nomes):
${scoreCatalog()}

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido (sem markdown, sem cercas de código), com esta estrutura:
{
  "texto_biblico_principal": "Livro Cap:Verso" | null,
  "tipo_de_pregacao": "expositiva_sequencial|expositiva_isolada|tematica_biblica|doutrinaria|pastoral_devocional|profetica_confrontativa|evangelistica|institucional_eclesiologica|testemunhal|motivacional_terapeutica|hibrida",
  "tema_central": "…",
  "temas_secundarios": ["…"],
  "doutrina_principal": "…" | null,
  "ontological_vs_pragmatic": "ontologico|equilibrado|pragmatico|nao_identificavel",
  "resumo_3_linhas": "…",
  "aplicacao_principal": "…" | null,
  "possivel_lacuna_formativa": "redigida como hipótese, nunca acusação" | null,
  "comentario_analitico": "…" | null,
  "confianca": "alta|media|baixa",
  "scores": { "<campo>": 0-5 | null, … (todos os campos do catálogo) },
  "evidencias": [ { "campo": "<campo de score>", "citacao": "trecho LITERAL da transcrição", "comentario": "por que sustenta o score" } ]
}`;

  const user = `PREGAÇÃO A CODIFICAR
Título: ${sermon.title}
Série: ${sermon.series ?? "não identificada"}
Ano: ${sermon.year ?? "não identificado"}

TRANSCRIÇÃO COMPLETA:
${sermon.transcriptText}`;

  return { system, user };
}
