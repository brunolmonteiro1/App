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
  /**
   * Categorias com que o operador não trabalha. O lote inteiro é marcado como ignorado —
   * não entra na shortlist nem recebe teto — mas continua visível no estudo, porque durante
   * o pregão o leiloeiro chama o lote e a ausência dele na tela pareceria falha.
   */
  categoriasIgnoradas: Categoria[];
  /**
   * Itens dessas categorias dentro de lotes MISTOS. Sem isso, um lote de "utensílios,
   * vestuário e cosméticos" contaria o shampoo no valor e inflaria o teto com mercadoria
   * que o operador não revende.
   */
  termosIgnorados: string[];
  /**
   * Salvaguarda do filtro acima: descrição que contém um destes **nunca** é ignorada por
   * termo. Existe porque o casamento é por substring, e substring confunde o recipiente com
   * o conteúdo — "TAÇA PARA VINHO" batia em `vinho`, "SABONETEIRA" bate em `sabonete`.
   * O erro é caro na direção errada: joga em C, valendo zero, item que ele vende bem.
   */
  excecoesIgnorados: string[];
  categorias: Record<Categoria, ConfigCategoria>;
  /**
   * A regra de bolso do operador, e o caminho de teto que **não depende de precificar item**.
   *
   * Palavras dele: *"eu divido valor total final pelo total de itens na descrição. Não costuma
   * passar de 15 reais por item. Os últimos leilões comprei com custo por item entre 10 e 14."*
   *
   * É a camada 0 da análise, e a que funciona no dia do pregão: 23 dos 54 lotes deste evento já
   * estão dentro dela, contra zero tetos pelo caminho do valor de revenda.
   */
  regra: {
    /** Limite: R$ de custo total por item. Acima disto ele não compra. */
    custoPorItemMaximo: number;
    /** Onde ele costuma comprar. Vira a fronteira verde/amarelo. */
    custoPorItemAlvo: number;
    /**
     * Divisor do custo por item.
     *
     * `titulo` é a regra literal dele, e é a base em que os R$ 10–14 estão calibrados — o painel
     * precisa reproduzir a conta que ele faz de cabeça. `nomeados` desconta caixa de diversos e
     * peça dentro de embalagem; aparece ao lado, e o contraste entre os dois é o produto.
     */
    base: 'titulo' | 'nomeados' | 'uteis';
    /** Acima desta fração em caixa fechada, o lote ganha alerta: é outro tipo de risco. */
    fracaoEmCaixaGrave: number;
  };
  /**
   * Camada 1: quanto sai UMA peça útil no bazar, por categoria. É o que permite estimar lucro nos
   * 61 lotes sem pesquisar preço de 1.900 descrições — um número por categoria em vez de mil.
   *
   * Nasce tudo `null` de propósito. O operador respondeu "depende muito da categoria" e não deu
   * valores; **número inventado aqui viraria lucro inventado**, e lucro inventado vira lance real.
   * Enquanto for null, o estudo não mostra lucro nenhum.
   */
  vendaMediaPorItemUtil: Record<Categoria, number | null>;
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
  // Operador: "ignorar lotes de cosméticos e de bebidas e ignorar também produtos de
  // limpeza, não trabalho com isso".
  categoriasIgnoradas: ['cosmeticos', 'bebidas'],
  termosIgnorados: [
    // cosmético e higiene pessoal
    'shampoo', 'xampu', 'condicionador', 'hidratante', 'creme de', 'mascara capilar',
    'tintura', 'coloracao', 'esmalte', 'batom', 'perfume', 'desodorante', 'sabonete',
    'protetor solar', 'oleo capilar', 'finalizador', 'leave in', 'progressiva', 'alisante',
    'gel fixador', 'pomada modeladora', 'antisséptico', 'antisseptico',
    // limpeza
    'detergente', 'desinfetante', 'agua sanitaria', 'água sanitária', 'alvejante',
    'amaciante', 'sabao', 'sabão', 'lava roupas', 'lava louca', 'lava louça',
    'limpador', 'multiuso limpeza', 'cera para piso', 'tira manchas', 'removedor',
    // bebida
    'cerveja', 'heineken', 'amstel', 'budweiser', 'corona', 'brahma', 'skol', 'baden',
    'vinho', 'espumante', 'whisky', 'whiskey', 'vodka', 'smirnoff', 'gin', 'campari',
    'martini', 'licor', 'cachaca', 'cachaça', 'tequila', 'rum', 'johnnie walker',
    'energetico', 'energético', 'monster', 'red bull', 'refrigerante', 'coca cola',
    'pepsi', 'guarana', 'guaraná', 'xeque mate', 'drink beats',
  ],
  excecoesIgnorados: [
    // O RECIPIENTE não é a bebida. "TAÇA PARA VINHO EM CRISTAL BOHEMIA" batia em 'vinho' e
    // ia para C valendo zero — e cristal Bohemia é justamente o que gira bem no bazar.
    // Mesma família do falso positivo de "COPOS PARA WHISKY WOLFF", que já custou o lote 22.
    'taca', 'taça', 'copo', 'caneca', 'jarra', 'garrafa', 'decanter', 'bowl', 'tigela',
    'balde', 'cooler', 'abridor', 'saca rolha', 'saca-rolha', 'dosador', 'porta ',
    'suporte', 'bandeja', 'travessa', 'prato', 'escorredor', 'adega', 'whiskeira',
    // O acessório de higiene também não é o cosmético: 'saboneteira' contém 'sabonete',
    // 'porta shampoo' contém 'shampoo'.
    'saboneteira', 'porta escova', 'escova de dente', 'nécessaire', 'necessaire',
  ],
  regra: {
    custoPorItemMaximo: 15,
    custoPorItemAlvo: 12,
    base: 'titulo',
    fracaoEmCaixaGrave: 0.35,
  },
  vendaMediaPorItemUtil: {
    vestuario: null,
    utensilios: null,
    cosmeticos: null,
    eletroportateis: null,
    ferramentas: null,
    moveis: null,
    automotivas: null,
    bebidas: null,
    outros: null,
  },
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
