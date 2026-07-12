// Orquestra a codificação de UMA pregação: prompt → OpenRouter → validação → gravação.
// Toda tentativa é registrada em CodingAttempt ANTES da validação (BLUEPRINT v2 §19).
// Regra invariante: nenhum score é alterado automaticamente; falha só rejeita.
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { locateEvidence } from "./locate-evidence";
import { chatCompletion, extractJson, type ChatResult } from "./openrouter";
import { buildCodingPrompt } from "./prompt";
import { CodingResponseSchema, validateBusinessRules, type CodingResponse } from "./schema";
import { SCORE_FIELD_NAMES } from "./score-fields";

export const PROMPT_VERSION = "codebook-v1";
export const SCHEMA_VERSION = "coding-v1";

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

  // 3. Schema Zod
  const zres = CodingResponseSchema.safeParse(extracted);
  if (!zres.success) {
    const issues = zres.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return await fail("FAILED_SCHEMA", "validação de schema", `JSON inválido: ${issues.slice(0, 3).join("; ")}`, {
      rawResponseText: raw.content,
      extractedJson: extractedStr,
      validationIssuesJson: JSON.stringify(issues),
      openrouterMetaJson: meta,
    });
  }
  const parsed: CodingResponse = zres.data;

  // 4. Regras de negócio (score>=4 exige evidência etc.)
  const bizIssues = validateBusinessRules(parsed);
  if (bizIssues.length > 0) {
    return await fail(
      "FAILED_VALIDATION",
      "regras de negócio",
      `regras violadas: ${bizIssues.slice(0, 3).map((i) => i.message).join("; ")}`,
      {
        rawResponseText: raw.content,
        extractedJson: extractedStr,
        businessRuleIssuesJson: JSON.stringify(bizIssues),
        openrouterMetaJson: meta,
      }
    );
  }

  // 5. Localizar TODAS as evidências na transcrição (anti-alucinação)
  const located: { campo: string; citacao: string; comentario: string; startIndex: number; endIndex: number }[] = [];
  const evidenceReport: { campo: string; found: boolean; citacao: string }[] = [];
  for (const ev of parsed.evidencias) {
    const loc = locateEvidence(sermon.transcriptText, ev.citacao);
    evidenceReport.push({ campo: ev.campo, found: Boolean(loc), citacao: ev.citacao.slice(0, 120) });
    if (!loc) {
      return await fail(
        "FAILED_EVIDENCE_LOCATION",
        "localização de evidência",
        `evidência não encontrada na transcrição (campo ${ev.campo}): "${ev.citacao.slice(0, 80)}…"`,
        {
          rawResponseText: raw.content,
          extractedJson: extractedStr,
          evidenceValidationJson: JSON.stringify(evidenceReport),
          openrouterMetaJson: meta,
        }
      );
    }
    located.push({
      campo: ev.campo,
      citacao: loc.exactQuote,
      comentario: ev.comentario,
      startIndex: loc.startIndex,
      endIndex: loc.endIndex,
    });
  }

  // 6. Gravar em transação (substitui codificação IA anterior; preserva 'dictionary')
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) {
    scoresData[f] = parsed.scores[f] ?? null;
  }

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
        confidenceGlobal: parsed.confianca,
        biblicalMainText: parsed.texto_biblico_principal,
        sermonType: parsed.tipo_de_pregacao,
        mainTheme: parsed.tema_central,
        secondaryThemes: JSON.stringify(parsed.temas_secundarios),
        doctrineMain: parsed.doutrina_principal,
        ontologicalVsPragmatic: parsed.ontological_vs_pragmatic,
        summary3Lines: parsed.resumo_3_linhas,
        mainApplication: parsed.aplicacao_principal,
        possibleFormativeGap: parsed.possivel_lacuna_formativa,
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
        confidenceGlobal: parsed.confianca,
        biblicalMainText: parsed.texto_biblico_principal,
        sermonType: parsed.tipo_de_pregacao,
        mainTheme: parsed.tema_central,
        secondaryThemes: JSON.stringify(parsed.temas_secundarios),
        doctrineMain: parsed.doutrina_principal,
        ontologicalVsPragmatic: parsed.ontological_vs_pragmatic,
        summary3Lines: parsed.resumo_3_linhas,
        mainApplication: parsed.aplicacao_principal,
        possibleFormativeGap: parsed.possivel_lacuna_formativa,
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
