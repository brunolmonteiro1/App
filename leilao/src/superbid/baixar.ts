/**
 * Download dos manifestos (PDF de anexo) dos lotes.
 *
 * Cuidado deliberado com a taxa de requisições: o operador é licitante legítimo, e scraper
 * agressivo é a forma mais rápida de tomar bloqueio justamente no dia em que o pregão abre.
 * São 57 arquivos pequenos, não há pressa nenhuma.
 *
 * O cache é por lote, e rodar de novo não rebaixa nada — permite chamar antes de cada estudo
 * sem custo.
 */

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Lote } from './api.ts';
import { refDoTitulo } from '../analise/quantidade.ts';

/** ~1,5 req/s. Suficientemente lento para não incomodar, rápido o bastante para 57 PDFs. */
const INTERVALO_MS = 650;

export interface ResultadoDownload {
  baixados: number;
  emCache: number;
  semAnexo: number[];
  falhas: { lote: number; motivo: string }[];
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Nome do arquivo: número do lote na frente para o lookup ser trivial, e a referência SB
 * junto para que um PDF trocado de lugar seja visível a olho no diretório.
 */
export function nomeArquivo(lote: Lote): string {
  const ref = refDoTitulo(lote.titulo) ?? 'sem-ref';
  return `${String(lote.numero).padStart(4, '0')}-${ref}.pdf`;
}

/** Índice lotNumber → caminho, a partir do que já está em cache. */
export async function indexarCache(dir: string): Promise<Map<number, string>> {
  const mapa = new Map<number, string>();
  let nomes: string[];
  try {
    nomes = await readdir(dir);
  } catch {
    return mapa; // diretório ainda não existe: cache vazio
  }
  for (const nome of nomes) {
    const m = /^(\d+)-/.exec(nome);
    if (m && nome.endsWith('.pdf')) mapa.set(Number(m[1]), join(dir, nome));
  }
  return mapa;
}

export async function baixarManifestos(
  lotes: Lote[],
  dir: string,
  aoProgredir?: (msg: string) => void,
): Promise<ResultadoDownload> {
  await mkdir(dir, { recursive: true });
  const res: ResultadoDownload = { baixados: 0, emCache: 0, semAnexo: [], falhas: [] };

  for (const lote of lotes) {
    const url = lote.anexos[0];
    if (!url) {
      res.semAnexo.push(lote.numero);
      continue;
    }

    const destino = join(dir, nomeArquivo(lote));
    // Arquivo vazio conta como ausente: um download interrompido não deve virar cache
    // permanente de nada.
    try {
      const st = await stat(destino);
      if (st.size > 0) {
        res.emCache++;
        continue;
      }
    } catch {
      // não existe, segue e baixa
    }

    try {
      const resp = await fetch(url, { headers: { accept: 'application/pdf,*/*' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = new Uint8Array(await resp.arrayBuffer());
      if (buf.length === 0) throw new Error('resposta vazia');
      await writeFile(destino, buf);
      res.baixados++;
      aoProgredir?.(`lote ${lote.numero}: ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      // Um PDF que falha não pode derrubar os outros 56 — o lote entra no estudo com alerta.
      res.falhas.push({ lote: lote.numero, motivo: (e as Error).message });
      aoProgredir?.(`lote ${lote.numero}: FALHOU (${(e as Error).message})`);
    }

    await dormir(INTERVALO_MS);
  }

  return res;
}
