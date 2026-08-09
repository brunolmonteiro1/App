// Presets de modelos OpenRouter (BLUEPRINT v2 §21.4).
// ATENÇÃO: esta lista é FALLBACK — disponibilidade e preços mudam com frequência.
// A fonte de verdade é a API do OpenRouter (/models); estes presets só entram
// quando a API falha ou não há chave, e servem para enriquecer os modelos vindos
// da API com nome amigável, provedor, tags e recomendação por função.

export type ModelProvider =
  | "Anthropic"
  | "OpenAI"
  | "Google"
  | "DeepSeek"
  | "Meta/Llama"
  | "Mistral"
  | "Qwen"
  | "Outros";

export const PROVIDER_ORDER: ModelProvider[] = [
  "Anthropic",
  "OpenAI",
  "Google",
  "DeepSeek",
  "Meta/Llama",
  "Mistral",
  "Qwen",
  "Outros",
];

export type ModelTag =
  | "melhor_qualidade"
  | "economico"
  | "rapido"
  | "contexto_longo"
  | "experimental"
  | "recomendado_para_codificacao"
  | "recomendado_para_reparo"
  | "recomendado_para_relatorio";

// Rótulos humanos das tags (a UI mostra estes; o valor bruto fica no dado).
export const TAG_LABELS: Record<ModelTag, string> = {
  melhor_qualidade: "melhor qualidade",
  economico: "econômico",
  rapido: "rápido",
  contexto_longo: "contexto longo",
  experimental: "experimental",
  recomendado_para_codificacao: "recomendado p/ codificação",
  recomendado_para_reparo: "recomendado p/ reparo",
  recomendado_para_relatorio: "recomendado p/ relatório",
};

// Funções que escolhem modelo separadamente (BLUEPRINT v2 §21.5).
export type ModelFunction = "coding" | "repair" | "audit" | "report" | "master";

export const FUNCTION_LABELS: Record<ModelFunction, string> = {
  coding: "codificação",
  repair: "reparo de evidência",
  audit: "auditoria por IA",
  report: "relatório público",
  master: "relatório master",
};

// Chave de AppSetting por função (persistência server-side da preferência).
export function functionSettingKey(fn: ModelFunction): string {
  return fn === "coding" ? "coding_model" : `${fn}_model`;
}

export const TAG_FOR_FUNCTION: Record<ModelFunction, ModelTag | null> = {
  coding: "recomendado_para_codificacao",
  repair: "recomendado_para_reparo",
  audit: "recomendado_para_codificacao",
  report: "recomendado_para_relatorio",
  master: "recomendado_para_relatorio",
};

export interface ModelPreset {
  id: string;
  name: string;
  provider: ModelProvider;
  promptPrice: number | null; // USD por 1M tokens (indicativo)
  completionPrice: number | null;
  contextLength: number | null;
  tags: ModelTag[];
  recommended?: boolean;
}

// Lista curada de fallback. Não é verdade permanente — apenas um ponto de partida
// quando a API do OpenRouter não responde.
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    promptPrice: 3,
    completionPrice: 15,
    contextLength: 200_000,
    tags: ["melhor_qualidade", "contexto_longo", "recomendado_para_codificacao", "recomendado_para_relatorio"],
    recommended: true,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    promptPrice: 0.8,
    completionPrice: 4,
    contextLength: 200_000,
    tags: ["economico", "rapido", "recomendado_para_reparo"],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    promptPrice: 2.5,
    completionPrice: 10,
    contextLength: 128_000,
    tags: ["melhor_qualidade", "recomendado_para_codificacao"],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    promptPrice: 0.15,
    completionPrice: 0.6,
    contextLength: 128_000,
    tags: ["economico", "rapido", "recomendado_para_reparo"],
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    promptPrice: 1.25,
    completionPrice: 10,
    contextLength: 1_000_000,
    tags: ["melhor_qualidade", "contexto_longo", "recomendado_para_relatorio"],
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    promptPrice: 0.3,
    completionPrice: 2.5,
    contextLength: 1_000_000,
    tags: ["economico", "rapido", "contexto_longo"],
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    promptPrice: 0.27,
    completionPrice: 1.1,
    contextLength: 64_000,
    tags: ["economico", "recomendado_para_reparo"],
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta/Llama",
    promptPrice: 0.12,
    completionPrice: 0.3,
    contextLength: 128_000,
    tags: ["economico"],
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    promptPrice: 2,
    completionPrice: 6,
    contextLength: 128_000,
    tags: [],
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "Qwen",
    promptPrice: 0.23,
    completionPrice: 0.4,
    contextLength: 32_000,
    tags: ["economico"],
  },
];

// Deriva o provedor a partir do prefixo do id OpenRouter (ex.: "anthropic/...").
export function providerOf(id: string): ModelProvider {
  const p = id.split("/")[0]?.toLowerCase() ?? "";
  if (p === "anthropic") return "Anthropic";
  if (p === "openai") return "OpenAI";
  if (p === "google") return "Google";
  if (p === "deepseek") return "DeepSeek";
  if (p === "meta-llama" || p === "meta" || p.includes("llama")) return "Meta/Llama";
  if (p === "mistralai" || p === "mistral") return "Mistral";
  if (p === "qwen") return "Qwen";
  return "Outros";
}

const PRESET_BY_ID = new Map(MODEL_PRESETS.map((p) => [p.id, p]));
export function presetFor(id: string): ModelPreset | undefined {
  return PRESET_BY_ID.get(id);
}
