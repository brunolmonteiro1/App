/**
 * Snapshot do evento + manifestos, em JSON, ao lado do estudo.
 *
 * Existe para o **painel poder recalcular teto sem tocar em PDF nem na rede.** A tela de
 * precificação precisa responder "com este preço, qual fica o teto?" a cada campo preenchido;
 * reparsear 57 PDFs de 18 páginas a cada tecla não é opção, e chamar a API do Superbid a cada
 * tecla é a forma mais rápida de tomar bloqueio no dia do pregão.
 *
 * O `gerar` escreve isto uma vez; o painel lê e recalcula quantas vezes quiser. Preço **não**
 * entra aqui — preço vive em `precos.json`, que muda a cada minuto enquanto o operador digita.
 * É a mesma separação dossiê/preço do resto do projeto: o que é estável fica no snapshot, o
 * que é perecível fica fora.
 */

import { readFile, writeFile } from 'node:fs/promises';
import type { Evento } from '../superbid/api.ts';
import type { Manifesto } from '../superbid/manifesto.ts';

export interface Snapshot {
  versao: 1;
  /** Quando o `gerar` rodou. A tela mostra, para o operador saber se está velho. */
  geradoEm: string;
  /** Frete informado naquela execução; `null` quando o custo está incompleto. */
  frete: number | null;
  /** Segundos de auto-refresh usados no estudo, para a regeneração manter o mesmo modo. */
  refresh: number | null;
  /** Nome do HTML do estudo dentro da pasta de saída, para o painel reescrever o certo. */
  arquivoEstudo: string;
  evento: Evento;
  /** Chave é o número do lote em texto (JSON não tem chave numérica). */
  manifestos: Record<string, Manifesto>;
}

export const NOME_SNAPSHOT = 'estado.json';

export async function gravarSnapshot(caminho: string, s: Snapshot): Promise<void> {
  await writeFile(caminho, JSON.stringify(s), 'utf8');
}

export async function lerSnapshot(caminho: string): Promise<Snapshot> {
  const s = JSON.parse(await readFile(caminho, 'utf8')) as Snapshot;
  if (s?.versao !== 1 || !s.evento?.lotes) {
    throw new Error(`${caminho}: não parece um snapshot desta versão — rode \`gerar\` de novo`);
  }
  return s;
}

/** Manifesto de um lote, ou null. Encapsula a conversão de número para chave de texto. */
export function manifestoDo(s: Snapshot, numeroLote: number): Manifesto | null {
  return s.manifestos[String(numeroLote)] ?? null;
}
