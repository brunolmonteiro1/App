"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Button from "../ui/Button";
import { Container } from "../ui/Section";
import { hero } from "@/lib/content";

// Momento visual #1 — Hero "cena de cinema".
// Um único quadro com zoom lento (Ken Burns) e dissolve entre fotos reais,
// como abertura de documentário. Tipografia contida: branco + um acento rosa.
// Respeita prefers-reduced-motion (foto estática, sem zoom).

const cenas = [
  {
    src: "/fotos/estudo.jpg",
    alt: "Crianças escrevendo juntas durante atividade no contraturno",
    label: "Ensino personalizado",
  },
  {
    src: "/fotos/bale.jpg",
    alt: "Meninas praticando balé no Instituto Vosz",
    label: "Arte e cultura",
  },
  {
    src: "/fotos/refeicao.jpg",
    alt: "Crianças fazendo refeição juntas no Instituto",
    label: "Alimentação",
  },
];

const DURACAO_CENA = 6000;

function QuadroCinema({ reduce }) {
  const [cena, setCena] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setCena((c) => (c + 1) % cenas.length), DURACAO_CENA);
    return () => clearTimeout(t);
  }, [cena, reduce]);

  const atual = cenas[cena];

  return (
    <div className="relative">
      <div className="relative h-[24rem] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] sm:h-[28rem] lg:h-[34rem]">
        <AnimatePresence mode="sync">
          <motion.div
            key={cena}
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: 1.09 }
            }
            exit={{ opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    opacity: { duration: 1.4, ease: "easeInOut" },
                    scale: { duration: DURACAO_CENA / 1000 + 1.6, ease: "linear" },
                  }
            }
            className="absolute inset-0"
          >
            <Image
              src={atual.src}
              alt={atual.alt}
              fill
              priority={cena === 0}
              className="object-cover"
              sizes="(min-width: 1024px) 620px, 92vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* véu para unidade com o palco */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160040]/70 via-transparent to-[#160040]/20" />

        {/* legenda da cena */}
        <AnimatePresence mode="wait">
          <motion.p
            key={cena}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-6 left-6 text-sm font-bold uppercase tracking-[0.2em] text-white/90"
          >
            {atual.label}
          </motion.p>
        </AnimatePresence>

        {/* indicador de cenas */}
        <div className="absolute bottom-6 right-6 flex gap-1.5" role="presentation">
          {cenas.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver cena ${i + 1}: ${cenas[i].label}`}
              onClick={() => setCena(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === cena ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const secRef = useRef(null);

  // O scroll afasta a cena suavemente (profundidade de saída).
  const { scrollYProgress } = useScroll({
    target: secRef,
    offset: ["start start", "end start"],
  });
  const cenaY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const cenaOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <section ref={secRef} className="grain relative -mt-16 overflow-hidden bg-[#160040] sm:-mt-20">
      {/* iluminação única e contida */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-48 top-0 h-[36rem] w-[36rem] rounded-full bg-vosz-roxo/40 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#160040] to-transparent" />
      </div>

      {/* símbolo gigante em marca d'água */}
      <Image
        src="/simbolo-vosz.png"
        alt=""
        aria-hidden
        width={900}
        height={1020}
        className="pointer-events-none absolute -right-56 -top-40 w-[46rem] opacity-[0.04]"
      />

      <Container className="relative grid min-h-[96svh] items-center gap-12 pb-16 pt-28 sm:pt-32 lg:grid-cols-[1fr_0.92fr] lg:gap-14 lg:pb-20">
        {/* Texto */}
        <motion.div
          style={reduce ? undefined : { y: cenaY, opacity: cenaOpacity }}
          className="relative z-10"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/55 sm:text-xs"
          >
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-[2.7rem] font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]"
          >
            Do acolhimento à <span className="text-vosz-rosa">autonomia</span>.
            <br />
            Uma jornada de cuidado integral.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-white/65"
          >
            {hero.subtitulo}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.44 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button href={hero.ctaPrimario.href} variant="rosa" size="lg">
              {hero.ctaPrimario.label}
            </Button>
            <Button href={hero.ctaSecundario.href} variant="fantasmaBranco" size="lg">
              {hero.ctaSecundario.label}
            </Button>
          </motion.div>

          {/* Linha de confiança */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {hero.confianca.map((c) => (
              <li key={c} className="flex items-center gap-2 text-xs font-semibold text-white/60 sm:text-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-vosz-verde" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 12 5 5L20 7" />
                </svg>
                {c}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Quadro cinematográfico */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={reduce ? undefined : { y: cenaY, opacity: cenaOpacity }}
          className="lg:-ml-8"
        >
          <QuadroCinema reduce={reduce} />
        </motion.div>
      </Container>

      {/* linha-síntese discreta no rodapé do hero */}
      <div className="relative border-t border-white/[0.08]">
        <Container className="py-4">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/40 sm:text-sm">
            Assistência social · Contraturno socioeducativo · Cuidado integral —{" "}
            <span className="text-white/70">Cambuci, São Paulo</span>
          </p>
        </Container>
      </div>
    </section>
  );
}
