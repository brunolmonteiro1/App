# Site Institucional — Instituto Vosz

Site institucional premium do **Instituto Vosz**, OSC de assistência social no
Cambuci, São Paulo. Construído em **Next.js 14 (App Router) + Tailwind CSS +
Framer Motion**, com foco em performance, acessibilidade e fidelidade ao Manual
de Identidade Visual da marca.

## Rodando localmente

```bash
cd vosz-site
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm start        # servir o build
```

## Stack e princípios

- **Next.js 14 / React 18** (App Router, componentes JSX).
- **Tailwind CSS** com a paleta oficial Vosz (`tailwind.config.js`).
- **Montserrat** via `next/font` (tipografia oficial da marca).
- **Framer Motion** usado apenas em 3 momentos-chave (Hero, Jornada VOAR,
  Diagrama de Sustentabilidade). Todas as animações respeitam
  `prefers-reduced-motion`.
- Mobile-first, fundos claros predominantes, roxo/rosa para conversão.

## Estrutura

```
app/            Rotas (Home + 9 páginas internas), layout, SEO (sitemap/robots)
components/
  layout/       Header, Footer, MobileDonateBar, CookieBanner
  home/         Seções da Home
  ui/           Button, Card, Icon, Logo, Grafismo, PixCard, Section, Reveal...
  forms/        LeadForm (contato/voluntário/empresa/família)
lib/
  site.js       Navegação, contatos, dados jurídicos, PIX
  content.js    TODO o texto do site (fonte única de verdade)
  motion.js     Variantes de animação
public/         Logos oficiais, símbolo, grafismo, QR PIX, OG image, favicon
```

## Conteúdo que precisa ser revisado/substituído

### Dados a confirmar (marcados como `CONFIRMAR` em `lib/site.js`)
- **WhatsApp** oficial de atendimento.
- **E-mail** institucional.
- **CEP** e confirmação do endereço.
- **Facebook** (se houver).

### Dados já aplicados (extraídos do material oficial)
- CNPJ / chave PIX: `39.891.120/0001-61`
- Endereço: Rua Clímaco Barbosa, 380 — Cambuci, São Paulo/SP
- Instagram: `@institutovosz` · linktr.ee/institutovosz

### Assets visuais
- Logos oficiais (`public/logo-vosz-*.png`, `simbolo-vosz.png`) foram extraídos
  do PDF do Manual de Marca. Para máxima nitidez, substitua pelos **SVGs
  vetoriais oficiais** quando disponíveis.
- **Fotografia:** o site usa composições abstratas e a identidade da marca — não
  há rostos de crianças gerados por IA nem banco de imagem genérico. Adicione
  **fotos reais autorizadas** do Instituto (atividades, cozinha, bazar, arte,
  maker) respeitando a política de proteção infantil.
- O QR Code do PIX (`public/pix-qr.png`) e o "copia e cola" em `lib/site.js`
  foram gerados a partir da chave CNPJ (payload PIX estático válido).

## Integrações preparadas para o futuro

- **Doações por gateway** (Asaas/Pagar.me/Stripe): hoje o site usa PIX + WhatsApp
  + linktree. Os formulários (`components/forms/LeadForm.jsx`) têm um ponto
  marcado com `TODO(backend)` para plugar um endpoint/CRM.
- **Analytics / cookies:** o `CookieBanner` está pronto; conecte GA/Meta Pixel
  quando o Instituto definir.

## Deploy na Vercel

1. Faça deploy da pasta `vosz-site/` como projeto Next.js (root = `vosz-site`).
2. Ajuste `site.url` em `lib/site.js` para o domínio final (afeta SEO/OG/sitemap).
3. Sem variáveis de ambiente obrigatórias nesta versão.
```
