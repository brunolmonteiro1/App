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

/**
 * Encargos do evento. **Verificado no diálogo "Confirmar lance" do BidTV**, lote 5:
 * lance 3.460,00 → encargos 596,00 → total 4.056,00.
 * Decompondo: 10% × 3.460 = 346, e 596 − 346 = 250. Bate no centavo.
 *
 * A API diz `groupOffer.commissionPercent = 5` — é menos da metade do encargo real e
 * ignora a taxa fixa. NUNCA derivar daí.
 */
export interface Encargos {
  /** Percentual sobre o martelo. */
  percentual: number;
  /** Taxa fixa por lote, em reais. É ela que devora lote barato. */
  fixo: number;
  fonte: 'dialogo-lance' | 'edital' | 'manual';
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
  categorias: Record<Categoria, ConfigCategoria>;
  /** Custo de retirada por lote. Retirada é em Embu das Artes-SP. */
  freteporLote: number;
  /** Marca o custo como incompleto enquanto o frete não for informado. */
  freteInformado: boolean;
}

export const CONFIG_PADRAO: Config = {
  encargos: { percentual: 0.10, fixo: 250, fonte: 'dialogo-lance' },
  fatorBazar: { conservador: 0.40, otimista: 0.60 },
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
