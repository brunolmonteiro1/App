"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import Button from "../ui/Button";
import { voar } from "@/lib/content";

// Momento visual #2 — Jornada VOAR.
// Fundo claro para contraste máximo de leitura. As 4 etapas ficam todas
// visíveis: letra display na cor oficial, nome, descrição completa e setas
// marcando a sequência. Nenhuma interação é necessária para ler o conteúdo.

const cores = ["#4200ac", "#ff00a7", "#00989a", "#0f9d63"];

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

// completa=true (página Metodologia): usa o texto integral e oculta o CTA,
// que seria redundante dentro da própria página.
export default function JornadaVoar({ completa = false }) {
  const reduce = useReducedMotion();

  return (
    <Section id="voar" className="relative overflow-hidden bg-white">
      {/* tinta suave da marca no fundo, sem comprometer contraste */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-vosz-roxo/[0.06] blur-[120px]" />

      <Container className="relative">
        <SectionHeading eyebrow={voar.eyebrow} titulo={voar.titulo} subtitulo={voar.subtitulo} center />

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
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
                {/* Letra + número + seta de sequência */}
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="text-[5rem] font-black leading-none tracking-tight sm:text-[5.5rem]"
                    style={{ color: cor }}
                  >
                    {e.letra}
                  </span>
                  <span aria-hidden className="text-xs font-bold tabular-nums tracking-[0.25em] text-ink/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {!ultima && <Seta className="ml-auto hidden h-6 w-6 text-ink/20 lg:block" />}
                </div>

                {/* traço na cor da etapa */}
                <span aria-hidden className="mt-3 block h-1 w-12 rounded-full" style={{ backgroundColor: cor }} />

                <h3 className="mt-4 text-lg font-extrabold uppercase tracking-wide text-vosz-roxo-escuro">
                  {e.nome}
                </h3>
                <p className="mt-2.5 text-[0.98rem] leading-relaxed text-ink/75">
                  {completa ? e.detalhe : e.resumo}
                </p>
              </motion.li>
            );
          })}
        </ol>

        {!completa && (
          <div className="mt-12 text-center">
            <Button href="/metodologia" variant="contorno" size="md">
              Ver metodologia completa
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
