/**
 * Leitura e gravação do arquivo de preços do operador.
 *
 * Dois motivos para isto existir separado de `analise/valor.ts`:
 *
 * 1. **A tela de precificação grava.** O painel deixou de ser só leitura, e escrita em
 *    arquivo que o operador levou horas para preencher exige gravação atômica — grava em
 *    `.tmp` e renomeia. Sem isso, uma queda de energia no meio do `write` deixaria o arquivo
 *    truncado e o trabalho perdido.
 * 2. **Ausência do arquivo não é erro.** Rodar sem preços é o estado inicial legítimo: o
 *    estudo sai todo em `PRECIFIQUE`, que é o comportamento correto. Estourar exceção aí
 *    faria o operador achar que a instalação quebrou.
 *
 * E há uma armadilha específica do Docker que este módulo detecta e explica: quando
 * `./precos.json` não existe no host, o bind mount `./precos.json:/app/precos.json` faz o
 * Docker criar um **diretório** vazio no lugar do arquivo. O `readFile` então falha com
 * `EISDIR`, que não diz nada a ninguém. A mensagem daqui diz exatamente o que fazer.
 */

import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import type { ArquivoPrecos, PrecoItem, TabelaPrecos } from '../analise/valor.ts';

export interface LeituraPrecos {
  arquivo: ArquivoPrecos;
  /** true quando o arquivo ainda não existe — estado inicial, não falha. */
  ausente: boolean;
  /** Mensagem para o operador quando algo merece explicação. */
  aviso: string | null;
}

const VAZIO = (): ArquivoPrecos => ({ itens: {} });

/**
 * Lê o arquivo de preços sem estourar quando ele falta.
 *
 * Distingue três situações que o `readFile` cru embaralha: arquivo ausente (normal),
 * diretório no lugar do arquivo (pegadinha do bind mount) e JSON inválido (erro de fato).
 */
export async function lerPrecos(caminho: string): Promise<LeituraPrecos> {
  let ehDiretorio = false;
  try {
    ehDiretorio = (await stat(caminho)).isDirectory();
  } catch {
    return {
      arquivo: VAZIO(),
      ausente: true,
      aviso:
        `${caminho} não existe — nenhum lote terá teto até você precificar. ` +
        `Crie com: echo '{"itens":{}}' > ${caminho}`,
    };
  }

  if (ehDiretorio) {
    // Acontece exatamente uma vez por instalação, e o erro cru (EISDIR) não ajuda em nada.
    throw new Error(
      `${caminho} é um DIRETÓRIO, não um arquivo. Isso é o Docker: quando o arquivo não ` +
        `existe no host, o bind mount cria um diretório vazio no lugar dele.\n` +
        `  Conserto, na pasta do projeto:  rmdir precos.json && echo '{"itens":{}}' > precos.json`,
    );
  }

  const bruto = await readFile(caminho, 'utf8');
  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch (e) {
    throw new Error(`${caminho}: JSON inválido (${(e as Error).message})`);
  }
  if (!dados || typeof dados !== 'object' || typeof (dados as ArquivoPrecos).itens !== 'object') {
    throw new Error(`${caminho}: esperava { "itens": { ... } }`);
  }
  return { arquivo: dados as ArquivoPrecos, ausente: false, aviso: null };
}

const FAIXAS = new Set(['A', 'B', 'C']);

/** Uma entrada como chega da tela: preço em número, string ou vazio. */
export interface EntradaPreco {
  preco?: number | string | null;
  faixa?: string;
  nota?: string;
}

/**
 * Mescla o que veio da tela sobre a tabela atual.
 *
 * **Mescla, nunca substitui.** A tela manda só o lote aberto; substituir o arquivo pelo
 * corpo do POST apagaria os preços de todos os outros lotes — a forma mais rápida de perder
 * o trabalho acumulado.
 *
 * Preço vazio ou null volta a `null` de propósito: é assim que o operador desfaz um preço
 * digitado errado.
 */
export function mesclar(
  atual: ArquivoPrecos,
  entrada: Record<string, EntradaPreco>,
): { arquivo: ArquivoPrecos; gravados: number; rejeitados: string[] } {
  const itens: TabelaPrecos = { ...atual.itens };
  const rejeitados: string[] = [];
  let gravados = 0;

  for (const [chave, e] of Object.entries(entrada)) {
    if (!chave.trim()) continue;
    const anterior = itens[chave];

    let preco: number | null = null;
    if (e.preco !== null && e.preco !== undefined && String(e.preco).trim() !== '') {
      // A tela é pt-BR: "12,50" chega com vírgula.
      const n = Number(String(e.preco).replace(/\s/g, '').replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) {
        rejeitados.push(`${chave}: preço inválido (${e.preco})`);
        continue;
      }
      preco = n;
    }

    const faixa = e.faixa && FAIXAS.has(e.faixa) ? (e.faixa as PrecoItem['faixa']) : anterior?.faixa;
    const registro: PrecoItem = { preco };
    if (faixa) registro.faixa = faixa;
    const nota = e.nota ?? anterior?.nota;
    if (nota) registro.nota = nota;

    itens[chave] = registro;
    gravados++;
  }

  return { arquivo: { ...atual, itens }, gravados, rejeitados };
}

/**
 * Gravação atômica: escreve em `.tmp` no mesmo diretório e renomeia.
 *
 * `rename` no mesmo sistema de arquivos é atômico, então o arquivo nunca é visto pela metade —
 * nem por um `gerar` que rode em paralelo pelo cron, nem por uma queda no meio da escrita.
 */
export async function gravarPrecos(caminho: string, arquivo: ArquivoPrecos): Promise<void> {
  const tmp = `${caminho}.tmp`;
  await writeFile(tmp, JSON.stringify(arquivo, null, 2) + '\n', 'utf8');
  await rename(tmp, caminho);
}
