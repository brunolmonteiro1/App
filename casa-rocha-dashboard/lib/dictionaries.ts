// Dicionários temáticos iniciais (CODEBOOK.md §5, incl. expansão ISC de CRITICAL_SATURATION.md).
// Camada lexical: geram contagem/densidade/snippets — nunca viram score teológico sozinhos.

export interface ThemeDictionary {
  theme: string; // slug do tema
  label: string;
  terms: string[]; // termos/expressões (case/acento-insensível; casam variações morfológicas simples)
}

export const DICTIONARIES: ThemeDictionary[] = [
  {
    theme: "cruz_soteriologia",
    label: "Cruz / Soteriologia",
    terms: [
      "cruz", "sacrifício", "sangue", "expiação", "graça", "perdão", "perdoa", "salvação",
      "novo nascimento", "morrer para si", "velho homem", "ressurreição", "ressuscit",
      "justificação", "redenção", "reconciliação", "crucific",
    ],
  },
  {
    theme: "cristologia_trindade",
    label: "Cristologia / Trindade",
    terms: [
      "cristo", "jesus", "logos", "verbo", "espírito santo", "trindade", "encarnação",
      "divindade", "senhorio",
    ],
  },
  {
    theme: "critica_ao_sistema",
    label: "Desconstrução religiosa / Crítica ao sistema",
    terms: [
      // base
      "sistema religioso", "legalismo", "legalista", "barganha", "mercado gospel",
      "evangelho de judas", "mamon", "guru", "abuso espiritual", "manipulação",
      "ritual vazio", "fariseu", "farisaísmo", "clericalismo",
      // expansão ISC — diretos
      "mercado da fé", "caça-níquel", "campanha da vitória",
      // expansão ISC — irônicos
      "alquimia", "fórmula mágica", "fórmulas mágicas", "gênio da lâmpada",
      "bater continência", "mandinga", "fábrica de crente", "fábrica de testemunho",
      "recebe a vitória", "toma posse", "tá amarrado",
      // ideologias de poder
      "idolatria política",
    ],
  },
  {
    theme: "santificacao_maturidade",
    label: "Santificação e maturidade",
    terms: [
      "fruto do espírito", "morte do ego", "arrependimento", "arrepend", "humildade",
      "domínio próprio", "santidade", "santificação", "dependência de deus",
      "nova criatura", "transformação",
    ],
  },
  {
    theme: "servico_diaconia",
    label: "Serviço / Diaconia / Eclesiologia",
    terms: [
      "servir", "servo", "serva", "diaconia", "bacia e toalha", "lavar os pés",
      "dons", "mutualidade", "uns aos outros", "comunidade", "mesa",
      "igreja como corpo", "cuidado mútuo", "comunidade dos arrependidos", "corpo de cristo",
    ],
  },
  {
    theme: "ortopraxia_pratica",
    label: "Ortopraxia prática",
    terms: [
      "voluntariado", "voluntário", "pequeno grupo", "pequenos grupos", "discipulado",
      "discipular", "mentoria", "evangelizar", "oração diária", "ler a bíblia",
      "leitura bíblica", "jejum", "jejuar", "finanças", "dívida", "casamento",
      "filhos", "família", "trabalho", "vocação", "conflito",
    ],
  },
  {
    theme: "espiritualidade",
    label: "Espiritualidade e vida devocional",
    terms: [
      "oração", "orar", "interceder", "intercessão", "meditar", "meditação",
      "adoração", "adorar", "confissão", "confessar", "discernimento",
      "disciplinas espirituais", "devocional",
    ],
  },
  {
    theme: "missao_presenca_publica",
    label: "Missão e presença pública",
    terms: [
      "missão", "missionário", "enviar", "enviados", "testemunho", "próximo",
      "cidade", "pobres", "justiça", "misericórdia", "alcançar", "evangelismo",
    ],
  },
];

// Campos do ISC (CRITICAL_SATURATION.md): crítica ao sistema vs Evangelho (cruz + cristologia)
export const ISC_CRITIC_THEME = "critica_ao_sistema";
export const ISC_GOSPEL_THEMES = ["cruz_soteriologia", "cristologia_trindade"];
export const ISC_MIN_MENTIONS = 5; // denominador mínimo; abaixo, nao_calculavel
export const ISC_DEFAULT_THRESHOLD = 30; // % — configurável via env

// Nome canônico do indicador (BLUEPRINT v2 §3.2): "Sinalizador lexical de crítica religiosa".
export const CRITIQUE_SIGNAL_LABEL = "Sinalizador lexical de crítica religiosa";
export const CRITIQUE_SIGNAL_WARNING =
  "Sinalizador lexical preliminar: identifica vocabulário associado à crítica religiosa, mas não mede intenção, tom, fundamentação bíblica, efeito pastoral ou maturidade da argumentação. Use apenas como ponto de partida para investigação.";

// Limiar: aceita CRITIQUE_LEXICAL_SIGNAL_THRESHOLD (novo) ou ISC_THRESHOLD (compat.).
export function critiqueSignalThreshold(): number {
  return Number(
    process.env.CRITIQUE_LEXICAL_SIGNAL_THRESHOLD ?? process.env.ISC_THRESHOLD ?? ISC_DEFAULT_THRESHOLD
  );
}
