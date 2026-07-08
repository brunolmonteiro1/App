import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { TimelineList } from "@/components/home/Timeline";
import { quemSomos, missaoVisao, valores, timeline } from "@/lib/content";

export const metadata = {
  title: "Quem Somos",
  description:
    "O Instituto Vosz é uma OSC cristã de assistência social no Cambuci/SP. Conheça nossa origem no projeto Cultivar, nossa confessionalidade e nosso território de atuação.",
  alternates: { canonical: "/quem-somos" },
};

export default function QuemSomosPage() {
  return (
    <>
      <PageHero eyebrow="Quem somos" titulo={quemSomos.titulo} intro={quemSomos.intro} />
      <Section className="bg-cream">
        <Container className="grid gap-6 md:grid-cols-2">
          {quemSomos.blocos.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 0.05}>
              <div className="h-full rounded-3xl border border-black/[0.06] bg-white p-7 shadow-soft">
                <h2 className="text-xl font-bold text-vosz-roxo-escuro">{b.titulo}</h2>
                <p className="mt-3 leading-relaxed text-ink/70">{b.texto}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </Section>

      {/* Versículo que dá nome ao Vosz */}
      <Section className="grain relative overflow-hidden bg-vosz-roxo-escuro">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-vosz-rosa/20 blur-[100px]" />
        <Container className="relative text-center">
          <blockquote className="mx-auto max-w-3xl">
            <p className="text-2xl font-extrabold leading-snug text-white sm:text-3xl">
              &ldquo;{missaoVisao.versiculo}&rdquo;
            </p>
            <footer className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-vosz-amarelo">
              {missaoVisao.versiculoRef}
            </footer>
          </blockquote>
        </Container>
      </Section>

      {/* Missão, Visão e Alvo */}
      <Section className="bg-cream">
        <Container className="grid gap-4 md:grid-cols-3">
          {[
            { titulo: "Missão", texto: missaoVisao.missao, cor: "text-vosz-roxo" },
            { titulo: "Visão", texto: missaoVisao.visao, cor: "text-vosz-rosa" },
            { titulo: "Alvo", texto: missaoVisao.alvo, cor: "text-[#0f9d63]" },
          ].map((m, i) => (
            <Reveal key={m.titulo} delay={i * 0.06}>
              <div className="h-full rounded-3xl border border-black/[0.06] bg-white p-7 shadow-soft">
                <h2 className={`text-sm font-bold uppercase tracking-[0.2em] ${m.cor}`}>{m.titulo}</h2>
                <p className="mt-3 leading-relaxed text-ink/70">{m.texto}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </Section>

      {/* Valores */}
      <Section className="bg-white">
        <Container>
          <SectionHeading eyebrow="Valores" titulo="O que nos guia" center />
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {valores.map((v) => (
              <li key={v} className="rounded-full border-2 border-vosz-roxo/15 bg-cream px-5 py-2 text-sm font-bold text-vosz-roxo-escuro">
                {v}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* História completa */}
      <Section id="historia" className="scroll-mt-20 bg-cream">
        <Container>
          <SectionHeading eyebrow="Nossa história" titulo={timeline.titulo} center />
          <TimelineList itens={timeline.itens} />
        </Container>
      </Section>

      {/* Equipe e liderança */}
      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="Equipe e liderança"
            titulo="Pessoas que fazem o cuidado acontecer"
            subtitulo="Educadores, equipe técnica, voluntários e liderança comprometidos com a missão. Perfis completos da diretoria e do conselho serão publicados nesta página."
            center
          />
        </Container>
      </Section>

      <Section className="bg-cream">
        <Container className="rounded-4xl bg-vosz-roxo p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-2xl text-2xl text-white sm:text-3xl">
            Apoie essa missão
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/apoie" variant="branco" size="md">
              Quero Doar
            </Button>
            <Button href="/metodologia" variant="fantasmaBranco" size="md">
              Conheça a metodologia
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
