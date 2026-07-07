"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import Icon from "../ui/Icon";
import Grafismo from "../ui/Grafismo";
import { jornadaBeneficiario } from "@/lib/content";

// Jornada do Beneficiário — showcase em etapas.
// Desktop: índice enxuto à esquerda (número + título) e um único painel de
// conteúdo à direita; avança sozinho a cada 6s e responde a clique/hover.
// Mobile: cards com linha condutora. Sem duplicação de texto.

const visual = [
  { icon: "search", cor: "#4200ac" },
  { icon: "book", cor: "#ff00a7" },
  { icon: "handshake", cor: "#00989a" },
  { icon: "calendar", cor: "#0f9d63" },
  { icon: "sprout", cor: "#d600a7" },
];

const INTERVALO = 6000;

export default function JornadaBeneficiario({ numero = null }) {
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reduce = useReducedMotion();
  const etapa = jornadaBeneficiario.etapas[ativo];
  const v = visual[ativo];
  const timer = useRef(null);

  // Auto-avanço discreto; pausa no hover/foco e em reduced-motion.
  useEffect(() => {
    if (reduce || pausado) return;
    timer.current = setTimeout(
      () => setAtivo((a) => (a + 1) % jornadaBeneficiario.etapas.length),
      INTERVALO
    );
    return () => clearTimeout(timer.current);
  }, [ativo, pausado, reduce]);

  return (
    <Section id="jornada" className="relative overflow-hidden bg-white">
      {numero && (
        <span aria-hidden className="num-editorial pointer-events-none absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
          {numero}
        </span>
      )}
      <Container className="relative">
        <SectionHeading
          eyebrow={jornadaBeneficiario.eyebrow}
          titulo={jornadaBeneficiario.titulo}
          subtitulo={jornadaBeneficiario.subtitulo}
        />

        {/* ===== Desktop: índice + painel único ===== */}
        <div
          className="mt-14 hidden overflow-hidden rounded-[2.5rem] border border-black/[0.05] bg-cream shadow-soft lg:grid lg:grid-cols-[0.9fr_1.1fr]"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          {/* Índice */}
          <ol className="flex flex-col justify-center gap-1 p-8" role="tablist" aria-label="Etapas da jornada">
            {jornadaBeneficiario.etapas.map((e, i) => {
              const sel = i === ativo;
              const vi = visual[i];
              return (
                <li key={e.titulo}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    onClick={() => setAtivo(i)}
                    onFocus={() => setPausado(true)}
                    onBlur={() => setPausado(false)}
                    className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all duration-300 ${
                      sel ? "bg-white shadow-soft" : "hover:bg-white/60"
                    }`}
                  >
                    <span
                      className="text-sm font-black tabular-nums transition-colors duration-300"
                      style={{ color: sel ? vi.cor : "rgba(26,16,48,0.3)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-[1.02rem] font-bold transition-colors duration-300 ${
                        sel ? "text-vosz-roxo-escuro" : "text-ink/45 group-hover:text-ink/70"
                      }`}
                    >
                      {e.titulo}
                    </span>
                    {/* barra de tempo da etapa ativa */}
                    {sel && !reduce && (
                      <motion.span
                        key={`${ativo}-${pausado}`}
                        aria-hidden
                        className="h-1 w-10 overflow-hidden rounded-full bg-black/[0.07]"
                      >
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ backgroundColor: vi.cor }}
                          initial={{ width: "0%" }}
                          animate={{ width: pausado ? "0%" : "100%" }}
                          transition={{ duration: INTERVALO / 1000, ease: "linear" }}
                        />
                      </motion.span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Painel de conteúdo */}
          <div className="grain relative overflow-hidden bg-[#160040] p-10 lg:p-12">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-[100px] transition-colors duration-700"
              style={{ backgroundColor: `${v.cor}66` }}
            />
            <Grafismo className="absolute -bottom-5 -right-5 h-24 w-24 opacity-10" color="branco" />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 bottom-2 text-[11rem] font-black leading-none text-white/[0.05]"
            >
              {String(ativo + 1).padStart(2, "0")}
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={ativo}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-full min-h-[17rem] flex-col justify-center"
              >
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft"
                  style={{ backgroundColor: v.cor }}
                >
                  <Icon name={v.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-[1.65rem] font-extrabold leading-tight text-white">
                  {etapa.titulo}
                </h3>
                <p className="mt-3 max-w-md text-[1.05rem] leading-relaxed text-white/70">
                  {etapa.texto}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ===== Mobile/tablet: cards com linha condutora ===== */}
        <ol className="relative mt-12 space-y-6 lg:hidden">
          <div aria-hidden className="absolute bottom-10 left-[23px] top-6 w-0.5 bg-gradient-to-b from-vosz-roxo via-vosz-rosa to-vosz-verde opacity-25" />
          {jornadaBeneficiario.etapas.map((e, i) => {
            const vi = visual[i];
            return (
              <motion.li
                key={e.titulo}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex gap-4"
              >
                <span
                  className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-soft"
                  style={{ backgroundColor: vi.cor }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 rounded-3xl border border-black/[0.05] bg-cream p-5 shadow-soft">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: vi.cor }}
                    >
                      <Icon name={vi.icon} className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-extrabold leading-snug text-vosz-roxo-escuro">{e.titulo}</h3>
                  </div>
                  <p className="mt-2.5 leading-relaxed text-ink/70">{e.texto}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>

        {/* Destino da jornada */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-extrabold text-vosz-roxo-escuro lg:mt-14">
          O destino é um só: <span className="text-gradient-vosz">a autonomia da família.</span>
        </p>
      </Container>
    </Section>
  );
}
