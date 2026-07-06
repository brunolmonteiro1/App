import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { quemSomos } from "@/lib/content";

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

      <Section className="bg-white">
        <Container className="rounded-4xl bg-vosz-roxo p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-2xl text-2xl text-white sm:text-3xl">
            Conheça a metodologia que organiza o nosso cuidado
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/metodologia" variant="branco" size="md">
              Jornada VOAR
            </Button>
            <Button href="/nossa-historia" variant="fantasmaBranco" size="md">
              Nossa história
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
