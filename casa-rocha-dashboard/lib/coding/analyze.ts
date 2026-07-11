// Orquestra a codificação de UMA pregação: prompt → OpenRouter → validação → gravação.
import { prisma } from "../db";
import { locateEvidence } from "./locate-evidence";
import { chatCompletion, extractJson } from "./openrouter";
import { buildCodingPrompt } from "./prompt";
import { CodingResponseSchema, validateBusinessRules, type CodingResponse } from "./schema";
import { SCORE_FIELD_NAMES } from "./score-fields";

export interface AnalyzeResult {
  ok: boolean;
  sermonId: string;
  title: string;
  error?: string;
  scoresSaved?: number;
  evidenceSaved?: number;
  confidence?: string;
}

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

  const fail = async (error: string): Promise<AnalyzeResult> => {
    await prisma.sermonAnalysis.upsert({
      where: { sermonId },
      create: { sermonId, analysisStatus: "pending", aiModel: model, aiError: error },
      update: { aiModel: model, aiError: error },
    });
    return { ok: false, sermonId, title: sermon.title, error };
  };

  // 1. Chamada ao modelo
  let parsed: CodingResponse;
  try {
    const { system, user } = buildCodingPrompt(sermon);
    const result = await chatCompletion({ model, system, user });
    const raw = extractJson(result.content);
    const zres = CodingResponseSchema.safeParse(raw);
    if (!zres.success) {
      return await fail(`JSON inválido: ${zres.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
    parsed = zres.data;
  } catch (e) {
    return await fail(e instanceof Error ? e.message : String(e));
  }

  // 2. Regras de negócio (score>=4 exige evidência etc.)
  const issues = validateBusinessRules(parsed);
  if (issues.length > 0) {
    return await fail(`regras violadas: ${issues.slice(0, 3).map((i) => i.message).join("; ")}`);
  }

  // 3. Localizar TODAS as evidências na transcrição (anti-alucinação)
  const located: {
    campo: string;
    citacao: string;
    comentario: string;
    startIndex: number;
    endIndex: number;
  }[] = [];
  for (const ev of parsed.evidencias) {
    const loc = locateEvidence(sermon.transcriptText, ev.citacao);
    if (!loc) {
      return await fail(`evidência não encontrada na transcrição (campo ${ev.campo}): "${ev.citacao.slice(0, 80)}…"`);
    }
    located.push({
      campo: ev.campo,
      citacao: loc.exactQuote,
      comentario: ev.comentario,
      startIndex: loc.startIndex,
      endIndex: loc.endIndex,
    });
  }

  // 4. Gravar em transação (substitui codificação IA anterior; preserva 'dictionary')
  const scoresData: Record<string, number | null> = {};
  for (const f of SCORE_FIELD_NAMES) {
    scoresData[f] = parsed.scores[f] ?? null;
  }

  const [, , evCount] = await prisma.$transaction([
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
  void evCount;

  return {
    ok: true,
    sermonId,
    title: sermon.title,
    scoresSaved: Object.values(scoresData).filter((v) => v !== null).length,
    evidenceSaved: located.length,
    confidence: parsed.confianca,
  };
}
