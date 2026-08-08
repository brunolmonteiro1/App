/**
 * Coleta da listagem do evento.
 *
 * A página do Superbid é Next.js e expõe o endpoint real da API em `__NEXT_DATA__`.
 * Chamando direto, **um request devolve os 61 lotes**, sem autenticação, sem anti-bot e
 * sem paginação — já com lance atual, URLs de todas as fotos e URLs dos PDFs de anexo.
 * Por isso não há Playwright nem extensão de navegador neste projeto.
 *
 * A API não é contrato público e pode mudar sem aviso. O schema zod falha alto de
 * propósito: é o alarme, e o conserto fica isolado neste diretório.
 */

import { z } from 'zod';

const BASE = 'https://offer-query.superbid.net/seo/offers/';

/** O fuso pedido na origem, para o payload já vir no horário do pregão. */
export const FUSO_PREGAO = 'America/Sao_Paulo';

const zAnexo = z.object({ link: z.string(), name: z.string().optional() });

const zOferta = z.object({
  id: z.number(),
  lotNumber: z.number(),
  price: z.number().nullable().optional(),
  endDate: z.string(),
  totalBids: z.number().default(0),
  hasBids: z.boolean().default(false),
  visits: z.number().nullable().optional(),
  offerStatus: z.object({
    closed: z.boolean().default(false),
    closedToBids: z.boolean().default(false),
  }),
  offerDetail: z.object({
    initialBidValue: z.number().nullable().optional(),
    currentMinBid: z.number().nullable().optional(),
    currentMaxBid: z.number().nullable().optional(),
  }),
  currentBidIncrement: z
    .object({ currentBidIncrement: z.number().nullable().optional() })
    .nullable()
    .optional(),
  product: z.object({
    shortDesc: z.string(),
    detailedDescription: z.string().nullable().optional(),
    galleryJson: z.array(z.object({ link: z.string() })).default([]),
    attachments: z.array(zAnexo).default([]),
    location: z.object({ city: z.string().nullable().optional() }).nullable().optional(),
  }),
  auction: z.object({
    id: z.number(),
    endDate: z.string(),
    maxEnddateOffer: z.string().nullable().optional(),
  }),
  currentTimestamp: z.string().optional(),
});

const zResposta = z.object({
  total: z.number(),
  offers: z.array(zOferta),
});

export type OfertaBruta = z.infer<typeof zOferta>;

/** Um lote, já normalizado para o resto do código. */
export interface Lote {
  offerId: number;
  numero: number;
  titulo: string;
  descricao: string | null;
  /** Lance atual. Quando não há lances, é o valor inicial — ver `temLances`. */
  lance: number;
  temLances: boolean;
  totalLances: number;
  incremento: number;
  encerrado: boolean;
  encerraEm: string;
  cidade: string | null;
  fotos: string[];
  anexos: string[];
}

/** Fuso em que os timestamps do payload estão. Depende do `timeZoneId` do request. */
export type FusoPayload = 'UTC' | 'America/Sao_Paulo';

export interface Evento {
  auctionId: number;
  /**
   * O payload devolve as datas no fuso pedido no request. Confundir isso é o bug de
   * 3 horas: `auction.endDate = 18:30` em UTC é o `15:30` que a tela do evento mostra.
   */
  fuso: FusoPayload;
  total: number;
  encerraEm: string;
  /** Limite duro da prorrogação: 1 h após o fim do evento neste leilão. */
  prorrogaAte: string | null;
  /** Relógio do servidor, para datar o estudo sem depender do PC. */
  agora: string | null;
  lotes: Lote[];
}

/** O `auction.id` vem do sufixo do slug: `logistica-reversa-790754`. */
export function auctionIdDaUrl(url: string): number {
  const m = /(\d{4,})(?:[/?#]|$)/.exec(url.trim());
  if (!m) throw new Error(`não achei o auction.id na URL: ${url}`);
  return Number(m[1]);
}

export function montarUrl(auctionId: number, pageSize = 100): string {
  const p = new URLSearchParams({
    locale: 'pt_BR',
    portalId: '[2,15]',
    requestOrigin: 'marketplace',
    timeZoneId: FUSO_PREGAO,
    filter: `auction.id:${auctionId}`,
    orderBy: 'lotNumber:asc;subLotNumber:asc',
    pageNumber: '1',
    pageSize: String(pageSize),
    urlSeo: 'https://www.superbid.net',
  });
  return `${BASE}?${p}`;
}

export function normalizar(o: OfertaBruta): Lote {
  const d = o.offerDetail;
  return {
    offerId: o.id,
    numero: o.lotNumber,
    titulo: o.product.shortDesc,
    descricao: o.product.detailedDescription ?? null,
    lance: d.currentMaxBid ?? d.initialBidValue ?? o.price ?? 0,
    temLances: o.hasBids || o.totalBids > 0,
    totalLances: o.totalBids,
    // Sem incremento declarado, o degrau some e o "último lance válido" não faz sentido;
    // 1 deixa o cálculo contínuo em vez de quebrar.
    incremento: o.currentBidIncrement?.currentBidIncrement ?? 1,
    encerrado: o.offerStatus.closed || o.offerStatus.closedToBids,
    encerraEm: o.endDate,
    cidade: o.product.location?.city ?? null,
    fotos: o.product.galleryJson.map((g) => g.link),
    anexos: o.product.attachments.map((a) => a.link),
  };
}

export function parsearEvento(json: unknown, fuso: FusoPayload = FUSO_PREGAO): Evento {
  const r = zResposta.parse(json);
  const primeira = r.offers[0];
  return {
    auctionId: primeira?.auction.id ?? 0,
    fuso,
    total: r.total,
    encerraEm: primeira?.auction.endDate ?? '',
    prorrogaAte: primeira?.auction.maxEnddateOffer ?? null,
    agora: primeira?.currentTimestamp ?? null,
    // Ordenado por lotNumber: é a ordem de chamada e a mesma que o BidTV mostra.
    lotes: r.offers.map(normalizar).sort((a, b) => a.numero - b.numero),
  };
}

export async function buscarEvento(auctionId: number): Promise<Evento> {
  const resp = await fetch(montarUrl(auctionId), {
    headers: { accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`offer-query respondeu ${resp.status}`);
  return parsearEvento(await resp.json());
}
