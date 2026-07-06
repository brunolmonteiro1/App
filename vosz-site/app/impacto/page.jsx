import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import CtaFinal from "@/components/home/CtaFinal";
import { impacto } from "@/lib/content";

export const metadata = {
  title: "Impacto",
  description:
    "Transformação social exige continuidade, vínculo e presença. Conheça a natureza do impacto do Instituto Vosz — sem números inflados, com cuidado real.",
  alternates: { canonical: "/impacto" },
};

export default function ImpactoPage() {
  return (
    <>
      <PageHero eyebrow="Impacto" titulo={impacto.titulo} intro={impacto.intro} />

      <Section className="bg-cream">
        <Container className="grid gap-4 sm:grid-cols-2">
          {impacto.qualitativos.map((q, i) => (
            <Reveal key={q.titulo} delay={i * 0.05}>
              <div className="h-full rounded-3xl border border-black/[0.06] bg-white p-7 shadow-soft">
                <h2 className="text-lg font-bold text-vosz-roxo-escuro">{q.titulo}</h2>
                <p className="mt-2 leading-relaxed text-ink/70">{q.texto}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </Section>

      <Section className="bg-white">
        <Container>
          <div className="rounded-3xl border-2 border-dashed border-vosz-roxo/20 bg-vosz-roxo/[0.03] p-8 text-center">
            <p className="mx-auto max-w-2xl text-ink/60">{impacto.notaMetricas}</p>
          </div>
        </Container>
      </Section>

      <CtaFinal />
    </>
  );
}
