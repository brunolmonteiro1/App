"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import { jornadaBeneficiario } from "@/lib/content";

// Jornada do Beneficiário — o caminho real de uma família dentro do Vosz.
// Caminho numerado com linha condutora (inspirado na apresentação institucional).
const cores = ["bg-vosz-roxo", "bg-vosz-rosa", "bg-[#00989a]", "bg-[#0f9d63]", "bg-vosz-roxo-escuro"];

export default function JornadaBeneficiario({ numero = null }) {
  const reduce = useReducedMotion();

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

        <ol className="relative mt-14 grid gap-8 sm:gap-10">
          {/* linha condutora vertical */}
          <div
            aria-hidden
            className="absolute bottom-8 left-6 top-2 w-0.5 bg-gradient-to-b from-vosz-roxo via-vosz-rosa to-vosz-verde opacity-30 sm:left-7"
          />
          {jornadaBeneficiario.etapas.map((e, i) => (
            <motion.li
              key={e.titulo}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-5 sm:gap-7"
            >
              <span
                className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cores[i % cores.length]} text-lg font-black text-white shadow-soft sm:h-14 sm:w-14`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                className={`flex-1 rounded-3xl border border-black/[0.05] bg-cream p-5 shadow-soft sm:p-6 ${
                  i % 2 === 1 ? "sm:ml-10" : ""
                }`}
              >
                <h3 className="text-lg font-extrabold text-vosz-roxo-escuro">{e.titulo}</h3>
                <p className="mt-1.5 leading-relaxed text-ink/70">{e.texto}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
