"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import { voar } from "@/lib/content";

// Momento visual #2 — Jornada VOAR interativa.
// Cada letra é um cartão com tilt 3D real (a superfície acompanha o cursor).
// Desktop: hover/foco revela o detalhe. Mobile: toque seleciona.
const corMap = {
  roxo: { bg: "bg-vosz-roxo", text: "text-vosz-roxo", soft: "bg-vosz-roxo/10", glow: "rgba(66,0,172,0.55)" },
  rosa: { bg: "bg-vosz-rosa", text: "text-vosz-rosa", soft: "bg-vosz-rosa/10", glow: "rgba(255,0,167,0.5)" },
  azul: { bg: "bg-[#00989a]", text: "text-[#00989a]", soft: "bg-vosz-azul/15", glow: "rgba(0,231,233,0.4)" },
  verde: { bg: "bg-[#0f9d63]", text: "text-[#0f9d63]", soft: "bg-vosz-verde/20", glow: "rgba(63,252,148,0.4)" },
};

function CartaoLetra({ etapa, index, selecionado, onSelect, reduce }) {
  const c = corMap[etapa.cor];
  const ref = useRef(null);

  // Tilt 3D: a superfície do cartão inclina seguindo o cursor.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div className="[perspective:800px]">
      <motion.button
        ref={ref}
        type="button"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onMouseEnter={() => onSelect(index)}
        onFocus={() => onSelect(index)}
        onClick={() => onSelect(index)}
        aria-pressed={selecionado}
        style={{
          boxShadow: selecionado ? `0 24px 70px -18px ${c.glow}` : "none",
          ...(reduce ? {} : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }),
        }}
        className={`group relative w-full rounded-3xl p-5 text-left transition-colors duration-200 sm:p-6 ${
          selecionado ? c.bg : "bg-white/[0.07] hover:bg-white/[0.12]"
        }`}
      >
        <span
          style={reduce ? undefined : { transform: "translateZ(30px)" }}
          className={`block text-6xl font-black leading-none sm:text-7xl ${
            selecionado ? "text-white" : "text-white/80"
          }`}
        >
          {etapa.letra}
        </span>
        <span
          style={reduce ? undefined : { transform: "translateZ(20px)" }}
          className={`mt-3 block text-sm font-bold uppercase tracking-wider ${
            selecionado ? "text-white" : "text-vosz-amarelo"
          }`}
        >
          {etapa.nome}
        </span>
      </motion.button>
    </div>
  );
}

export default function JornadaVoar() {
  const [ativo, setAtivo] = useState(0);
  const reduce = useReducedMotion();
  const etapa = voar.etapas[ativo];
  const cor = corMap[etapa.cor];

  return (
    <Section id="voar" dark className="grain overflow-hidden">
      {/* iluminação da cena */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-vosz-rosa/20 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-vosz-roxo/40 blur-[110px]" />

      <Container className="relative">
        <SectionHeading eyebrow={voar.eyebrow} titulo={voar.titulo} subtitulo={voar.subtitulo} dark center />

        {/* Cartões com tilt 3D */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
          {voar.etapas.map((e, i) => (
            <CartaoLetra
              key={e.letra}
              etapa={e}
              index={i}
              selecionado={i === ativo}
              onSelect={setAtivo}
              reduce={reduce}
            />
          ))}
        </div>

        {/* Painel de detalhe */}
        <div className="mt-5 min-h-[8.5rem] rounded-3xl bg-white p-6 shadow-soft-lg sm:mt-7 sm:p-8">
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
