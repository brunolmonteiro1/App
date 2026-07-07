"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import { voar } from "@/lib/content";

// Momento visual #2 — Jornada VOAR.
// A palavra V·O·A·R em escala display É a interface: letras em contorno,
// a ativa se preenche com a cor da etapa; o detalhe aparece uma única vez
// no painel abaixo. Hover/clique trocam a etapa.

const cores = [
  { letra: "#a78bff", texto: "text-[#6d3dff]", bg: "bg-[#6d3dff]/10" },
  { letra: "#ff00a7", texto: "text-vosz-rosa", bg: "bg-vosz-rosa/10" },
  { letra: "#00e7e9", texto: "text-[#00989a]", bg: "bg-vosz-azul/15" },
  { letra: "#3ffc94", texto: "text-[#0f9d63]", bg: "bg-vosz-verde/20" },
];

export default function JornadaVoar() {
  const [ativo, setAtivo] = useState(0);
  const reduce = useReducedMotion();
  const etapa = voar.etapas[ativo];
  const cor = cores[ativo];

  return (
    <Section id="voar" dark className="grain overflow-hidden">
      {/* iluminação que acompanha a etapa */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[130px] transition-colors duration-700"
        style={{ backgroundColor: `${cores[ativo].letra}2e` }}
      />

      <Container className="relative">
        <SectionHeading eyebrow={voar.eyebrow} titulo={voar.titulo} subtitulo={voar.subtitulo} dark center />

        {/* A palavra VOAR como interface */}
        <div
          role="tablist"
          aria-label="Etapas da metodologia VOAR"
          className="mt-10 flex items-end justify-center gap-2 sm:gap-6 lg:gap-10"
        >
          {voar.etapas.map((e, i) => {
            const sel = i === ativo;
            const c = cores[i];
            return (
              <button
                key={e.letra}
                type="button"
                role="tab"
                aria-selected={sel}
                aria-label={`${e.letra} — ${e.nome}`}
                onMouseEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onClick={() => setAtivo(i)}
                className="group relative select-none outline-none"
              >
                <motion.span
                  animate={
                    reduce
                      ? undefined
                      : { y: sel ? -8 : 0, scale: sel ? 1.04 : 1 }
                  }
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-[4.4rem] font-black leading-none tracking-tight transition-colors duration-500 sm:text-[7rem] lg:text-[9rem]"
                  style={
                    sel
                      ? { color: c.letra }
                      : {
                          color: "transparent",
                          WebkitTextStroke: "2px rgba(255,255,255,0.30)",
                        }
                  }
                >
                  {e.letra}
                </motion.span>
                {/* nome curto sob a letra */}
                <span
                  className={`mt-1 block text-center text-[0.6rem] font-bold uppercase tracking-[0.18em] transition-colors duration-300 sm:text-xs ${
                    sel ? "text-white" : "text-white/35 group-hover:text-white/60"
                  }`}
                >
                  {e.nome}
                </span>
                {/* traço indicador */}
                <span
                  aria-hidden
                  className="mx-auto mt-2 block h-1 rounded-full transition-all duration-500"
                  style={{
                    width: sel ? "2.5rem" : "0.5rem",
                    backgroundColor: sel ? c.letra : "rgba(255,255,255,0.15)",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Painel de detalhe — o conteúdo aparece uma única vez */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="min-h-[9rem] rounded-[2rem] bg-white p-7 shadow-soft-lg sm:p-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={ativo}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className={`text-xl font-extrabold sm:text-2xl ${cor.texto}`}>{etapa.nome}</h3>
                  <span className="text-xs font-bold tabular-nums tracking-[0.2em] text-ink/35">
                    {String(ativo + 1).padStart(2, "0")} / {String(voar.etapas.length).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-ink/75">{etapa.detalhe}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="mt-6 text-center text-sm italic text-white/50">
            Um caminho de transformação — do acolhimento à autonomia.
          </p>
        </div>
      </Container>
    </Section>
  );
}
