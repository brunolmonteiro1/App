import { describe, expect, it } from 'vitest';
import { conferir, lerManifesto } from '../src/superbid/manifesto.ts';
import { textoCompleto } from '../src/superbid/pdf.ts';

const MANIFESTO = new URL('../recon/fixtures/manifesto-lote3-SB0032812.pdf', import.meta.url)
  .pathname;
const EDITAL = new URL('../recon/fixtures/edital-evento-790754.pdf', import.meta.url).pathname;

describe('manifesto do lote 3 — ground truth capturado do site', () => {
  it('extrai 71 itens que somam exatamente as 304 unidades do título', async () => {
    const m = await lerManifesto(MANIFESTO);
    expect(m.itens).toHaveLength(71);
    expect(m.somaQuantidades).toBe(304);
    expect(m.refs).toEqual(['SB0032812']);
  }, 60_000);

  it(
    'roda em menos de 5 s — se alguém reintroduzir o regex lazy global, estoura aqui',
    async () => {
      // O regex `(.*?)(\d+)\s+(SB\d+)\s+Somente...` com dotAll sobre o texto inteiro
      // causa backtracking catastrófico e travou o processo no reconhecimento.
      // Com split-antes-do-regex, o parse é instantâneo.
      const inicio = Date.now();
      await lerManifesto(MANIFESTO);
      expect(Date.now() - inicio).toBeLessThan(5_000);
    },
    20_000,
  );

  it('descrições saem limpas, sem fragmento do boilerplate', async () => {
    const m = await lerManifesto(MANIFESTO);
    for (const item of m.itens) {
      expect(item.descricao).not.toContain('na descrição fazem parte');
      expect(item.descricao).not.toContain('Itens não testados');
      expect(item.descricao).not.toContain('Fotos meramente ilustrativas');
      expect(item.descricao).not.toContain('Condição do bem');
      expect(item.descricao.length).toBeGreaterThan(0);
    }
  }, 60_000);

  it('preserva a descrição inteira, incluindo o sufixo que denuncia o estado', async () => {
    const m = await lerManifesto(MANIFESTO);
    const descricoes = m.itens.map((i) => i.descricao);
    // Este item só aparece completo se o boilerplate for removido corretamente.
    expect(descricoes).toContain('JOGO DE FERRAMENTAS SATA INCOMPLETO');
    expect(descricoes.some((d) => d.includes('FRALDA POMPOM'))).toBe(true);
  }, 60_000);

  it('o vendedor não declara condição de nenhum item — é o risco central', async () => {
    const m = await lerManifesto(MANIFESTO);
    expect(m.condicaoDeclarada).toBe('não informado');
  }, 60_000);

  it('os itens irrisórios do lote 3 estão lá, e são ~170 das 304 unidades', async () => {
    const m = await lerManifesto(MANIFESTO);
    const achar = (t: string) => m.itens.find((i) => i.descricao.toUpperCase().includes(t));
    expect(achar('MASCARA DE GATINHO')?.quantidade).toBe(60);
    expect(achar('ROUPAS DIVERSAS')?.quantidade).toBe(36);
  }, 60_000);
});

describe('conferência — divergência é alerta, não exceção', () => {
  it('não alerta quando ref e contagem batem', async () => {
    const m = await lerManifesto(MANIFESTO);
    expect(conferir(m, 'SB0032812', 304)).toEqual([]);
  }, 60_000);

  it('alerta quando o PDF é de outro lote', async () => {
    const m = await lerManifesto(MANIFESTO);
    const a = conferir(m, 'SB0028777', 304);
    expect(a.join(' ')).toContain('SB0032812');
  }, 60_000);

  it('alerta quando o título promete mais unidades do que o manifesto tem', async () => {
    const m = await lerManifesto(MANIFESTO);
    const a = conferir(m, 'SB0032812', 400);
    // É o caso que o operador descreveu: "dizem 400, tem 300".
    expect(a.join(' ')).toContain('400');
    expect(a.join(' ')).toContain('304');
  }, 60_000);
});

describe('Edital — outro tipo de PDF, e pdfjs-dist NÃO resolve a fonte dele', () => {
  it('não é anexo de lote nenhum: não tem referência SB', async () => {
    const t = await textoCompleto(EDITAL);
    expect(t.length).toBeGreaterThan(1000);
    // Documento de evento e anexo de lote são caminhos separados no código.
    expect(/SB\d{5,}/.test(t)).toBe(false);
  }, 120_000);

  it('documenta a falha da tarefa zero: fonte subset sai como código de glifo', async () => {
    // O Edital usa fonte com subset e sem /ToUnicode, /Differences ou /Encoding.
    // pdfjs-dist reconstrói mapeamento a partir do programa de fonte — e aqui não
    // consegue. Este teste trava o fato: se um dia passar a extrair texto legível,
    // ele falha e nos avisa que o caminho do Edital pode voltar a ser automático.
    const t = await textoCompleto(EDITAL);
    expect(t).not.toContain('Condições de Venda');
    // Impacto baixo: a fórmula de encargos (10% + R$ 250) veio do diálogo de lance,
    // que é fonte melhor que o Edital de qualquer forma.
  }, 120_000);
});
