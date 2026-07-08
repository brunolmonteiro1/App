"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Container, Section, SectionHeading } from "../ui/Section";
import Button from "../ui/Button";
import { timeline } from "@/lib/content";

// Nossa História como storytelling: linha que se preenche com o scroll,
// anos em escala display, fotos reais em estilo polaroid alternando lados.

// Mídia de cada marco (chave = "ano-título" para não colidir nos dois 2020).
const midia = {
  "2017-Cultivar": { tipo: "foto", src: "/fotos/muaythai.jpg", alt: "Crianças em aula de artes marciais no projeto Cultivar", rot: "-rotate-2" },
  "2020-Pandemia": { tipo: "foto", src: "/fotos/refeicao.jpg", alt: "Crianças fazendo refeição juntas", rot: "rotate-2" },
  "2020-Instituto Vosz": { tipo: "marca" },
  "2022-Nova sede": { tipo: "foto", src: "/fotos/danca.jpg", alt: "Ensaio de dança na sede do Instituto", rot: "-rotate-1" },
  "Hoje-Ecossistema de cuidado": { tipo: "foto", src: "/fotos/coral.jpg", alt: "Crianças com camisetas do Vosz cantando juntas", rot: "rotate-2" },
};

const coresDot = ["bg-vosz-roxo", "bg-vosz-rosa", "bg-[#00989a]", "bg-[#0f9d63]", "bg-vosz-rosa", "bg-vosz-roxo"];

function Polaroid({ src, alt, rot }) {
  return (
    <figure className={`mx-auto w-full max-w-sm ${rot} rounded-2xl bg-white p-3 pb-10 shadow-soft-lg transition-transform duration-500 hover:rotate-0 hover:scale-[1.03]`}>
      <Image
        src={src}
        alt={alt}
        width={640}
        height={480}
        className="h-56 w-full rounded-xl object-cover sm:h-64"
        sizes="(min-width: 1024px) 380px, 85vw"
      />
    </figure>
  );
}

function MarcaTile() {
  return (
    <div className="mx-auto flex w-full max-w-sm rotate-1 items-center justify-center rounded-2xl bg-gradient-to-br from-vosz-roxo to-vosz-roxo-escuro p-10 shadow-soft-lg transition-transform duration-500 hover:rotate-0">
      <Image src="/logo-vosz-branco.png" alt="Nasce o Instituto Vosz" width={1400} height={550} className="h-14 w-auto sm:h-16" />
    </div>
  );
}

function Marco({ item, index, total }) {
  const reduce = useReducedMotion();
  const m = midia[`${item.ano}-${item.titulo}`];
  const invertido = index % 2 === 1;
  const ultimo = index === total - 1;

  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative grid gap-6 pl-12 sm:pl-16 lg:grid-cols-2 lg:gap-16 lg:pl-0"
    >
      {/* ponto na linha */}
      <span
        aria-hidden
        className={`absolute left-[7px] top-2 z-10 h-5 w-5 rounded-full ${coresDot[index % coresDot.length]} ring-4 ring-cream sm:left-[15px] lg:left-1/2 lg:-translate-x-1/2`}
      />

      {/* Texto */}
      <div className={`${invertido ? "lg:order-2 lg:pl-16" : "lg:pr-16 lg:text-right"}`}>
        <p
          aria-hidden
          className={`num-editorial text-[4rem] sm:text-[5rem] ${ultimo ? "!text-transparent bg-gradient-to-r from-vosz-roxo to-vosz-rosa bg-clip-text [-webkit-text-stroke:0px]" : ""}`}
        >
          {item.ano}
        </p>
        <span className="sr-only">{item.ano}</span>
        <h3 className="mt-2 text-2xl font-extrabold text-vosz-roxo-escuro">{item.titulo}</h3>
        <p className={`mt-2 leading-relaxed text-ink/70 ${invertido ? "" : "lg:ml-auto"} max-w-md`}>{item.texto}</p>
      </div>

      {/* Mídia */}
      <div className={`${invertido ? "lg:order-1 lg:pr-16" : "lg:pl-16"} ${m ? "" : "hidden lg:block"}`}>
        {m?.tipo === "foto" && <Polaroid src={m.src} alt={m.alt} rot={m.rot} />}
        {m?.tipo === "marca" && <MarcaTile />}
      </div>
    </motion.li>
  );
}

// Timeline reutilizável (usada na Home e na página Nossa História).
export function TimelineList({ itens }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // A linha central "se desenha" conforme o usuário percorre a história.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.7"],
  });
  const progresso = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <div ref={ref} className="relative mt-16">
      {/* trilho da linha */}
      <div aria-hidden className="absolute bottom-4 left-[16px] top-2 w-[3px] rounded-full bg-vosz-roxo/10 sm:left-[24px] lg:left-1/2 lg:-translate-x-1/2" />
      {/* linha que se preenche */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { scaleY: progresso }}
        className="absolute bottom-4 left-[16px] top-2 w-[3px] origin-top rounded-full bg-gradient-to-b from-vosz-roxo via-vosz-rosa to-vosz-verde lg:left-1/2 lg:-translate-x-1/2 sm:left-[24px]"
      />

      <ol className="space-y-16 sm:space-y-20">
        {itens.map((t, i) => (
          <Marco key={`${t.ano}-${t.titulo}`} item={t} index={i} total={itens.length} />
        ))}
      </ol>
    </div>
  );
}

export default function Timeline() {
  return (
    <Section id="historia" className="relative overflow-hidden bg-cream">
      <span aria-hidden className="num-editorial pointer-events-none absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
        04
      </span>
      <Container className="relative">
        <SectionHeading eyebrow={timeline.eyebrow} titulo={timeline.titulo} center />
        <TimelineList itens={timeline.curta} />
        <div className="mt-12 text-center">
          <Button href="/quem-somos#historia" variant="contorno" size="md">
            Conheça nossa história
          </Button>
        </div>
      </Container>
    </Section>
  );
}
