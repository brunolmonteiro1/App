// Configuração VERSIONADA das tensões do Modo Diagnóstico Interno (BLUEPRINT v2
// §33.2). Nada de interpretação hardcoded em componente: cada tensão declara
// campos, limiares, mínimos e o texto técnico da leitura interna. Alterou a régua?
// suba TENSIONS_CONFIG_VERSION.

export const TENSIONS_CONFIG_VERSION = "tensions-v1";

// Um "lado" da tensão pode ser um campo único ou a média de vários campos.
export interface TensionSide {
  label: string;
  fields: string[]; // média simples quando > 1
}

export interface TensionDef {
  id: string;
  title: string;
  high: TensionSide; // lado que se espera ALTO
  low: TensionSide; // lado que se espera BAIXO
  highThreshold: number; // média do lado alto ≥ isto
  lowThreshold: number; // média do lado baixo ≤ isto
  minRecords: number; // n mínimo em cada lado
  formula: string;
  internalReading: string; // leitura interna (linguagem, não número)
  suggestedAction: string;
}

export const TENSION_DEFS: TensionDef[] = [
  {
    id: "corpo_vs_estrutura",
    title: "Corpo elevado, estrutura baixa",
    high: { label: "Comunidade / eclesiologia", fields: ["communityMutualityScore", "ecclesiologyScore"] },
    low: { label: "Ação institucional", fields: ["institutionalActionScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "média(communityMutualityScore, ecclesiologyScore) alto E institutionalActionScore baixo",
    internalReading:
      "Alta eclesiologia de corpo, mas baixa explicitação de caminhos institucionais de engajamento.",
    suggestedAction:
      "Verificar se há trilhas concretas (datas, papéis, próximos passos) que convertam pertencimento em serviço.",
  },
  {
    id: "critica_vs_reconstrucao",
    title: "Crítica elevada, reconstrução baixa",
    high: { label: "Crítica contextual", fields: ["contextualCritiqueIntensityScore"] },
    low: { label: "Reconstrução após crítica", fields: ["reconstructionAfterCritiqueScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "contextualCritiqueIntensityScore alto E reconstructionAfterCritiqueScore baixo",
    internalReading:
      "Há risco de formar críticos sofisticados do sistema religioso, mas pouco reconstruídos em identidade e prática.",
    suggestedAction:
      "Observar se a crítica é seguida de proposta afirmativa e caminho de reconstrução no mesmo corpus.",
  },
  {
    id: "diaconia_organica_vs_institucional",
    title: "Diaconia orgânica elevada, ação estruturada baixa",
    high: { label: "Diaconia orgânica", fields: ["organicDiaconiaScore"] },
    low: { label: "Ação institucional", fields: ["institutionalActionScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "organicDiaconiaScore alto E institutionalActionScore baixo",
    internalReading:
      "O cuidado espontâneo aparece mais forte do que a ação diaconal estruturada (o gap '1.500 no domingo, 50 nas ações').",
    suggestedAction:
      "Cruzar com o gap diaconal do dashboard pastoral; hipótese a validar com dados de engajamento fora do corpus.",
  },
  {
    id: "ortodoxia_vs_cotidiano",
    title: "Ortodoxia elevada, vida cotidiana baixa",
    high: { label: "Ortodoxia", fields: ["orthodoxyScore"] },
    low: { label: "Vida cotidiana (família/trabalho/finanças)", fields: ["familyRelationshipsScore", "vocationWorkScore", "financeStewardshipScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "orthodoxyScore alto E média(família, trabalho, finanças) baixo",
    internalReading:
      "Alta consciência teológica com menor tradução para a vida cotidiana estruturada.",
    suggestedAction:
      "Hipótese de trilha complementar em aplicação cotidiana — nunca leitura de que 'o púlpito falha'.",
  },
  {
    id: "cura_vs_envio",
    title: "Cura elevada, envio baixo",
    high: { label: "Acolhimento/cura dos feridos", fields: ["healingWoundedScore"] },
    low: { label: "Envio dos curados", fields: ["sendingHealedScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "healingWoundedScore alto E sendingHealedScore baixo",
    internalReading:
      "A cura dos feridos aparece mais forte do que o envio dos curados.",
    suggestedAction:
      "Observar se o funil de maturidade prossegue de acolhimento até corresponsabilidade e missão.",
  },
  {
    id: "critica_politica_vs_ativacao",
    title: "Crítica política elevada, ativação pública baixa",
    high: { label: "Crítica à idolatria política", fields: ["politicalIdolatryCritiqueScore"] },
    low: { label: "Ativação prática", fields: ["practicalActivationScore"] },
    highThreshold: 3.5,
    lowThreshold: 2.5,
    minRecords: 5,
    formula: "politicalIdolatryCritiqueScore alto E practicalActivationScore baixo",
    internalReading:
      "Crítica à idolatria política sem ativação pública/prática correspondente no corpus.",
    suggestedAction:
      "Hipótese a validar; não inferir intenção nem posição partidária a partir do sinal.",
  },
];
