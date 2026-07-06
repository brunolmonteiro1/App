"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Button from "../ui/Button";
import { Container } from "../ui/Section";
import Grafismo from "../ui/Grafismo";
import { hero } from "@/lib/content";

// Momento visual #1 — Hero narrativo.
// A criança/comunidade (símbolo Vosz) ao centro; as camadas de cuidado surgem
// suavemente ao redor e se conectam, formando uma "rede de cuidado".
// Sem rosto de criança. Respeita prefers-reduced-motion.

// Posições dos chips ao redor do centro (em %), num anel.
const orbit = [
  { top: "2%", left: "50%" },
  { top: "15%", left: "88%" },
  { top: "50%", left: "100%" },
  { top: "85%", left: "88%" },
  { top: "98%", left: "50%" },
  { top: "85%", left: "12%" },
  { top: "50%", left: "0%" },
  { top: "15%", left: "12%" },
];

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-cream to-cream">
      {/* Blobs suaves da marca ao fundo */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-vosz-roxo/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 top-40 h-72 w-72 rounded-full bg-vosz-rosa/10 blur-3xl" />
      <Grafismo className="pointer-events-none absolute right-6 top-6 h-16 w-16 opacity-70" color="rosa" />

      <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        {/* Texto */}
        <div>
          <span className="inline-flex rounded-2xl bg-white px-4 py-2 text-[0.7rem] font-bold uppercase leading-snug tracking-wider text-vosz-roxo shadow-soft sm:text-xs">
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl leading-[1.08] sm:text-5xl md:text-[3.4rem]">
            A escola ensina.{" "}
            <span className="text-gradient-vosz">Mas quem cuida do que impede a criança de aprender?</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">{hero.subtitulo}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={hero.ctaPrimario.href} variant="rosa" size="lg">
              {hero.ctaPrimario.label}
            </Button>
            <Button href={hero.ctaSecundario.href} variant="contorno" size="lg">
              {hero.ctaSecundario.label}
            </Button>
          </div>
        </div>

        {/* Visual: rede de cuidado */}
        <div className="relative">
          {/* Desktop/tablet: órbita de camadas ao redor do símbolo */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
            <div aria-hidden className="absolute inset-0 rounded-full border border-vosz-roxo/10" />
            <div aria-hidden className="absolute inset-[12%] rounded-full border border-vosz-rosa/15" />

            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-soft-lg"
            >
              <Image src="/simbolo-vosz.png" alt="" width={120} height={120} priority className="h-24 w-24" aria-hidden />
            </motion.div>

            <ul className="absolute inset-0">
              {hero.camadas.map((label, i) => (
                <li
                  key={label}
                  className="absolute -translate-x-1/2 -translate-y-1/2 animate-fade-up whitespace-nowrap rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-bold text-vosz-roxo-escuro shadow-soft"
                  style={{ top: orbit[i].top, left: orbit[i].left, animationDelay: `${0.2 + i * 0.09}s` }}
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile: símbolo + nuvem de camadas (garante legibilidade) */}
          <div className="flex flex-col items-center gap-6 lg:hidden">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-soft-lg"
            >
              <Image src="/simbolo-vosz.png" alt="" width={96} height={96} priority className="h-16 w-16" aria-hidden />
            </motion.div>
            <ul className="flex max-w-md flex-wrap justify-center gap-2">
              {hero.camadas.map((label, i) => (
                <li
                  key={label}
                  className="animate-fade-up rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-bold text-vosz-roxo-escuro shadow-soft"
                  style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* faixa-conceito no rodapé do hero */}
      <div className="border-y border-black/5 bg-white/60">
        <Container className="py-4">
          <p className="text-center text-sm font-semibold text-ink/60 sm:text-base">
            Assistência social · Contraturno socioeducativo · Cuidado integral —{" "}
            <span className="text-vosz-rosa">no Cambuci, São Paulo</span>
          </p>
        </Container>
      </div>
    </section>
  );
}
