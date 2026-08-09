// Catálogo canônico dos campos de score 0–5 (CODEBOOK.md §4/§4b).
// Fonte única para: prompt da IA, validação Zod, gravação no banco e UI de revisão.

// Famílias metodológicas de score (ajuste 3 da revisão): a MESMA escala 0–5
// não serve para semânticas diferentes. O dashboard NUNCA trata null como zero.
export type ScoreFamily = "presence" | "quality" | "applicability" | "risk" | "aggregate";

export interface ScoreFieldDef {
  field: string; // nome da coluna em SermonScores
  label: string; // rótulo pt-BR mostrado à IA e na UI
  axis: string; // eixo do CODEBOOK
  family: ScoreFamily; // família metodológica (semântica de 0/null/evidência/agregação)
}

// Semântica documentada por família (Entregável 2 do plano).
export const FAMILY_SEMANTICS: Record<
  ScoreFamily,
  {
    label: string;
    zeroMeaning: string;
    nullMeaning: string;
    scale: string;
    evidenceRequirement: string;
    aggregationMethod: string;
  }
> = {
  presence: {
    label: "Presença/centralidade",
    zeroMeaning: "ausente na pregação",
    nullMeaning: "não avaliado",
    scale: "0 ausente · 1 menção · 2 presença baixa · 3 desenvolvido · 4 eixo forte · 5 tema governante",
    evidenceRequirement: "score ≥4 exige ≥1 citação direta validada (direct_quote)",
    aggregationMethod: "mean_present (média só dos presentes, score ≥1)",
  },
  quality: {
    label: "Qualidade",
    zeroMeaning: "NÃO EXISTE — usar null (0 contaminaria médias)",
    nullMeaning: "não aplicável / impossível avaliar",
    scale: "null não aplicável · 1 muito frágil · 2 frágil · 3 adequado · 4 forte · 5 exemplar",
    evidenceRequirement: "score ≥4 exige citação direta OU análise estrutural justificada",
    aggregationMethod: "mean_nonnull (média só de não-null)",
  },
  applicability: {
    label: "Aplicabilidade",
    zeroMeaning: "ausente",
    nullMeaning: "não avaliado",
    scale: "0 ausente · 1 princípio abstrato · 2 exortação genérica · 3 direção reconhecível · 4 prática concreta · 5 método estruturado",
    evidenceRequirement: "score ≥ limiar exige citação direta que MOSTRE a prática/método",
    aggregationMethod: "mean_present",
  },
  risk: {
    label: "Risco",
    zeroMeaning: "sem evidência de risco",
    nullMeaning: "não avaliado",
    scale: "0 sem evidência de risco · 1 risco remoto · 2 baixo · 3 relevante · 4 forte · 5 dominante",
    evidenceRequirement:
      "score ≥3 exige múltiplas citações OU citação + análise estrutural + avaliação de cobertura (ausência de contrapeso na pregação inteira); NUNCA frase isolada; sempre revisão humana",
    aggregationMethod: "exclude_from_averages (nunca entra em média de eixo)",
  },
  aggregate: {
    label: "Agregado de eixo",
    zeroMeaning: "—",
    nullMeaning: "não avaliado",
    scale: "síntese 0–5 do eixo (avaliação holística da IA)",
    evidenceRequirement:
      "NUNCA tem evidência própria (sempre descartada); exige ≥1 componente específico do eixo sustentado",
    aggregationMethod: "aggregate (holístico da IA + painel derivado calculado em runtime — derived-scores.ts)",
  },
};

const FAMILY_OF = () => new Map(SCORE_FIELDS.map((f) => [f.field, f.family]));
let familyCache: Map<string, ScoreFamily> | null = null;
export function familyOf(field: string): ScoreFamily {
  if (!familyCache) familyCache = FAMILY_OF();
  return familyCache.get(field) ?? "presence";
}

