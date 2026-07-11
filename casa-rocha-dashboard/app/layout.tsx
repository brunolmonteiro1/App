import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde Teológica — A Casa da Rocha",
  description:
    "Dashboard de Saúde Teológica e Formação Pastoral — raio-x auditável da dieta formativa (2020–2026)",
};

const NAV = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/sermons", label: "Pregações" },
  { href: "/dashboard/biblia", label: "Bíblia" },
  { href: "/dashboard/temas", label: "Temas" },
  { href: "/dashboard/series", label: "Séries" },
  { href: "/dashboard/equilibrio", label: "Equilíbrio" },
  { href: "/dashboard/pastoral", label: "Pastoral" },
  { href: "/dashboard/benchmark", label: "Benchmark" },
  { href: "/evidence", label: "Evidências" },
  { href: "/reports", label: "Relatórios" },
  { href: "/coding", label: "Codificação" },
  { href: "/quality", label: "Qualidade" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6 flex-wrap">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              ⛪ Saúde Teológica · A Casa da Rocha
            </Link>
            <nav className="flex gap-4 text-sm text-secondary">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 w-full flex-1">{children}</main>
        <footer className="border-t border-hairline text-xs text-muted">
          <div className="mx-auto max-w-6xl px-4 py-3">
            Métricas desta versão são <strong>lexicais</strong> (camadas determinísticas) —
            hipóteses a validar por codificação e revisão humana. Nenhum dado fica isolado da fonte.
          </div>
        </footer>
      </body>
    </html>
  );
}
