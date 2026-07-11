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
];

export const SCORE_FIELD_NAMES = SCORE_FIELDS.map((f) => f.field);

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
