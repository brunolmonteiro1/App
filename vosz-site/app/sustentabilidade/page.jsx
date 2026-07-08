import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import Sustentabilidade from "@/components/home/Sustentabilidade";
import { sustentabilidadePagina } from "@/lib/content";

export const metadata = {
  title: "Sustentabilidade",
  description:
    "A receita serve ao cuidado. A gestão serve à missão. Atendimento gratuito, negócios sociais e reinvestimento integral no Instituto Vosz.",
  alternates: { canonical: "/sustentabilidade" },
};

export default function SustentabilidadePage() {
  return (
    <>
      <PageHero
        eyebrow="Sustentabilidade"
        titulo={sustentabilidadePagina.titulo}
        intro={sustentabilidadePagina.intro}
      />

      <Section className="bg-cream">
        <Container className="grid gap-4 sm:grid-cols-2">
          {sustentabilidadePagina.blocos.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 0.05}>
              <div className="h-full rounded-3xl border border-black/[0.06] bg-white p-7 shadow-soft">
                <h2 className="text-lg font-bold text-vosz-roxo-escuro">{b.titulo}</h2>
                <p className="mt-2 leading-relaxed text-ink/70">{b.texto}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </Section>

      {/* Reaproveita o diagrama animado da home */}
      <Sustentabilidade />

      <Section className="bg-white">
        <Container className="text-center">
          <h2 className="mx-auto max-w-2xl text-2xl sm:text-3xl">
            Sua empresa pode ser parte dessa estrutura de cuidado
          </h2>
          <div className="mt-7">
            <Button href="/apoie#empresas" variant="rosa" size="lg">
              Seja empresa parceira
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
