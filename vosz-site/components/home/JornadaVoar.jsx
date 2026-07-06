"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import { voar } from "@/lib/content";

// Momento visual #2 — Jornada VOAR interativa.
// Desktop: hover/foco nas letras revela o detalhe. Mobile: toque abre o card.
const corMap = {
  roxo: { bg: "bg-vosz-roxo", text: "text-vosz-roxo", ring: "ring-vosz-roxo", soft: "bg-vosz-roxo/10" },
  rosa: { bg: "bg-vosz-rosa", text: "text-vosz-rosa", ring: "ring-vosz-rosa", soft: "bg-vosz-rosa/10" },
  azul: { bg: "bg-[#00989a]", text: "text-[#00989a]", ring: "ring-[#00989a]", soft: "bg-vosz-azul/15" },
  verde: { bg: "bg-[#0f9d63]", text: "text-[#0f9d63]", ring: "ring-[#0f9d63]", soft: "bg-vosz-verde/20" },
};

export default function JornadaVoar() {
  const [ativo, setAtivo] = useState(0);
  const reduce = useReducedMotion();
  const etapa = voar.etapas[ativo];
  const cor = corMap[etapa.cor];

  return (
    <Section id="voar" dark className="overflow-hidden">
      {/* textura de fundo */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-vosz-rosa/20 blur-3xl" />
      <Container className="relative">
        <SectionHeading eyebrow={voar.eyebrow} titulo={voar.titulo} subtitulo={voar.subtitulo} dark center />

        {/* Seletor de letras */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {voar.etapas.map((e, i) => {
            const c = corMap[e.cor];
            const selecionado = i === ativo;
            return (
              <button
                key={e.letra}
                type="button"
                onMouseEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onClick={() => setAtivo(i)}
                aria-pressed={selecionado}
                className={`group relative rounded-3xl p-5 text-left transition-all duration-200 ${
                  selecionado ? `${c.bg} shadow-soft-lg` : "bg-white/10 hover:bg-white/[0.16]"
                }`}
              >
                <span className={`block text-5xl font-black leading-none ${selecionado ? "text-white" : "text-white/85"}`}>
                  {e.letra}
                </span>
                <span className={`mt-2 block text-sm font-bold ${selecionado ? "text-white" : "text-vosz-amarelo"}`}>
                  {e.nome}
                </span>
              </button>
            );
          })}
        </div>

        {/* Painel de detalhe */}
        <div className="mt-4 min-h-[8.5rem] rounded-3xl bg-white p-6 shadow-soft-lg sm:mt-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={ativo}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6"
            >
              <span className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${cor.soft} text-2xl font-black ${cor.text}`}>
                {etapa.letra}
              </span>
              <div>
                <h3 className={`text-xl font-extrabold ${cor.text}`}>{etapa.nome}</h3>
                <p className="mt-2 text-[1.02rem] leading-relaxed text-ink/75">{etapa.detalhe}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </Section>
  );
}
