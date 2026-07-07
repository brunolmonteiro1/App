"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Button from "../ui/Button";
import { Container } from "../ui/Section";
import { hero } from "@/lib/content";

// Momento visual #1 — Hero cinematográfico.
// Cena escura em roxo profundo com colagem de fotos reais do Vosz flutuando em
// perspectiva. O mouse desloca as camadas (parallax 3D leve); o scroll aprofunda
// a cena. Fotos: material oficial do manual da marca. Respeita reduced-motion.

// Cartões da colagem: foto real + rótulo + posição/profundidade na cena.
const cartoes = [
  {
    src: "/fotos/estudo.jpg",
    alt: "Crianças escrevendo juntas durante atividade no contraturno",
    label: "Ensino personalizado",
    className: "left-0 top-[4%] w-[42%] rotate-[-5deg]",
    depth: 22,
    delay: 0.15,
  },
  {
    src: "/fotos/bale.jpg",
    alt: "Meninas praticando balé no Instituto Vosz",
    label: "Arte e cultura",
    className: "right-0 top-0 w-[36%] rotate-[4deg]",
    depth: 42,
    delay: 0.3,
  },
  {
    src: "/fotos/criatividade.jpg",
    alt: "Criança mostrando um origami amarelo",
    label: "Criatividade",
    className: "bottom-0 left-[6%] w-[34%] rotate-[3deg]",
    depth: 60,
    delay: 0.45,
  },
  {
    src: "/fotos/refeicao.jpg",
    alt: "Crianças fazendo refeição juntas no Instituto",
    label: "Alimentação",
    className: "bottom-[6%] right-[2%] w-[44%] rotate-[-3deg]",
    depth: 34,
    delay: 0.6,
  },
];

function Colagem() {
  const reduce = useReducedMotion();
  const areaRef = useRef(null);

  // Parallax guiado pelo mouse (suavizado com spring).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const onMove = (e) => {
    if (reduce || !areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div
      ref={areaRef}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative mx-auto aspect-[10/11] w-full max-w-xl [perspective:1200px]"
    >
      {/* aura de luz atrás da cena */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vosz-rosa/25 blur-[100px]"
      />

      {cartoes.map((c) => (
        <CartaoFoto key={c.src} {...c} sx={sx} sy={sy} reduce={reduce} />
      ))}

      {/* selo do símbolo no centro da composição */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_20px_60px_-15px_rgba(255,0,167,0.5)] sm:h-28 sm:w-28"
      >
        <Image src="/simbolo-vosz.png" alt="" width={80} height={80} priority className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" aria-hidden />
      </motion.div>
    </div>
  );
}

function CartaoFoto({ src, alt, label, className, depth, delay, sx, sy, reduce }) {
  // Quanto maior a profundidade, maior o deslocamento — sensação de camadas 3D.
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  const rx = useTransform(sy, (v) => v * -6);
  const ry = useTransform(sx, (v) => v * 8);

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={reduce ? undefined : { x, y, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={`absolute z-10 ${className}`}
    >
      <figure className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <Image
          src={src}
          alt={alt}
          width={480}
          height={560}
          priority
          className="h-auto w-full object-cover"
          sizes="(min-width: 1024px) 280px, 45vw"
        />
        <figcaption className="absolute bottom-2 left-2 rounded-full bg-vosz-roxo-escuro/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:text-xs">
          {label}
        </figcaption>
      </figure>
    </motion.div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const secRef = useRef(null);

  // O scroll afasta suavemente a cena (profundidade cinematográfica).
  const { scrollYProgress } = useScroll({
    target: secRef,
    offset: ["start start", "end start"],
  });
  const cenaY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const cenaOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);

  return (
    <section
      ref={secRef}
      className="grain relative -mt-16 overflow-hidden bg-[#160040] sm:-mt-20"
    >
      {/* iluminação da cena */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-vosz-roxo/50 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-vosz-rosa/20 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#160040] to-transparent" />
      </div>

      {/* grafismo gigante como marca d'água */}
      <Image
        src="/simbolo-vosz.png"
        alt=""
        aria-hidden
        width={900}
        height={1020}
        className="pointer-events-none absolute -right-48 -top-48 w-[44rem] opacity-[0.05]"
      />

      <Container className="relative grid min-h-[96svh] items-center gap-14 pb-20 pt-28 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24">
        {/* Texto */}
        <motion.div style={reduce ? undefined : { y: cenaY, opacity: cenaOpacity }}>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-vosz-verde" />
            {hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 text-[2.5rem] font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem] xl:text-[4rem]"
          >
            A escola ensina.
            <br />
            <span className="text-gradient-quente">
              Mas quem cuida do que impede a criança de aprender?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-white/70"
          >
            {hero.subtitulo}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button href={hero.ctaPrimario.href} variant="rosa" size="lg">
              {hero.ctaPrimario.label}
            </Button>
            <Button href={hero.ctaSecundario.href} variant="fantasmaBranco" size="lg">
              {hero.ctaSecundario.label}
            </Button>
          </motion.div>
        </motion.div>

        {/* Colagem 3D de fotos reais */}
        <motion.div style={reduce ? undefined : { y: cenaY, opacity: cenaOpacity }}>
          <Colagem />
        </motion.div>
      </Container>

      {/* Marquee das camadas de cuidado */}
      <div className="relative border-t border-white/10 bg-white/[0.04] py-4 backdrop-blur-sm">
        {/* Lista estática acessível para leitores de tela */}
        <p className="sr-only">
          Camadas de cuidado: {hero.camadas.join(", ")}.
        </p>
        <div aria-hidden className="marquee-track">
          {[0, 1].map((rep) => (
            <div key={rep} className="flex shrink-0 items-center">
              {hero.camadas.map((c) => (
                <span
                  key={`${rep}-${c}`}
                  className="mx-6 flex items-center gap-3 whitespace-nowrap text-sm font-bold uppercase tracking-[0.2em] text-white/60"
                >
                  <span className="text-vosz-rosa">✦</span> {c}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
