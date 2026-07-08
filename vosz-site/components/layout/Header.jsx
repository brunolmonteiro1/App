"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import { nav } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu ao trocar de rota.
  useEffect(() => setOpen(false), [pathname]);

  // Na Home, o header começa transparente sobre o hero escuro e ganha fundo ao rolar.
  const sobreHeroEscuro = pathname === "/" && !scrolled && !open;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        sobreHeroEscuro
          ? "bg-transparent"
          : scrolled
            ? "bg-white/90 shadow-soft backdrop-blur-md"
            : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="container-vosz flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" aria-label="Instituto Vosz — início" className="shrink-0">
          {sobreHeroEscuro ? <Logo variant="branco" priority className="h-9 w-auto sm:h-10" /> : <Logo priority />}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  sobreHeroEscuro
                    ? active
                      ? "text-vosz-amarelo"
                      : "text-white/85 hover:text-white"
                    : active
                      ? "text-vosz-rosa"
                      : "text-ink/75 hover:text-vosz-roxo"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/apoie" variant="rosa" size="sm">
            Quero Doar
          </Button>
        </div>

        {/* Botão do menu mobile */}
        <button
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${
            sobreHeroEscuro ? "text-white" : "text-vosz-roxo"
          }`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-4 w-6">
            <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 block h-0.5 w-6 bg-current transition-all ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-black/5 bg-white lg:hidden ${
          open ? "max-h-[90vh]" : "max-h-0"
        } transition-[max-height] duration-300 ease-in-out`}
      >
        <nav className="container-vosz flex flex-col gap-1 py-4" aria-label="Navegação principal">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-3 text-base font-semibold ${
                  active ? "bg-vosz-roxo/5 text-vosz-rosa" : "text-ink/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Button href="/apoie" variant="rosa" size="md" className="mt-3">
            Quero Doar
          </Button>
        </nav>
      </div>
    </header>
  );
}
