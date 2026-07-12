// Cliente OpenRouter (https://openrouter.ai/docs). Chave via env OPENROUTER_API_KEY.
// OPENROUTER_BASE_URL é sobrescrevível para testes com stub local.

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export interface ChatResult {
  content: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export async function chatCompletion(opts: {
  model: string;
  system: string;
  user: string;
  timeoutMs?: number;
}): Promise<ChatResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY não configurada no ambiente");

  const body = {
    model: opts.model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 300_000);
    try {
      return await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/brunolmonteiro1/App",
          "X-Title": "Casa da Rocha - Dashboard de Saude Teologica",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(t);
    }
  };

  let res = await attempt();
  if (res.status === 429 || res.status >= 500) {
    await new Promise((r) => setTimeout(r, 3000));
    res = await attempt();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Resposta sem conteúdo: ${JSON.stringify(json).slice(0, 300)}`);
  return { content, model: json.model ?? opts.model, usage: json.usage };
}

// Extrai o objeto JSON da resposta, tolerando cercas ```json e texto ao redor.
export function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("Resposta não contém JSON");
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

import {
  MODEL_PRESETS,
  presetFor,
  providerOf,
  type ModelProvider,
  type ModelTag,
} from "./model-presets";

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  promptPrice: number | null; // USD por 1M tokens
  completionPrice: number | null;
  contextLength: number | null;
  tags: ModelTag[];
  recommended: boolean;
}

// Enriquece um modelo cru (id + preços) com provedor, tags e recomendação vindos
// dos presets. Preços/contexto reais da API têm precedência; presets preenchem lacunas.
function enrich(raw: {
  id: string;
  name?: string;
  promptPrice: number | null;
  completionPrice: number | null;
  contextLength: number | null;
}): ModelInfo {
  const preset = presetFor(raw.id);
  return {
    id: raw.id,
    name: raw.name ?? preset?.name ?? raw.id,
    provider: providerOf(raw.id),
    promptPrice: raw.promptPrice ?? preset?.promptPrice ?? null,
    completionPrice: raw.completionPrice ?? preset?.completionPrice ?? null,
    contextLength: raw.contextLength ?? preset?.contextLength ?? null,
    tags: preset?.tags ?? [],
    recommended: preset?.recommended ?? false,
  };
}

const PRESET_MODELS: ModelInfo[] = MODEL_PRESETS.map((p) =>
  enrich({
    id: p.id,
    name: p.name,
    promptPrice: p.promptPrice,
    completionPrice: p.completionPrice,
    contextLength: p.contextLength,
  })
);

export interface ModelCatalog {
  models: ModelInfo[];
  source: "openrouter" | "fallback";
  fetchedAt: string;
  error?: string;
}

const CACHE_TTL_MS = Number(process.env.OPENROUTER_MODELS_TTL_MS ?? 60 * 60 * 1000);
let catalogCache: { at: number; catalog: ModelCatalog } | null = null;

export async function listCatalog(): Promise<ModelCatalog> {
  if (catalogCache && Date.now() - catalogCache.at < CACHE_TTL_MS) return catalogCache.catalog;

  let catalog: ModelCatalog;
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: process.env.OPENROUTER_API_KEY
        ? { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
        : {},
    });
    if (!res.ok) throw new Error(`OpenRouter /models ${res.status}`);
    const json = await res.json();
    const models: ModelInfo[] = (json?.data ?? [])
      .map((m: { id: string; name?: string; pricing?: { prompt?: string; completion?: string }; context_length?: number }) =>
        enrich({
          id: m.id,
          name: m.name,
          promptPrice: m.pricing?.prompt ? Number(m.pricing.prompt) * 1_000_000 : null,
          completionPrice: m.pricing?.completion ? Number(m.pricing.completion) * 1_000_000 : null,
          contextLength: m.context_length ?? null,
        })
      )
      .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
    if (models.length === 0) throw new Error("OpenRouter /models retornou lista vazia");
    catalog = { models, source: "openrouter", fetchedAt: new Date().toISOString() };
  } catch (e) {
    // Fallback local: presets curados (§21.4). Disponibilidade/preços podem ter mudado.
    catalog = {
      models: PRESET_MODELS,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : String(e),
    };
  }
  catalogCache = { at: Date.now(), catalog };
  return catalog;
}

// Mantido por compatibilidade: só a lista de modelos.
export async function listModels(): Promise<ModelInfo[]> {
  return (await listCatalog()).models;
}

// Sugestões exibidas em destaque na UI (o usuário pode digitar qualquer id).
export const SUGGESTED_MODELS = [
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-3.5-haiku",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-chat-v3-0324",
];
