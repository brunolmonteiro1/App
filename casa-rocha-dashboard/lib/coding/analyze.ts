// Orquestra a codificação de UMA pregação: prompt → OpenRouter → validação → gravação.
// Toda tentativa é registrada em CodingAttempt ANTES da validação (BLUEPRINT v2 §19).
// Regra invariante: nenhum score é alterado automaticamente; falha só rejeita.
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { detectCompositeQuote, locateEvidence } from "./locate-evidence";
import { chatCompletion, extractJson, type ChatResult } from "./openrouter";
import { buildCodingPrompt } from "./prompt";
import {
  applyConditionalApplicability,
  computeNeedsReview,
  CodingResponseSchema,
  normalizeEnums,
  validateBusinessRules,
  type CodingResponse,
} from "./schema";
import { AGGREGATE_SCORE_FIELDS, applicationModeToOntological, SCORE_FIELD_NAMES } from "./score-fields";

export const PROMPT_VERSION = "codebook-v1.2";
export const SCHEMA_VERSION = "coding-v1";

// Status de cada evidência candidata processada (nenhuma interrompe o loop).
export type EvidenceStatus = "located" | "unlocated" | "ignored_aggregate" | "composite_rejected";

export interface AnalyzeResult {
  ok: boolean;
  sermonId: string;
  title: string;
  error?: string;
  attemptId?: string;
  attemptStatus?: string;
  scoresSaved?: number;
  evidenceSaved?: number;
  confidence?: string;
}

type AttemptExtras = Partial<
  Pick<
    Prisma.CodingAttemptUncheckedCreateInput,
    | "rawResponseText"
    | "extractedJson"
    | "validationIssuesJson"
    | "businessRuleIssuesJson"
    | "evidenceValidationJson"
    | "openrouterMetaJson"
  >
>;

