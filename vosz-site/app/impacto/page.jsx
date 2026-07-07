import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import CtaFinal from "@/components/home/CtaFinal";
import { impacto } from "@/lib/content";

export const metadata = {
  title: "Impacto",
  description:
    "50 crianças atendidas diariamente, mais de 1.500 famílias apoiadas e 26 mil cestas básicas entregues. Conheça o impacto do Instituto Vosz.",
  alternates: { canonical: "/impacto" },
};

export default function ImpactoPage() {
  return (
    <>
      <PageHero eyebrow="Impacto" titulo={impacto.titulo} intro={impacto.intro} />

      {/* Números reais da apresentação institucional */}
      <Section className="grain relative overflow-hidden bg-vosz-roxo-escuro">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-vosz-rosa/20 blur-[110px]" />
        <Container className="relative">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {impacto.numeros.map((n, i) => (
              <Reveal key={n.legenda} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center backdrop-blur-sm">
                  <p className="text-4xl font-black tracking-tight text-transparent sm:text-5xl bg-gradient-to-r from-vosz-rosa via-[#ff5ec8] to-vosz-amarelo bg-clip-text">
                    {n.valor}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{n.legenda}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-center text-xl font-extrabold text-white sm:text-2xl">
            {impacto.fraseNumeros}
          </p>
        </Container>
      </Section>

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
          <p className="mx-auto max-w-2xl text-center text-sm text-ink/50">{impacto.notaMetricas}</p>
        </Container>
      </Section>

      <CtaFinal />
    </>
  );
}
