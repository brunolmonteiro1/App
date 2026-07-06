import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileDonateBar from "@/components/layout/MobileDonateBar";
import CookieBanner from "@/components/layout/CookieBanner";
import { site, contato, juridico } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: site.name,
  url: site.url,
  description: site.description,
  logo: `${site.url}/og-image.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: contato.enderecoLinha1,
    addressLocality: "Cambuci, São Paulo",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  taxID: juridico.cnpj,
  sameAs: [contato.instagram, contato.linktree],
};

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Instituto Vosz — Cuidado integral para crianças e famílias",
    template: "%s · Instituto Vosz",
  },
  description: site.description,
  keywords: [
    "Instituto Vosz",
    "assistência social",
    "contraturno socioeducativo",
    "Cambuci",
    "São Paulo",
    "OSC",
    "doação",
    "crianças e famílias",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: site.name,
    title: "Instituto Vosz — Cuidado integral para crianças e famílias",
    description: site.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Instituto Vosz" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Instituto Vosz",
    description: site.description,
    images: ["/og-image.png"],
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
  alternates: { canonical: "/" },
};

export const viewport = {
  themeColor: "#4200ac",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="pb-24 lg:pb-0">
          {children}
        </main>
        <Footer />
        <MobileDonateBar />
        <CookieBanner />
      </body>
    </html>
  );
}
