import { Container, Section, SectionHeading } from "../ui/Section";
import Button from "../ui/Button";
import Reveal from "../ui/Reveal";
import { impacto, impactoHome } from "@/lib/content";

// Seção curta de impacto e confiança: números reais da apresentação
// institucional + convite para a página completa de Impacto.
export default function ImpactoConfianca() {
  return (
    <Section id="impacto" className="relative overflow-hidden bg-cream">
      <Container className="relative">
        <SectionHeading eyebrow={impactoHome.eyebrow} titulo={impactoHome.titulo} center />

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
          {impacto.numeros.map((n, i) => (
            <Reveal key={n.legenda} delay={i * 0.06}>
              <div className="h-full rounded-3xl border border-black/[0.06] bg-white p-6 text-center shadow-soft">
                <p className="text-3xl font-black tracking-tight text-transparent sm:text-4xl bg-gradient-to-r from-vosz-roxo to-vosz-rosa bg-clip-text">
                  {n.valor}
                </p>
                <p className="mt-2 text-xs leading-snug text-ink/60 sm:text-sm">{n.legenda}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center font-semibold text-vosz-roxo-escuro">
          {impacto.fraseNumeros}
        </p>

        <div className="mt-8 text-center">
          <Button href={impactoHome.cta.href} variant="contorno" size="md">
            {impactoHome.cta.label}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
