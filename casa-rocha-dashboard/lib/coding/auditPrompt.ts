// Prompt da auditoria automática da codificação (BLUEPRINT v2 §17). Segunda
// passagem OPCIONAL: um modelo confere a codificação já feita e aponta problemas.
// A auditoria NUNCA altera a análise persistida (§17.4) — só relata.

import type { CodingResponse } from "./schema";
import type { ValidationIssue } from "./schema";

export const AUDIT_PROMPT_VERSION = "audit-v1";

const AUDIT_RULES = `Você é um auditor de codificação teológico-pastoral. Recebe a transcrição,
a codificação já produzida (JSON) e o resultado da validação determinística. Sua tarefa é
CONFERIR, não recodificar. Aponte problemas objetivos, sem julgar intenção do pregador.

Verifique especialmente (§17.3):
- score 4/5 em categoria específica sem evidência;
- risco sensível (passividade, cinismo) sem evidência;
- citação que não parece existir literalmente na transcrição;
- evidência atribuída a um campo, mas que sustenta outro;
- menção pontual tratada como centralidade (4/5);
- crítica religiosa avaliada só por vocabulário, sem tom/fundamentação;
- comentário que julga intenção, caráter ou espiritualidade privada;
- conclusão global indevida sobre a igreja;
- lacuna formativa afirmada sem sustentação;
- score contraditório com o próprio comentário;
- transcrição insuficiente para o score;
- casos que pedem revisão humana.

Regras:
- não invente; baseie-se na transcrição e no JSON fornecidos;
- campos agregados de eixo (biblicalHealthScore, orthodoxyScore, orthopraxyScore,
  spiritualityScore, pastoralHealthScore) NÃO precisam de citação própria — não os
  marque por isso, desde que alguma categoria do eixo tenha evidência;
- suggestedCorrections é apenas sugestão; a auditoria não altera a análise.

Responda SOMENTE com JSON válido no formato:
{
  "auditStatus": "approved | needs_adjustment | rejected",
  "issues": [ { "code": "", "field": "", "message": "", "severity": "high | medium | low" } ],
  "suggestedCorrections": {},
  "needsHumanReview": true,
  "reviewReason": "",
  "confidenceAfterAudit": "alta | média | baixa"
}`;

export function buildAuditPrompt(input: {
  title: string;
  series: string | null;
  year: number | null;
  transcript: string;
  coding: CodingResponse | unknown;
  deterministicIssues: ValidationIssue[];
  codebookVersion: string;
}): { system: string; user: string } {
  const user = [
    `PREGAÇÃO: ${input.title}${input.series ? ` · série ${input.series}` : ""}${input.year ? ` · ${input.year}` : ""}`,
    `Codebook: ${input.codebookVersion}`,
    "",
    "VALIDAÇÃO DETERMINÍSTICA (já executada):",
    input.deterministicIssues.length
      ? input.deterministicIssues.map((i) => `- ${i.field}: ${i.message}`).join("\n")
      : "- nenhum problema apontado pela validação determinística.",
    "",
    "CODIFICAÇÃO (JSON):",
    "```json",
    JSON.stringify(input.coding, null, 2),
    "```",
    "",
    "TRANSCRIÇÃO:",
    input.transcript,
  ].join("\n");
  return { system: AUDIT_RULES, user };
}
