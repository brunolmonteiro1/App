"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import Icon from "../ui/Icon";
import Grafismo from "../ui/Grafismo";
import { jornadaBeneficiario } from "@/lib/content";

// Jornada do Beneficiário — stepper imersivo.
// Desktop: painel sticky à esquerda reage à etapa em leitura (scroll-spy);
// as etapas rolam à direita. Mobile: cards ricos com linha condutora.

const visual = [
  { icon: "search", cor: "#4200ac", nome: "roxo" },
  { icon: "book", cor: "#ff00a7", nome: "rosa" },
  { icon: "handshake", cor: "#00989a", nome: "azul" },
  { icon: "calendar", cor: "#0f9d63", nome: "verde" },
  { icon: "sprout", cor: "#ff00a7", nome: "rosa" },
];

function PainelSticky({ ativo, reduce }) {
  const etapa = jornadaBeneficiario.etapas[ativo];
  const v = visual[ativo];

  return (
    <div className="grain relative overflow-hidden rounded-[2.5rem] bg-[#160040] p-8 shadow-soft-lg sm:p-10">
      {/* iluminação */}
      <div
        aria-hidden
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[90px] transition-colors duration-700"
        style={{ backgroundColor: `${v.cor}55` }}
      />
      <Grafismo className="absolute -bottom-4 -right-4 h-24 w-24 opacity-15" color="branco" />

      <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-white/50">
        Etapa {String(ativo + 1).padStart(2, "0")} de {String(jornadaBeneficiario.etapas.length).padStart(2, "0")}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={ativo}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <p
            aria-hidden
            className="mt-4 text-[7rem] font-black leading-[0.85] tracking-tighter text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.25)] sm:text-[9rem]"
          >
            {String(ativo + 1).padStart(2, "0")}
          </p>

          <span
            className="mt-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-soft"
            style={{ backgroundColor: v.cor }}
          >
            <Icon name={v.icon} className="h-7 w-7" />
          </span>

          <h3 className="mt-5 text-2xl font-extrabold text-white sm:text-[1.7rem]">{etapa.titulo}</h3>
          <p className="mt-3 leading-relaxed text-white/70">{etapa.texto}</p>
        </motion.div>
      </AnimatePresence>

      {/* progresso */}
      <div className="relative mt-8 flex gap-2" role="presentation">
        {jornadaBeneficiario.etapas.map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-500"
            style={{ backgroundColor: i <= ativo ? visual[i].cor : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function JornadaBeneficiario({ numero = null }) {
  const [ativo, setAtivo] = useState(0);
  const reduce = useReducedMotion();

  return (
    // Sem overflow-hidden na Section: quebraria o position:sticky do painel.
    <Section id="jornada" className="relative bg-white">
      {numero && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="num-editorial absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
            {numero}
          </span>
        </div>
      )}
      <Container className="relative">
        <SectionHeading
          eyebrow={jornadaBeneficiario.eyebrow}
          titulo={jornadaBeneficiario.titulo}
          subtitulo={jornadaBeneficiario.subtitulo}
        />

        {/* ===== Desktop: sticky + scroll-spy ===== */}
        <div className="mt-16 hidden gap-14 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative">
            <div className="sticky top-28">
              <PainelSticky ativo={ativo} reduce={reduce} />
            </div>
          </div>

          <ol className="relative">
            {/* linha condutora */}
            <div aria-hidden className="absolute bottom-10 left-[27px] top-10 w-0.5 bg-gradient-to-b from-vosz-roxo via-vosz-rosa to-vosz-verde opacity-25" />
            {jornadaBeneficiario.etapas.map((e, i) => {
              const v = visual[i];
              const atual = i === ativo;
              return (
                <motion.li
                  key={e.titulo}
                  onViewportEnter={() => setAtivo(i)}
                  viewport={{ amount: 0.6, margin: "-15% 0px -15% 0px" }}
                  className="relative flex min-h-[19rem] items-center gap-8 py-6"
                >
                  <span
                    className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-soft transition-all duration-500"
                    style={{
                      backgroundColor: atual ? v.cor : "#ffffff",
                      color: atual ? "#ffffff" : v.cor,
                      boxShadow: atual ? `0 16px 40px -12px ${v.cor}99` : "0 4px 14px -6px rgba(0,0,0,0.15)",
                      transform: atual ? "scale(1.12)" : "scale(1)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`flex-1 rounded-3xl border p-7 transition-all duration-500 ${
                      atual
                        ? "border-transparent bg-cream shadow-soft-lg"
                        : "border-black/[0.05] bg-white opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: v.cor }}
                      >
                        <Icon name={v.icon} className="h-4 w-4" />
                      </span>
                      <h3 className="text-xl font-extrabold text-vosz-roxo-escuro">{e.titulo}</h3>
                    </div>
                    <p className="mt-3 leading-relaxed text-ink/70">{e.texto}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* ===== Mobile/tablet: cards ricos com linha condutora ===== */}
        <ol className="relative mt-12 space-y-6 lg:hidden">
          <div aria-hidden className="absolute bottom-10 left-[23px] top-6 w-0.5 bg-gradient-to-b from-vosz-roxo via-vosz-rosa to-vosz-verde opacity-25" />
          {jornadaBeneficiario.etapas.map((e, i) => {
            const v = visual[i];
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
                  style={{ backgroundColor: v.cor }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 rounded-3xl border border-black/[0.05] bg-cream p-5 shadow-soft">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: v.cor }}
                    >
                      <Icon name={v.icon} className="h-4 w-4" />
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
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-12 max-w-2xl rounded-full bg-gradient-to-r from-vosz-roxo via-vosz-rosa to-vosz-rosa p-[2px] lg:mt-16"
        >
          <div className="flex flex-col items-center gap-2 rounded-full bg-white px-8 py-5 text-center sm:flex-row sm:justify-center sm:gap-3">
            <span aria-hidden className="text-xl">🎯</span>
            <p className="text-base font-extrabold text-vosz-roxo-escuro sm:text-lg">
              Destino da jornada: <span className="text-gradient-vosz">a autonomia da família</span>
            </p>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
