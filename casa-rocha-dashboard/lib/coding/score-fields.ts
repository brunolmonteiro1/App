// Catálogo canônico dos campos de score 0–5 (CODEBOOK.md §4/§4b).
// Fonte única para: prompt da IA, validação Zod, gravação no banco e UI de revisão.

export interface ScoreFieldDef {
  field: string; // nome da coluna em SermonScores
  label: string; // rótulo pt-BR mostrado à IA e na UI
  axis: string; // eixo do CODEBOOK
}

export const SCORE_FIELDS: ScoreFieldDef[] = [
  // Eixo 1 — Saúde bíblica e homilética
  { field: "biblicalHealthScore", label: "Saúde bíblica geral", axis: "1. Bíblia e homilética" },
  { field: "homileticExpositionScore", label: "Exposição do texto no contexto (vs uso ilustrativo)", axis: "1. Bíblia e homilética" },
  { field: "christocentricReadingScore", label: "Leitura cristocêntrica", axis: "1. Bíblia e homilética" },
  { field: "biblicalApplicationScore", label: "Aplicação bíblica", axis: "1. Bíblia e homilética" },

  // Eixo 2 — Ortodoxia
  { field: "theologyProperScore", label: "Deus / Teontologia", axis: "2. Ortodoxia" },
  { field: "trinityScore", label: "Trindade", axis: "2. Ortodoxia" },
  { field: "christologyScore", label: "Cristologia", axis: "2. Ortodoxia" },
  { field: "crucicentrismScore", label: "Cruz / Crucicentrismo", axis: "2. Ortodoxia" },
  { field: "soteriologyScore", label: "Salvação / Soteriologia", axis: "2. Ortodoxia" },
  { field: "pneumatologyScore", label: "Espírito Santo / Pneumatologia", axis: "2. Ortodoxia" },
  { field: "bibliologyScore", label: "Escrituras / Bibliologia", axis: "2. Ortodoxia" },
  { field: "ecclesiologyScore", label: "Igreja / Eclesiologia", axis: "2. Ortodoxia" },
  { field: "hamartiologyScore", label: "Pecado / Hamartiologia", axis: "2. Ortodoxia" },
  { field: "anthropologyScore", label: "Antropologia teológica", axis: "2. Ortodoxia" },
  { field: "kingdomTheologyScore", label: "Reino de Deus", axis: "2. Ortodoxia" },
  { field: "eschatologyScore", label: "Escatologia", axis: "2. Ortodoxia" },
  { field: "sanctificationScore", label: "Santificação", axis: "2. Ortodoxia" },
  { field: "orthodoxyScore", label: "Ortodoxia (agregado do eixo)", axis: "2. Ortodoxia" },

  // Eixo 3 — Ortopraxia (prática ESTRUTURADA, não exortação genérica)
  { field: "serviceDiaconiaScore", label: "Serviço / Diaconia", axis: "3. Ortopraxia" },
  { field: "generosityScore", label: "Generosidade", axis: "3. Ortopraxia" },
  { field: "missionEvangelismScore", label: "Missão / Evangelismo", axis: "3. Ortopraxia" },
  { field: "discipleshipScore", label: "Discipulado", axis: "3. Ortopraxia" },
  { field: "communityMutualityScore", label: "Comunhão / Mutualidade", axis: "3. Ortopraxia" },
  { field: "hospitalityScore", label: "Hospitalidade", axis: "3. Ortopraxia" },
  { field: "careForPoorScore", label: "Cuidado dos pobres", axis: "3. Ortopraxia" },
  { field: "forgivenessReconciliationScore", label: "Perdão e reconciliação", axis: "3. Ortopraxia" },
  { field: "vocationWorkScore", label: "Vocação e trabalho", axis: "3. Ortopraxia" },
  { field: "familyRelationshipsScore", label: "Família e relacionamentos", axis: "3. Ortopraxia" },
  { field: "financeStewardshipScore", label: "Finanças e mordomia", axis: "3. Ortopraxia" },
  { field: "orthopraxyScore", label: "Ortopraxia (agregado do eixo)", axis: "3. Ortopraxia" },

  // Eixo 4 — Espiritualidade
  { field: "prayerScore", label: "Oração", axis: "4. Espiritualidade" },
  { field: "scriptureDevotionScore", label: "Leitura bíblica pessoal", axis: "4. Espiritualidade" },
  { field: "fastingScore", label: "Jejum", axis: "4. Espiritualidade" },
  { field: "worshipScore", label: "Adoração", axis: "4. Espiritualidade" },
  { field: "repentanceScore", label: "Arrependimento", axis: "4. Espiritualidade" },
  { field: "discernmentScore", label: "Discernimento", axis: "4. Espiritualidade" },
  { field: "spiritualDisciplinesScore", label: "Disciplinas espirituais (método)", axis: "4. Espiritualidade" },
  { field: "spiritualityScore", label: "Espiritualidade (agregado do eixo)", axis: "4. Espiritualidade" },

  // Eixo 8 — Saúde pastoral
  { field: "healingWoundedScore", label: "Acolhimento dos feridos", axis: "8. Saúde pastoral" },
  { field: "religiousDeconstructionScore", label: "Desconstrução religiosa (crítica a abusos)", axis: "8. Saúde pastoral" },
  { field: "discipleshipReconstructionScore", label: "Reconstrução discipular", axis: "8. Saúde pastoral" },
  { field: "practicalActivationScore", label: "Ativação prática (chamado concreto)", axis: "8. Saúde pastoral" },
  { field: "sendingHealedScore", label: "Envio dos curados", axis: "8. Saúde pastoral" },
  { field: "coresponsibilityScore", label: "Corresponsabilidade comunitária", axis: "8. Saúde pastoral" },
  { field: "passivityRiskScore", label: "Risco de passividade", axis: "8. Saúde pastoral" },
  { field: "cynicismElitismRiskScore", label: "Risco de cinismo/elitismo teológico", axis: "8. Saúde pastoral" },
  { field: "pastoralHealthScore", label: "Saúde pastoral (agregado do eixo)", axis: "8. Saúde pastoral" },

  // Eixo transversal
  { field: "practicalMethodScore", label: "Método prático (há passo aplicável?)", axis: "Transversal: ser × fazer" },

  // Crítica religiosa contextual (BLUEPRINT v2 §12) — eixo pastoral
  { field: "contextualCritiqueIntensityScore", label: "Intensidade da crítica religiosa (contextual)", axis: "8. Saúde pastoral" },
  { field: "biblicalGroundingOfCritiqueScore", label: "Fundamentação bíblica da crítica", axis: "8. Saúde pastoral" },
  { field: "reconstructionAfterCritiqueScore", label: "Reconstrução após a crítica", axis: "8. Saúde pastoral" },
  { field: "activationAfterCritiqueScore", label: "Ativação prática após a crítica", axis: "8. Saúde pastoral" },
  { field: "politicalIdolatryCritiqueScore", label: "Crítica à idolatria política", axis: "8. Saúde pastoral" },

  // Diaconia orgânica × ação institucional (BLUEPRINT v2 §12.5) — eixo ortopraxia
  { field: "organicDiaconiaScore", label: "Diaconia orgânica (serviço cotidiano)", axis: "3. Ortopraxia" },
  { field: "institutionalActionScore", label: "Ação institucional estruturada", axis: "3. Ortopraxia" },
];

export const SCORE_FIELD_NAMES = SCORE_FIELDS.map((f) => f.field);

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