export const SCORE_FIELDS: ScoreFieldDef[] = [
  // Eixo 1 — Saúde bíblica e homilética
  { field: "biblicalHealthScore", label: "Saúde bíblica geral", axis: "1. Bíblia e homilética", family: "aggregate" },
  { field: "homileticExpositionScore", label: "Exposição do texto no contexto (vs uso ilustrativo)", axis: "1. Bíblia e homilética", family: "quality" },
  { field: "christocentricReadingScore", label: "Leitura cristocêntrica", axis: "1. Bíblia e homilética", family: "quality" },
  { field: "biblicalApplicationScore", label: "Aplicação bíblica", axis: "1. Bíblia e homilética", family: "quality" },

  // Eixo 2 — Ortodoxia
  { field: "theologyProperScore", label: "Deus / Teontologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "trinityScore", label: "Trindade", axis: "2. Ortodoxia", family: "presence" },
  { field: "christologyScore", label: "Cristologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "crucicentrismScore", label: "Cruz / Crucicentrismo", axis: "2. Ortodoxia", family: "presence" },
  { field: "soteriologyScore", label: "Salvação / Soteriologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "pneumatologyScore", label: "Espírito Santo / Pneumatologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "bibliologyScore", label: "Escrituras / Bibliologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "ecclesiologyScore", label: "Igreja / Eclesiologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "hamartiologyScore", label: "Pecado / Hamartiologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "anthropologyScore", label: "Antropologia teológica", axis: "2. Ortodoxia", family: "presence" },
  { field: "kingdomTheologyScore", label: "Reino de Deus", axis: "2. Ortodoxia", family: "presence" },
  { field: "eschatologyScore", label: "Escatologia", axis: "2. Ortodoxia", family: "presence" },
  { field: "sanctificationScore", label: "Santificação", axis: "2. Ortodoxia", family: "presence" },
  { field: "orthodoxyScore", label: "Ortodoxia (agregado do eixo)", axis: "2. Ortodoxia", family: "aggregate" },

  // Eixo 3 — Ortopraxia (prática ESTRUTURADA, não exortação genérica)
  { field: "serviceDiaconiaScore", label: "Serviço / Diaconia", axis: "3. Ortopraxia", family: "presence" },
  { field: "generosityScore", label: "Generosidade", axis: "3. Ortopraxia", family: "presence" },
  { field: "missionEvangelismScore", label: "Missão / Evangelismo", axis: "3. Ortopraxia", family: "presence" },
  { field: "discipleshipScore", label: "Discipulado", axis: "3. Ortopraxia", family: "presence" },
  { field: "communityMutualityScore", label: "Comunhão / Mutualidade", axis: "3. Ortopraxia", family: "presence" },
  { field: "hospitalityScore", label: "Hospitalidade", axis: "3. Ortopraxia", family: "presence" },
  { field: "careForPoorScore", label: "Cuidado dos pobres", axis: "3. Ortopraxia", family: "presence" },
  { field: "forgivenessReconciliationScore", label: "Perdão e reconciliação", axis: "3. Ortopraxia", family: "presence" },
  { field: "vocationWorkScore", label: "Vocação e trabalho", axis: "3. Ortopraxia", family: "presence" },
  { field: "familyRelationshipsScore", label: "Família e relacionamentos", axis: "3. Ortopraxia", family: "presence" },
  { field: "financeStewardshipScore", label: "Finanças e mordomia", axis: "3. Ortopraxia", family: "presence" },
  { field: "orthopraxyScore", label: "Ortopraxia (agregado do eixo)", axis: "3. Ortopraxia", family: "aggregate" },

  // Eixo 4 — Espiritualidade
  { field: "prayerScore", label: "Oração", axis: "4. Espiritualidade", family: "presence" },
  { field: "scriptureDevotionScore", label: "Leitura bíblica pessoal", axis: "4. Espiritualidade", family: "presence" },
  { field: "fastingScore", label: "Jejum", axis: "4. Espiritualidade", family: "presence" },
  { field: "worshipScore", label: "Adoração", axis: "4. Espiritualidade", family: "presence" },
  { field: "repentanceScore", label: "Arrependimento", axis: "4. Espiritualidade", family: "presence" },
  { field: "discernmentScore", label: "Discernimento", axis: "4. Espiritualidade", family: "presence" },
  { field: "spiritualDisciplinesScore", label: "Disciplinas espirituais (método)", axis: "4. Espiritualidade", family: "applicability" },
  { field: "spiritualityScore", label: "Espiritualidade (agregado do eixo)", axis: "4. Espiritualidade", family: "aggregate" },

  // Eixo 8 — Saúde pastoral
  { field: "healingWoundedScore", label: "Acolhimento dos feridos", axis: "8. Saúde pastoral", family: "presence" },
  { field: "religiousDeconstructionScore", label: "Desconstrução religiosa (crítica a abusos)", axis: "8. Saúde pastoral", family: "presence" },
  { field: "discipleshipReconstructionScore", label: "Reconstrução discipular", axis: "8. Saúde pastoral", family: "presence" },
  { field: "practicalActivationScore", label: "Ativação prática (chamado concreto)", axis: "8. Saúde pastoral", family: "applicability" },
  { field: "sendingHealedScore", label: "Envio dos curados", axis: "8. Saúde pastoral", family: "presence" },
  { field: "coresponsibilityScore", label: "Corresponsabilidade comunitária", axis: "8. Saúde pastoral", family: "presence" },
  { field: "passivityRiskScore", label: "Risco de passividade", axis: "8. Saúde pastoral", family: "risk" },
  { field: "cynicismElitismRiskScore", label: "Risco de cinismo/elitismo teológico", axis: "8. Saúde pastoral", family: "risk" },
  { field: "pastoralHealthScore", label: "Saúde pastoral (agregado do eixo)", axis: "8. Saúde pastoral", family: "aggregate" },

  // Eixo transversal
  { field: "practicalMethodScore", label: "Método prático (há passo aplicável?)", axis: "Transversal: ser × fazer", family: "applicability" },

  // Crítica religiosa contextual (BLUEPRINT v2 §12) — eixo pastoral
  { field: "contextualCritiqueIntensityScore", label: "Intensidade da crítica religiosa (contextual)", axis: "8. Saúde pastoral", family: "presence" },
  { field: "biblicalGroundingOfCritiqueScore", label: "Fundamentação bíblica da crítica", axis: "8. Saúde pastoral", family: "quality" },
  { field: "reconstructionAfterCritiqueScore", label: "Reconstrução após a crítica", axis: "8. Saúde pastoral", family: "presence" },
  { field: "activationAfterCritiqueScore", label: "Ativação prática após a crítica", axis: "8. Saúde pastoral", family: "applicability" },
  { field: "politicalIdolatryCritiqueScore", label: "Crítica à idolatria política", axis: "8. Saúde pastoral", family: "presence" },

  // Diaconia orgânica × ação institucional (BLUEPRINT v2 §12.5) — eixo ortopraxia
  { field: "organicDiaconiaScore", label: "Diaconia orgânica (serviço cotidiano)", axis: "3. Ortopraxia", family: "presence" },
  { field: "institutionalActionScore", label: "Ação institucional estruturada", axis: "3. Ortopraxia", family: "applicability" },
];

export const SCORE_FIELD_NAMES = SCORE_FIELDS.map((f) => f.field);

// Campos de QUALIDADE derivados da Etapa B (interpretação) do pipeline
// multi-etapas — NÃO entram no prompt formativo (o modelo não os pontua de
// novo): são mapeados dos JSONs da interpretação e persistidos em SermonScores.
// Fora de SCORE_FIELDS para não vazar no prompt/validação do fluxo v1.
export const INTERPRETATION_QUALITY_FIELDS: {
  field: string;
  label: string;
  axis: string;
  family: ScoreFamily;
  source: string; // caminho no JSON da Etapa B
}[] = [
  { field: "hermeneuticalFidelityScore", label: "Fidelidade hermenêutica (alinhamento texto-sermão)", axis: "1. Bíblia e homilética", family: "quality", source: "hermeneutics.textSermonAlignment.score" },
  { field: "textApplicationIntegrationScore", label: "Ponte texto→aplicação atual", axis: "1. Bíblia e homilética", family: "quality", source: "hermeneutics.originalMeaningToCurrentApplication.bridgeQualityScore" },
  { field: "argumentativeCoherenceScore", label: "Coerência argumentativa", axis: "Homilética (Etapa B)", family: "quality", source: "argumentation.argumentativeCoherenceScore" },
  { field: "dynamicUnityScore", label: "Unidade dinâmica", axis: "Homilética (Etapa B)", family: "quality", source: "homiletics.dynamicUnity.score" },
  { field: "progressionScore", label: "Progressão", axis: "Homilética (Etapa B)", family: "quality", source: "homiletics.progression.score" },
  { field: "transitionsScore", label: "Transições", axis: "Homilética (Etapa B)", family: "quality", source: "homiletics.transitions.score" },
  { field: "closureScore", label: "Fechamento", axis: "Homilética (Etapa B)", family: "quality", source: "homiletics.closure.score" },
];

// Campos AGREGADOS de eixo: sínteses (roll-up) do eixo, não categorias específicas.
// A evidência literal vive nas categorias do eixo; o agregado é fundamentado quando
// alguma categoria do MESMO eixo tem evidência (não exige citação própria). Ver
// validateBusinessRules e o prompt.
export const AGGREGATE_SCORE_FIELDS = new Set<string>([
  "biblicalHealthScore",
  "orthodoxyScore",
  "orthopraxyScore",
  "spiritualityScore",
  "pastoralHealthScore",
]);

const AXIS_OF = new Map(SCORE_FIELDS.map((f) => [f.field, f.axis]));

// Campos (não-agregados) que pertencem ao mesmo eixo de um dado campo agregado.
export function axisComponentFields(aggregateField: string): string[] {
  const axis = AXIS_OF.get(aggregateField);
  if (!axis) return [];
  return SCORE_FIELDS.filter(
    (f) => f.axis === axis && f.field !== aggregateField && !AGGREGATE_SCORE_FIELDS.has(f.field)
  ).map((f) => f.field);
}

export const SERMON_TYPES = [
  "expositiva_sequencial",
  "expositiva_isolada",
  "tematica_biblica",
  "doutrinaria",
  "pastoral_devocional",
  "profetica_confrontativa",
  "evangelistica",
  "institucional_eclesiologica",
  "testemunhal",
  "motivacional_terapeutica",
  "hibrida",
] as const;

export const ONTOLOGICAL_VALUES = [
  "ontologico",
  "equilibrado",
  "pragmatico",
  "nao_identificavel",
] as const;

// Campos categóricos contextuais (BLUEPRINT v2 §12)
export const APPLICATION_MODES = [
  "identity_being",
  "generic_exhortation",
  "concrete_practice",
  "structured_method",
  "balanced",
  "not_identifiable",
] as const;

export const DISCOURSE_MODES = [
  "expository",
  "doctrinal",
  "pastoral",
  "therapeutic",
  "prophetic",
  "apologetic",
  "systemic_critique",
  "reconstructive_formative",
  "devotional",
  "mixed",
] as const;

export const CRITIQUE_SHARE = ["none", "low", "moderate", "high", "dominant"] as const;

export const CRITIC_TARGETS = [
  "abuso_religioso", "legalismo", "moralismo", "mercado_gospel", "barganha_financeira",
  "lideranca_abusiva", "institucionalismo", "clericalismo", "ativismo_religioso",
  "politica_religiosa", "idolatria_politica",
  // Categorias empiricamente relevantes (observadas em codificações reais)
  "hipocrisia_religiosa", "triunfalismo", "performatividade_religiosa",
  "sectarismo", "espiritualizacao_abusiva",
  "outro", "nao_identificavel",
] as const;

export const CRITIC_TONES = [
  "pastoral", "profetico", "terapeutico", "ironico", "combativo", "academico",
  "desmobilizador", "misto", "nao_identificavel",
] as const;

export const CRITIQUE_HEALTH = [
  "healthy", "potentially_demobilizing", "mixed", "not_identifiable",
] as const;

export const POLITICAL_TARGETS = [
  "partidarismo_religioso", "messianismo_politico", "nacionalismo_religioso",
  "teologia_do_poder", "confusao_igreja_estado", "idolatria_de_lider_politico",
  "uso_eleitoral_da_fe", "outro", "nao_identificavel",
] as const;

export const SENSITIVITY_LEVELS = ["baixa", "media", "alta"] as const;

// Mapeia applicationMode → ontologicalVsPragmatic (compat. retroativa da UI antiga)
export function applicationModeToOntological(mode: string | null | undefined): string {
  switch (mode) {
    case "identity_being":
    case "generic_exhortation":
      return "ontologico";
    case "concrete_practice":
    case "structured_method":
      return "pragmatico";
    case "balanced":
      return "equilibrado";
    default:
      return "nao_identificavel";
  }
}

// Campos de score que exigem evidência a partir de um limiar mais baixo (riscos, §16.1)
export const RISK_EVIDENCE_THRESHOLDS: Record<string, number> = {
  contextualCritiqueIntensityScore: 4,
  passivityRiskScore: 3,
  cynicismElitismRiskScore: 3,
  politicalIdolatryCritiqueScore: 3,
  reconstructionAfterCritiqueScore: 3,
  institutionalActionScore: 3,
};
