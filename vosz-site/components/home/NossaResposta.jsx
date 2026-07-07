import Image from "next/image";
import { Container, Section, SectionHeading } from "../ui/Section";
import Grafismo from "../ui/Grafismo";
import Reveal from "../ui/Reveal";
import { resposta } from "@/lib/content";

// Cena editorial: foto real do Vosz com moldura da marca + conteúdo + pull-quote.
export default function NossaResposta() {
  return (
    <Section id="resposta" className="overflow-hidden bg-cream">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          {/* Foto real com camadas de moldura */}
          <Reveal>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div aria-hidden className="absolute -left-5 -top-5 h-full w-full rounded-[2.5rem] bg-vosz-amarelo/70" />
              <div aria-hidden className="absolute -right-4 -bottom-4 h-full w-full rounded-[2.5rem] bg-vosz-rosa/20" />
              <figure className="relative overflow-hidden rounded-[2.5rem] shadow-soft-lg">
                <Image
                  src="/fotos/comunidade.jpg"
                  alt="Educadora e crianças em atividade no Instituto Vosz"
                  width={598}
                  height={814}
                  className="h-[26rem] w-full object-cover sm:h-[30rem]"
                  sizes="(min-width: 1024px) 480px, 90vw"
                />
                {/* véu da marca para unidade visual */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-vosz-roxo-escuro/50 via-transparent to-transparent" />
                <figcaption className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
                  Convivência, rotina e adultos atentos — todos os dias, no contraturno.
                </figcaption>
              </figure>
              <Grafismo className="absolute -right-6 -top-6 h-16 w-16" color="rosa" />
            </div>
          </Reveal>

          {/* Conteúdo */}
          <div>
            <SectionHeading eyebrow={resposta.eyebrow} titulo={resposta.titulo} subtitulo={resposta.texto} />
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
              {resposta.destaques.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-vosz-roxo-escuro">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-vosz-verde/25">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#0f9d63]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </Container>
    </Section>
  );
}
