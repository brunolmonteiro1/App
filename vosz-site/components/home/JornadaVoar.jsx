"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import { voar } from "@/lib/content";

// Momento visual #2 — Jornada VOAR.
// Didático por padrão: as 4 etapas ficam TODAS visíveis, sem depender de
// hover ou clique. Letras display coloridas + nome + descrição completa,
// com setas marcando a sequência da jornada.

const cores = ["#a78bff", "#ff00a7", "#00e7e9", "#3ffc94"];

function Seta({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function JornadaVoar() {
  const reduce = useReducedMotion();

  return (
    <Section id="voar" dark className="grain overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-vosz-rosa/10 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-vosz-roxo/30 blur-[110px]" />

      <Container className="relative">
        <SectionHeading eyebrow={voar.eyebrow} titulo={voar.titulo} subtitulo={voar.subtitulo} dark center />

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {voar.etapas.map((e, i) => {
            const cor = cores[i];
            const ultima = i === voar.etapas.length - 1;
            return (
              <motion.li
                key={e.letra}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Letra + seta de sequência */}
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="text-[5rem] font-black leading-none tracking-tight sm:text-[5.5rem]"
                    style={{ color: cor }}
                  >
                    {e.letra}
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums tracking-[0.25em] text-white/30"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {!ultima && (
                    <Seta className="ml-auto hidden h-6 w-6 text-white/25 lg:block" />
                  )}
                </div>

                {/* traço na cor da etapa */}
                <span
                  aria-hidden
                  className="mt-3 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: cor }}
                />

                <h3 className="mt-4 text-lg font-extrabold uppercase tracking-wide text-white">
                  {e.nome}
                </h3>
                <p className="mt-2.5 text-[0.98rem] leading-relaxed text-white/80">
                  {e.detalhe}
                </p>
              </motion.li>
            );
          })}
        </ol>

        <p className="mt-14 text-center text-sm italic text-white/50">
          Um caminho de transformação, vivido todos os dias.
        </p>
      </Container>
    </Section>
  );
}
