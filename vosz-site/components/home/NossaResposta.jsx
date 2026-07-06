import { Container, Section, SectionHeading } from "../ui/Section";
import Grafismo from "../ui/Grafismo";
import { resposta } from "@/lib/content";

export default function NossaResposta() {
  return (
    <Section id="resposta" className="bg-cream">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
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

        {/* Frase de impacto num "balão" da marca */}
        <div className="relative">
          <Grafismo className="absolute -right-3 -top-3 h-14 w-14 opacity-80" color="amarelo" />
          <blockquote className="relative rounded-[2rem] rounded-bl-md bg-vosz-roxo p-8 text-white shadow-soft-lg sm:p-10">
            <p className="text-2xl font-extrabold leading-snug sm:text-3xl">
              &ldquo;{resposta.frase}&rdquo;
            </p>
            <footer className="mt-5 text-sm font-semibold text-vosz-amarelo">Instituto Vosz</footer>
          </blockquote>
        </div>
      </Container>
    </Section>
  );
}
