// Dados institucionais e de configuração do site.
// Fontes confirmadas: Brand Guidelines (Key Visual) — CNPJ/PIX, endereço, Instagram, linktree.
// Itens marcados com CONFIRMAR devem ser validados pelo Instituto antes de irem ao ar.

export const site = {
  name: "Instituto Vosz",
  shortName: "Vosz",
  slogan: "Educação que transforma. Amor que restaura.",
  url: "https://institutovosz.com.br",
  description:
    "O Instituto Vosz é uma OSC de assistência social no Cambuci, São Paulo, que atua no contraturno socioeducativo com cuidado integral: assistência social, alimentação, neuropsicologia, arte, tecnologia e acompanhamento familiar.",
  tagline: "Cuidado integral para crianças, adolescentes e famílias.",
};

export const contato = {
  // Endereço da apresentação institucional mais recente.
  // CONFIRMAR: material anterior citava "Rua Clímaco Barbosa, 380".
  enderecoLinha1: "R. da Independência, 866",
  enderecoLinha2: "Cambuci — São Paulo/SP",
  cep: "", // CONFIRMAR
  // WhatsApp da apresentação mais recente. CONFIRMAR: outro material cita (11) 93365-0516.
  whatsapp: "5511999373154",
  whatsappLabel: "(11) 99937-3154",
  email: "contato@institutovosz.com.br", // CONFIRMAR
  instagram: "https://www.instagram.com/institutovosz",
  instagramHandle: "@institutovosz",
  facebook: "https://www.facebook.com/institutovosz", // CONFIRMAR
  linktree: "https://linktr.ee/institutovosz",
};

export const juridico = {
  razaoSocial: "Instituto Vosz",
  cnpj: "39.891.120/0001-61",
  natureza: "Organização da Sociedade Civil (OSC) sem fins lucrativos",
};

// Chave PIX = CNPJ (conforme material oficial do Instituto).
export const pix = {
  tipo: "CNPJ",
  chave: "39891120000161",
  chaveFormatada: "39.891.120/0001-61",
  beneficiario: "Instituto Vosz",
  // Payload PIX estático (copia e cola) gerado a partir da chave CNPJ.
  copiaECola:
    "00020126360014br.gov.bcb.pix0114398911200001615204000053039865802BR5914INSTITUTO VOSZ6009SAO PAULO62070503***63045684",
  qr: "/pix-qr.png",
};

// Mensagem padrão para abrir conversas no WhatsApp.
export function whatsappUrl(mensagem) {
  const base = `https://wa.me/${contato.whatsapp}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// Navegação principal enxuta: Home converte, internas aprofundam.
export const nav = [
  { label: "Início", href: "/" },
  { label: "Quem Somos", href: "/quem-somos" },
  { label: "Metodologia", href: "/metodologia" },
  { label: "Impacto", href: "/impacto" },
  { label: "Apoie", href: "/apoie" },
  { label: "Transparência", href: "/transparencia" },
];

// Conteúdos fora do menu principal continuam acessíveis pelo footer.
export const navFooter = [
  { label: "O que Fazemos", href: "/o-que-fazemos" },
  { label: "Sustentabilidade", href: "/sustentabilidade" },
  { label: "Contato", href: "/contato" },
];

// Rotas completas para o sitemap.
export const rotas = [
  "/",
  "/quem-somos",
  "/metodologia",
  "/o-que-fazemos",
  "/sustentabilidade",
  "/impacto",
  "/apoie",
  "/transparencia",
  "/contato",
];
