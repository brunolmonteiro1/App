// Preferência de modelo por função, persistida server-side em AppSetting
// (BLUEPRINT v2 §21.5). Cada função (codificação, reparo, auditoria, relatório,
// master) guarda seu próprio último modelo. `coding` mantém a chave legada
// `coding_model` para não quebrar dados existentes.

import { prisma } from "@/lib/db";
import {
  functionSettingKey,
  type ModelFunction,
} from "./model-presets";
import { SUGGESTED_MODELS } from "./openrouter";

export async function getModelPreference(fn: ModelFunction): Promise<string | null> {
  const key = functionSettingKey(fn);
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (row?.value) return row.value;
  // Reparo/auditoria herdam a preferência de codificação quando não definidos.
  if (fn !== "coding") {
    const coding = await prisma.appSetting.findUnique({ where: { key: "coding_model" } });
    if (coding?.value) return coding.value;
  }
  return null;
}

export async function getModelPreferenceOrDefault(fn: ModelFunction): Promise<string> {
  return (await getModelPreference(fn)) ?? SUGGESTED_MODELS[0];
}

export async function setModelPreference(fn: ModelFunction, model: string): Promise<void> {
  const key = functionSettingKey(fn);
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: model },
    update: { value: model },
  });
}
