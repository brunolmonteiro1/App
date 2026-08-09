/**
 * Config do operador. Nada aqui é lei da natureza — cada leilão tem lógica própria,
 * então estes valores são parâmetro, não constante de código.
 */

/** Faixa de item. Só A e B entram no teto; C é volume de bazar, vale zero. */
export type Faixa = 'A' | 'B' | 'C';

export type Categoria =
  | 'vestuario'
  | 'utensilios'
  | 'cosmeticos'
  | 'eletroportateis'
  | 'ferramentas'
  | 'moveis'
  | 'automotivas'
  | 'bebidas'
  | 'outros';

/** Uma linha da tabela de Encargos de Administração + Fee Plataforma. */
export interface FaixaEncargo {
  /** Limite superior da faixa, inclusive. `Infinity` na última. */
  ate: number;
  valor: number;
}

/**
 * Encargos do evento, do Edital ("COMISSÕES, ENCARGOS DE ADMINISTRAÇÃO E FEE PLATAFORMA"):
 *
 *     Leiloeiro                 5%
 *     SOLD (Buyer's Premium)    5%    → juntos, os 10% que o card do site mostra
 *     Encargos Adm + Fee        tabela por faixa de LANCE
 *
 * Conferido contra dois pontos reais do estimador do site, ambos fechando no centavo:
 *
 *     lance 3.010 → 150,50 + 150,50 + 187,50 + 62,50 = 551,00 → total 3.561,00
 *     lance 3.460 → 173,00 + 173,00 +        250,00  = 596,00 → total 4.056,00
 *
 * ATENÇÃO ao histórico deste arquivo: a primeira versão tinha `fixo: 250` como constante,
 * porque os dois exemplos disponíveis caíam na MESMA faixa (1.000–4.999,99). Dois pontos
 * numa faixa só não distinguem taxa fixa de tabela. Nunca voltar a tratar como constante.
 *
 * A API diz `groupOffer.commissionPercent = 5` — menos da metade do encargo real, e ignora
 * a tabela por completo. NUNCA derivar daí.
 */
export interface Encargos {
  /** Percentual sobre o martelo: leiloeiro + buyer's premium. */
  percentual: number;
  /** Encargos de Administração + Fee Plataforma, por faixa de lance. */
  faixas: FaixaEncargo[];
  /**
   * Como o estimador do site divide o valor da faixa. Só para exibição — a soma é o que
   * entra na conta.
   */
  divisao: { encargosAdm: number; feePlataforma: number };
  fonte: 'edital' | 'dialogo-lance' | 'manual';
}

export interface ConfigCategoria {
  /** Retorno exigido sobre o custo. Quanto maior, mais conservador o teto. */
  multiplo: number;
  /**
   * Perda esperada: avaria, faltante, desmontado que não remonta, vencido.
   * PLACEHOLDER — o operador compra há anos e tem o número real. É a calibragem
   * que mais move o teto.
   */
  perda: number;
  rotulo: string;
}

export interface Config {
  encargos: Encargos;
  /**
   * Fração do valor online que a operação realiza de fato na venda.
   * Informado pelo operador: bazar solidário + evento de outlet vendem a 40–60%.
   * O teto sai como faixa por causa disso.
   */
  fatorBazar: { conservador: number; otimista: number };
  /**
   * Peso do item faixa B no valor do lote. B é "só sai a preço baixo de bazar", então entra
   * no teto valendo menos que A — sem isso a faixa B seria rótulo decorativo.
   */
  fatorB: number;
  /**
   * Fração mínima das unidades efetivas que precisa ter preço para o teto ser exibido.
   * Abaixo disso o estudo diz "cobertura insuficiente" em vez de um teto baixo, porque teto
   * calculado sobre 3% dos itens não é conservador — é enganoso, e faria o operador descartar
   * lote bom pensando que é lote caro.
   */
  coberturaMinima: number;
  /**
   * Fração mínima das LINHAS relevantes com preço. Checada junto com `coberturaMinima`,
   * porque cobertura só por unidade deixa passar lote onde o item caro está sem preço.
   */
  coberturaMinimaLinhas: number;
  categorias: Record<Categoria, ConfigCategoria>;
  /** Custo de retirada por lote. Retirada é em Embu das Artes-SP. */
  freteporLote: number;
  /** Marca o custo como incompleto enquanto o frete não for informado. */
  freteInformado: boolean;
}

/** Tabela do Edital do evento 790754. Cada leilão tem a sua — isto é config, não constante. */
export const ENCARGOS_790754: Encargos = {
  percentual: 0.10,
  fonte: 'edital',
  // 187,50 + 62,50 = 250, observado no estimador para um lance de R$ 3.010.
  divisao: { encargosAdm: 0.75, feePlataforma: 0.25 },
  faixas: [
    { ate: 499.99, valor: 50 },
    { ate: 999.99, valor: 125 },
    { ate: 4999.99, valor: 250 },
    { ate: 9999.99, valor: 500 },
    { ate: 29999.99, valor: 750 },
    { ate: 49999.99, valor: 1250 },
    { ate: 74999.99, valor: 1500 },
    { ate: 99999.99, valor: 3000 },
    { ate: 149999.99, valor: 4000 },
    // O Edital lista 150–199.999, 200–249.999 e "igual ou superior a 250.000" todas em
    // R$ 6.500, então acima de 150 mil é um valor só.
    { ate: Infinity, valor: 6500 },
  ],
};

export const CONFIG_PADRAO: Config = {
  encargos: ENCARGOS_790754,
  fatorBazar: { conservador: 0.40, otimista: 0.60 },
  fatorB: 0.6,
  coberturaMinima: 0.6,
  coberturaMinimaLinhas: 0.5,
  freteporLote: 0,
  freteInformado: false,
  categorias: {
    vestuario: { multiplo: 2.0, perda: 0.10, rotulo: 'Vestuário, calçados, cama/mesa/banho' },
    utensilios: { multiplo: 2.0, perda: 0.15, rotulo: 'Utensílios, papelaria, brinquedos' },
    cosmeticos: { multiplo: 2.5, perda: 0.20, rotulo: 'Cosméticos e limpeza' },
    eletroportateis: { multiplo: 3.5, perda: 0.40, rotulo: 'Eletroportáteis' },
    ferramentas: { multiplo: 3.5, perda: 0.35, rotulo: 'Ferramentas, informática' },
    moveis: { multiplo: 4.0, perda: 0.30, rotulo: 'Móveis e itens grandes' },
    automotivas: { multiplo: 4.5, perda: 0.25, rotulo: 'Peças automotivas' },
    bebidas: { multiplo: 3.0, perda: 0.15, rotulo: 'Bebidas — checar licença de venda' },
    outros: { multiplo: 3.0, perda: 0.25, rotulo: 'Outros / misto' },
  },
};
