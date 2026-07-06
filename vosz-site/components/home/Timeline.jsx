import { Container, Section, SectionHeading } from "../ui/Section";
import Reveal from "../ui/Reveal";
import { timeline } from "@/lib/content";

// Timeline reutilizável (usada na Home e na página Nossa História).
export function TimelineList({ itens }) {
  return (
    <ol className="relative mt-12 space-y-8 border-l-2 border-vosz-roxo/15 pl-6 sm:pl-8">
      {itens.map((t, i) => (
        <Reveal as="li" key={`${t.ano}-${t.titulo}`} delay={i * 0.05} className="relative">
          <span className="absolute -left-[calc(1.5rem+7px)] top-1.5 h-3.5 w-3.5 rounded-full bg-vosz-rosa ring-4 ring-vosz-rosa/15 sm:-left-[calc(2rem+7px)]" />
          <span className="inline-block rounded-full bg-vosz-roxo/10 px-3 py-1 text-sm font-extrabold text-vosz-roxo">
            {t.ano}
          </span>
          <h3 className="mt-3 text-xl font-bold text-vosz-roxo-escuro">{t.titulo}</h3>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-ink/70">{t.texto}</p>
        </Reveal>
      ))}
    </ol>
  );
}

export default function Timeline() {
  return (
    <Section id="historia" className="bg-cream">
      <Container>
        <SectionHeading eyebrow={timeline.eyebrow} titulo={timeline.titulo} />
        <TimelineList itens={timeline.itens} />
      </Container>
    </Section>
  );
}
