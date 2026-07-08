import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import JornadaVoar from "@/components/home/JornadaVoar";
import JornadaBeneficiario from "@/components/home/JornadaBeneficiario";
import { Card } from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import CtaFinal from "@/components/home/CtaFinal";
import { IconCard } from "@/components/ui/Card";
import { metodologia, pilares } from "@/lib/content";

export const metadata = {
  title: "Metodologia — Jornada VOAR",
  description:
    "A Jornada VOAR de Cuidado e Autonomia integra assistência social, educação complementar, neuropsicologia, arte e tecnologia — do acolhimento à autonomia.",
  alternates: { canonical: "/metodologia" },
};

export default function MetodologiaPage() {
  return (
    <>
      <PageHero eyebrow="Metodologia" titulo={metodologia.titulo} intro={metodologia.intro} />

      <JornadaVoar />

      <JornadaBeneficiario />

      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="Pilares técnicos"
            titulo="O cuidado vira método"
            subtitulo="Práticas que sustentam a Jornada VOAR no dia a dia do Instituto."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metodologia.pilaresTecnicos.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 0.05}>
                <Card className="h-full">
                  <h3 className="text-lg font-bold text-vosz-roxo-escuro">{p.titulo}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">{p.texto}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Pilares de atuação completos */}
      <Section id="pilares" className="scroll-mt-20 bg-cream">
        <Container>
          <SectionHeading
            eyebrow="Pilares de atuação"
            titulo="As oito frentes da rede de cuidado"
            subtitulo="Cada frente detalhada na página O que Fazemos."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.itens.map((p, i) => (
              <IconCard
                key={p.id}
                icon={p.icon}
                titulo={p.titulo}
                texto={p.texto}
                accent={["roxo", "rosa", "azul", "verde"][i % 4]}
                className="h-full"
              />
            ))}
          </div>
        </Container>
      </Section>

      <CtaFinal />
    </>
  );
}
