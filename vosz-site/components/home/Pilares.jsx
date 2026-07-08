"use client";

import { useRef, useState } from "react";
import { Container, Section, SectionHeading } from "../ui/Section";
import { IconCard } from "../ui/Card";
import Button from "../ui/Button";
import { pilares } from "@/lib/content";

const accents = ["roxo", "rosa", "azul", "verde", "amarelo", "rosa", "roxo", "verde"];

function SetaBtn({ direcao, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direcao === "prev" ? "Pilares anteriores" : "Próximos pilares"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-vosz-roxo/20 bg-white text-vosz-roxo shadow-soft transition-all hover:border-vosz-roxo hover:bg-vosz-roxo hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-vosz-roxo/20 disabled:hover:bg-white disabled:hover:text-vosz-roxo"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-5 w-5 ${direcao === "prev" ? "rotate-180" : ""}`}
        aria-hidden
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}

export default function Pilares() {
  const trilhoRef = useRef(null);
  const [pos, setPos] = useState({ inicio: true, fim: false });

  // Habilita/desabilita as setas conforme a posição do scroll.
  const onScroll = () => {
    const el = trilhoRef.current;
    if (!el) return;
    setPos({
      inicio: el.scrollLeft <= 8,
      fim: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  };

  const rolar = (dir) => {
    const el = trilhoRef.current;
    if (!el) return;
    // avança aproximadamente um card por clique
    const card = el.querySelector("li");
    const passo = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "next" ? passo : -passo, behavior: "smooth" });
  };

  return (
    <Section id="pilares" className="relative overflow-hidden bg-cream">
      <span aria-hidden className="num-editorial pointer-events-none absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
        03
      </span>
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow={pilares.eyebrow} titulo={pilares.titulo} subtitulo={pilares.subtitulo} />
          <div className="flex shrink-0 items-center gap-2.5">
            <SetaBtn direcao="prev" onClick={() => rolar("prev")} disabled={pos.inicio} />
            <SetaBtn direcao="next" onClick={() => rolar("next")} disabled={pos.fim} />
          </div>
        </div>
      </Container>

      {/* Trilho do carrossel — sangra até a borda da tela à direita */}
      <div className="relative mt-12">
        <Container>
          <ul
            ref={trilhoRef}
            onScroll={onScroll}
            aria-label="Pilares de atuação do Instituto Vosz"
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pilares.itens.map((p, i) => (
              <li
                key={p.id}
                className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%]"
              >
                <IconCard
                  icon={p.icon}
                  titulo={p.titulo}
                  texto={p.texto}
                  accent={accents[i % accents.length]}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <Container className="relative mt-6 flex flex-col items-center gap-5">
        {/* dica de arrastar no mobile */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40 sm:hidden">
          Arraste para ver mais →
        </p>
        <Button href="/o-que-fazemos" variant="contorno" size="md">
          Conheça tudo que fazemos
        </Button>
      </Container>
    </Section>
  );
}
