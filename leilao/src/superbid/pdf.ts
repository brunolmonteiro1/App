/**
 * Extração de texto de PDF via pdfjs-dist.
 *
 * Existem dois tipos de PDF neste projeto, e é por isso que não serve um extrator
 * caseiro de streams:
 *
 * - **Manifesto de lote** — fonte com encoding padrão. Qualquer extrator lê.
 * - **Edital do evento** — fonte com subset e SEM `/ToUnicode`, `/Differences` ou
 *   `/Encoding`. Extração ingênua devolve lixo (`E+ndiPces de dend)` em vez de
 *   `Condições de Venda`), porque os códigos de glifo não mapeiam para Unicode.
 *
 * `pdfjs-dist` reconstrói o mapeamento a partir do programa de fonte embutido, então
 * cobre os dois casos com o mesmo código.
 */

import { readFile } from 'node:fs/promises';

// pdfjs-dist é ESM com build legacy para Node; o import dinâmico evita o topo do módulo
// tentando resolver Worker/Canvas em ambiente sem DOM.
async function carregarPdfjs() {
  return import('pdfjs-dist/legacy/build/pdf.mjs');
}

/** Texto de cada página, na ordem. */
export async function paginas(caminho: string): Promise<string[]> {
  const pdfjs = await carregarPdfjs();
  const dados = new Uint8Array(await readFile(caminho));

  // `disableWorker` roda o parse no próprio processo — previsível em CI e sem precisar
  // resolver caminho de worker. pdfjs aceita a opção em runtime mas não a declara no tipo
  // público, daí o cast. Atenção: NÃO trocar isto por `GlobalWorkerOptions.workerSrc = ''`
  // — string vazia faz o pdfjs falhar com "Setting up fake worker failed".
  const params = {
    data: dados,
    disableWorker: true,
    // Alguns PDFs do Superbid trazem fonte só como subset; deixar o pdfjs usar as
    // fontes padrão embutidas dele quando o programa de fonte não resolve.
    useSystemFonts: true,
  } as Parameters<typeof pdfjs.getDocument>[0];

  const doc = await pdfjs.getDocument(params).promise;

  const saida: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const conteudo = await pagina.getTextContent();
    const texto = conteudo.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    saida.push(texto);
    pagina.cleanup();
  }
  await doc.destroy();
  return saida;
}

/** Todo o texto do PDF numa string, com espaços normalizados. */
export async function textoCompleto(caminho: string): Promise<string> {
  const p = await paginas(caminho);
  return p.join(' ').replace(/\s+/g, ' ').trim();
}
