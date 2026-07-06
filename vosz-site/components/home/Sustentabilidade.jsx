"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import Icon from "../ui/Icon";
import Button from "../ui/Button";
import { sustentabilidade } from "@/lib/content";

// Momento visual #3 — Diagrama de sustentabilidade.
// Frentes -> atendimento gratuito -> reinvestimento integral (ciclo).
export default function Sustentabilidade() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <Section id="sustentabilidade" dark className="overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-vosz-verde/15 blur-3xl" />
      <Container className="relative">
        <SectionHeading
          eyebrow={sustentabilidade.eyebrow}
          titulo={sustentabilidade.titulo}
          subtitulo={sustentabilidade.texto}
          dark
          center
        />

        {/* Frentes */}
        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {sustentabilidade.frentes.map((f) => (
            <motion.li
              key={f.titulo}
              variants={item}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-vosz-amarelo">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-white">{f.titulo}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Convergência */}
        <div aria-hidden className="mx-auto mt-6 flex justify-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-vosz-amarelo" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </div>

        {/* Nó central */}
        <motion.div
          variants={item}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-2 max-w-2xl rounded-3xl bg-vosz-rosa p-6 text-center shadow-soft-lg sm:p-8"
        >
          <p className="text-lg font-extrabold text-white sm:text-xl">
            {sustentabilidade.cicloConverge}
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/como-apoiar" variant="branco" size="md">
            Apoie essa jornada
          </Button>
          <Button href="/como-apoiar#empresas" variant="fantasmaBranco" size="md">
            Seja empresa parceira
          </Button>
        </div>
      </Container>
    </Section>
  );
}
