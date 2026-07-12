// Auditoria por IA sob demanda (BLUEPRINT v2 §17). Segunda passagem OPCIONAL sobre
// uma codificação já feita: o modelo confere e aponta problemas. NUNCA altera a
// análise persistida (§17.4) — grava uma tentativa AUDIT com o parecer e devolve.

import { z } from "zod";
import { prisma } from "@/lib/db";
import { chatCompletion, extractJson } from "./openrouter";
import { CodingResponseSchema, validateBusinessRules, type CodingResponse } from "./schema";
import { buildAuditPrompt, AUDIT_PROMPT_VERSION } from "./auditPrompt";
import { PROMPT_VERSION, SCHEMA_VERSION } from "./analyze";

const AuditIssue = z.object({
  code: z.string().catch(""),
  field: z.string().catch(""),
  message: z.string().catch(""),
  severity: z.enum(["high", "medium", "low"]).catch("medium"),
});

export const AuditResultSchema = z.object({
  auditStatus: z.enum(["approved", "needs_adjustment", "rejected"]).catch("needs_adjustment"),
  issues: z.array(AuditIssue).catch([]),
  suggestedCorrections: z.record(z.string(), z.unknown()).catch({}),
  needsHumanReview: z.boolean().catch(true),
  reviewReason: z.string().catch(""),
  confidenceAfterAudit: z.enum(["alta", "média", "media", "baixa"]).catch("baixa"),
});
export type AuditResult = z.infer<typeof AuditResultSchema>;

export interface AuditOutcome {
  ok: boolean;
  attemptId?: string;
  audit?: AuditResult;
  error?: string;
}

export async function auditCoding(sermonId: string, model: string): Promise<AuditOutcome> {
  const sermon = await prisma.sermon.findUnique({
    where: { id: sermonId },
    select: {
      title: true, series: true, year: true, transcriptText: true,
      analysis: { select: { analysisStatus: true } },
    },
  });
  if (!sermon) return { ok: false, error: "pregação não encontrada" };
  const status = sermon.analysis?.analysisStatus;
  if (status !== "ai_coded" && status !== "reviewed") {
    return { ok: false, error: "só é possível auditar pregações já codificadas" };
  }

  // Reconstrói a codificação a partir da última tentativa bem-sucedida.
  const success = await prisma.codingAttempt.findFirst({
    where: { sermonId, status: "SUCCESS", extractedJson: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { extractedJson: true },
  });
  if (!success?.extractedJson) {
    return { ok: false, error: "codificação original não encontrada para auditar" };
  }
  let coding: CodingResponse | unknown;
  let deterministicIssues: ReturnType<typeof validateBusinessRules> = [];
  try {
    const parsed = CodingResponseSchema.safeParse(JSON.parse(success.extractedJson));
    if (parsed.success) {
      coding = parsed.data;
      deterministicIssues = validateBusinessRules(parsed.data);
    } else {
      coding = JSON.parse(success.extractedJson);
    }
  } catch {
    coding = success.extractedJson;
  }

  const recordAudit = (attemptStatus: string, extras: Record<string, unknown>) =>
    prisma.codingAttempt.create({
      data: {
        sermonId,
        attemptType: "AUDIT",
        model,
        status: attemptStatus,
        promptVersion: `${PROMPT_VERSION}+${AUDIT_PROMPT_VERSION}`,
        schemaVersion: SCHEMA_VERSION,
        ...extras,
      },
    });

  let raw;
  try {
    const { system, user } = buildAuditPrompt({
      title: sermon.title,
      series: sermon.series,
      year: sermon.year,
      transcript: sermon.transcriptText,
      coding,
      deterministicIssues,
      codebookVersion: PROMPT_VERSION,
    });
    raw = await chatCompletion({ model, system, user });
  } catch (e) {
    const at = await recordAudit("FAILED_OPENROUTER", { failStage: "chamada ao provedor" });
    return { ok: false, attemptId: at.id, error: e instanceof Error ? e.message : String(e) };
  }

  let audit: AuditResult;
  try {
    audit = AuditResultSchema.parse(extractJson(raw.content));
  } catch (e) {
    const at = await recordAudit("FAILED_JSON", {
      failStage: "parse da auditoria",
      rawResponseText: raw.content,
    });
    return { ok: false, attemptId: at.id, error: e instanceof Error ? e.message : String(e) };
  }

  const at = await recordAudit("SUCCESS", {
    rawResponseText: raw.content,
    extractedJson: success.extractedJson,
    businessRuleIssuesJson: JSON.stringify(deterministicIssues),
    evidenceValidationJson: JSON.stringify(audit),
    openrouterMetaJson: raw.usage ? JSON.stringify(raw.usage) : null,
  });

  return { ok: true, attemptId: at.id, audit };
}