export async function analyzeSermon(sermonId: string, model: string): Promise<AnalyzeResult> {
  const sermon = await prisma.sermon.findUnique({
    where: { id: sermonId },
    include: { analysis: { select: { analysisStatus: true } } },
  });
  if (!sermon || !sermon.isSermon) {
    return { ok: false, sermonId, title: "?", error: "pregação não encontrada" };
  }
  if (sermon.analysis?.analysisStatus === "reviewed") {
    return { ok: false, sermonId, title: sermon.title, error: "já revisada — recodificação exige desfazer a revisão" };
  }

  // Grava a tentativa (imutável) e, no caminho de falha, mantém aiError na análise para a lista de falhas.
  const record = async (
    status: string,
    failStage: string | null,
    extras: AttemptExtras
  ): Promise<string> => {
    const attempt = await prisma.codingAttempt.create({
      data: {
        sermonId,
        attemptType: "INITIAL_CODING",
        model,
        status,
        failStage,
        promptVersion: PROMPT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        ...extras,
      },
    });
    return attempt.id;
  };

  const fail = async (
    status: string,
    failStage: string,
    error: string,
    extras: AttemptExtras
  ): Promise<AnalyzeResult> => {
    const attemptId = await record(status, failStage, extras);
    await prisma.sermonAnalysis.upsert({
      where: { sermonId },
      create: { sermonId, analysisStatus: "pending", aiModel: model, aiError: error },
      update: { aiModel: model, aiError: error },
    });
    return { ok: false, sermonId, title: sermon.title, error, attemptId, attemptStatus: status };
  };

  // 1. Chamada ao modelo
  let raw: ChatResult;
  try {
    const { system, user } = buildCodingPrompt(sermon);
    raw = await chatCompletion({ model, system, user });
  } catch (e) {
    return await fail(
      "FAILED_OPENROUTER",
      "chamada ao provedor",
      e instanceof Error ? e.message : String(e),
      {}
    );
  }

  const meta = raw.usage ? JSON.stringify(raw.usage) : null;

  // 2. Extrair JSON
  let extracted: unknown;
  try {
    extracted = extractJson(raw.content);
  } catch (e) {
    return await fail("FAILED_JSON", "extração de JSON", e instanceof Error ? e.message : String(e), {
      rawResponseText: raw.content,
      openrouterMetaJson: meta,
    });
  }
  const extractedStr = JSON.stringify(extracted);

  // 3. Normalização explícita de enums (registrada, nunca silenciosa) + schema Zod
  const { value: normalizedRaw, normalizations } = normalizeEnums(extracted);
  const zres = CodingResponseSchema.safeParse(normalizedRaw);
  if (!zres.success) {
    const issues = zres.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return await fail("FAILED_SCHEMA", "validação de schema", `JSON inválido: ${issues.slice(0, 3).join("; ")}`, {
      rawResponseText: raw.content,
      extractedJson: extractedStr,
      validationIssuesJson: JSON.stringify({ schemaIssues: issues, enumNormalizations: normalizations }),
      openrouterMetaJson: meta,
    });
  }
  const parsed: CodingResponse = zres.data;

  // 4. Aplicabilidade condicional (§6.1): incoerência semântica NÃO é falha
  // técnica — vira gatilho de revisão humana. Nenhum score é alterado.
  const conditional = applyConditionalApplicability(parsed);

  // 5. Processar TODAS as evidências (anti-alucinação) — nenhuma falha
  // individual interrompe o loop; uma evidência inválida não apaga as válidas.
  const located: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  const evidenceReport: { campo: string; status: EvidenceStatus; citacao: string; reason?: string }[] = [];
  for (const ev of parsed.evidencias) {
    const short = ev.citacao.slice(0, 120);
    // Agregados de eixo NUNCA têm evidência própria — descarte incondicional
    // (localizável ou não); a fundamentação vem das categorias específicas.
    if (AGGREGATE_SCORE_FIELDS.has(ev.campo)) {
      evidenceReport.push({ campo: ev.campo, status: "ignored_aggregate", citacao: short });
      continue;
    }
    const comp = detectCompositeQuote(ev.citacao);
    if (comp.isComposite) {
      evidenceReport.push({ campo: ev.campo, status: "composite_rejected", citacao: short, reason: comp.reason });
      continue;
    }
    const loc = locateEvidence(sermon.transcriptText, ev.citacao);
    if (!loc) {
      evidenceReport.push({ campo: ev.campo, status: "unlocated", citacao: short });
      continue;
    }
    evidenceReport.push({ campo: ev.campo, status: "located", citacao: short });
    located.push({
      campo: ev.campo,
      citacao: loc.exactQuote,
      comentario: ev.comentario,
      startIndex: loc.startIndex,
      endIndex: loc.endIndex,
    });
  }
  const locatedFields = new Set(located.map((e) => e.campo));

  // 6. Regras de negócio APÓS a localização: só evidência realmente localizada
  // satisfaz a exigência — citação fabricada/composta não conta.
  const bizIssues = validateBusinessRules(parsed, locatedFields);
  if (bizIssues.length > 0) {
    // Se algum campo violado tinha candidata que falhou na localização, a etapa
    // amigável é "localização de evidência"; senão, "regras de negócio".
    const failedCandidateFields = new Set(
      evidenceReport.filter((r) => r.status === "unlocated" || r.status === "composite_rejected").map((r) => r.campo)
    );
    const dueToLocation = bizIssues.some((i) => failedCandidateFields.has(i.field));
    return await fail(
      dueToLocation ? "FAILED_EVIDENCE_LOCATION" : "FAILED_VALIDATION",
      dueToLocation ? "localização de evidência" : "regras de negócio",
      `regras violadas: ${bizIssues.slice(0, 3).map((i) => i.message).join("; ")}`,
      {
        rawResponseText: raw.content,
        extractedJson: extractedStr,
        businessRuleIssuesJson: JSON.stringify(bizIssues),
        evidenceValidationJson: JSON.stringify(evidenceReport),
        validationIssuesJson: JSON.stringify({
          enumNormalizations: normalizations,
          warnings: conditional.warnings,
          reviewTriggers: conditional.reviewTriggers,
        }),
        openrouterMetaJson: meta,
      }
    );
  }

  // 7. Gravar em transação (substitui codificação IA anterior; preserva 'dictionary')
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) {
    scoresData[f] = parsed.scores[f] ?? null;
  }

  const base = computeNeedsReview(parsed);
  const triggerReasons = conditional.reviewTriggers.map((t) => t.message);
  const needs = base.needs || triggerReasons.length > 0;
  const reason = [base.reason, ...triggerReasons].filter(Boolean).join("; ") || null;
  // Campos da análise (compartilhados entre create e update)
  const analysisFields = {
    confidenceGlobal: parsed.confianca,
    biblicalMainText: parsed.texto_biblico_principal,
    sermonType: parsed.tipo_de_pregacao,
    mainTheme: parsed.tema_central,
    secondaryThemes: JSON.stringify(parsed.temas_secundarios),
    doctrineMain: parsed.doutrina_principal,
    // ontologicalVsPragmatic derivado de applicationMode (compat.), com fallback ao campo antigo
    ontologicalVsPragmatic:
      parsed.application_mode !== "not_identifiable"
        ? applicationModeToOntological(parsed.application_mode)
        : parsed.ontological_vs_pragmatic,
    applicationMode: parsed.application_mode,
    discourseMode: parsed.discourse_mode,
    critiqueShareEstimate: parsed.critique_share_estimate,
    criticTarget: parsed.critic_target,
    criticTone: parsed.critic_tone,
    healthyOrDemobilizingCritique: parsed.healthy_or_demobilizing_critique,
    politicalCritiqueTarget: parsed.political_critique_target,
    sensitivityLevel: parsed.sensitivity_level,
    needsHumanReview: needs,
    reviewReason: reason,
    summary3Lines: parsed.resumo_3_linhas,
    mainApplication: parsed.aplicacao_principal,
    possibleFormativeGap: parsed.possivel_lacuna_formativa,
  };

  await prisma.$transaction([
    prisma.sermonAnalysis.upsert({
      where: { sermonId },
      create: {
        sermonId,
        analysisStatus: "ai_coded",
        aiModel: model,
        aiCodedAt: new Date(),
        aiError: null,
        aiScoresJson: JSON.stringify(scoresData),
        ...analysisFields,
      },
      update: {
        analysisStatus: "ai_coded",
        aiModel: model,
        aiCodedAt: new Date(),
        aiError: null,
        aiScoresJson: JSON.stringify(scoresData),
        reviewStatus: null,
        reviewedBy: null,
        reviewedAt: null,
        ...analysisFields,
      },
    }),
    prisma.sermonScores.upsert({
      where: { sermonId },
      create: { sermonId, ...scoresData },
      update: scoresData,
    }),
    prisma.sermonEvidence.deleteMany({ where: { sermonId, analysisMethod: "ai_coding" } }),
    prisma.sermonEvidence.createMany({
      data: located.map((ev) => ({
        sermonId,
        category: ev.campo,
        scoreField: ev.campo,
        scoreValue: parsed.scores[ev.campo] ?? null,
        evidenceQuote: ev.citacao,
        evidenceStartIndex: ev.startIndex,
        evidenceEndIndex: ev.endIndex,
        analyticalComment: ev.comentario,
        analysisMethod: "ai_coding",
        confidence: parsed.confianca,
      })),
    }),
  ]);

  const attemptId = await record("SUCCESS", null, {
    rawResponseText: raw.content,
    extractedJson: extractedStr,
    evidenceValidationJson: JSON.stringify(evidenceReport),
    validationIssuesJson:
      normalizations.length || conditional.warnings.length || conditional.reviewTriggers.length
        ? JSON.stringify({
            enumNormalizations: normalizations,
            warnings: conditional.warnings,
            reviewTriggers: conditional.reviewTriggers,
          })
        : null,
    openrouterMetaJson: meta,
  });

  return {
    ok: true,
    sermonId,
    title: sermon.title,
    attemptId,
    attemptStatus: "SUCCESS",
    scoresSaved: Object.values(scoresData).filter((v) => v !== null).length,
    evidenceSaved: located.length,
    confidence: parsed.confianca,
  };
}
