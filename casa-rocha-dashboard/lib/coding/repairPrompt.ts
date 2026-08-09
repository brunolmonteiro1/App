// Prompt de reparo por evidência (BLUEPRINT v2 §18.7). A IA só pode localizar
// evidências literais para os scores JÁ atribuídos — nunca alterar scores.

export function buildRepairPrompt(opts: {
  transcript: string;
  fieldsNeedingEvidence: { field: string; score: number | null }[];
}): { system: string; user: string } {
  const fields = opts.fieldsNeedingEvidence
    .map((f) => `- ${f.field} (score atribuído: ${f.score ?? "?"})`)
    .join("\n");

  const system = `Você recebeu uma análise de pregação que falhou porque um ou mais scores altos não têm evidência literal validada.

Sua tarefa principal é LOCALIZAR na transcrição citações literais que sustentem os scores JÁ ATRIBUÍDOS.

Regras:
1. NÃO altere scores no objeto de análise.
2. NÃO invente citações — a citação deve existir literalmente na transcrição (copie o trecho exatamente, 15-60 palavras).
3. O campo de cada evidência deve ser exatamente igual ao nome do score.
4. Retorne apenas evidências candidatas para os campos listados.
5. Se para algum campo você NÃO encontrar evidência literal suficiente, marque evidenceFound=false para esse campo.
6. Você PODE incluir uma sugestão de score em scoreSuggestions, mas ela será apenas uma sugestão humana NÃO aplicada — não a apresente como correção salva.
7. Responda somente JSON válido.

Formato de saída (JSON):
{
  "evidencias": [ { "campo": "<nome do score>", "citacao": "trecho literal", "comentario": "por que sustenta" } ],
  "camposSemEvidencia": [ "<nome do score>" ],
  "scoreSuggestions": [ { "field": "<nome>", "originalScore": 4, "suggestedScore": 2, "reason": "..." } ]
}`;

  const user = `CAMPOS QUE PRECISAM DE EVIDÊNCIA LITERAL:
${fields}

TRANSCRIÇÃO COMPLETA:
${opts.transcript}`;

  return { system, user };
}
