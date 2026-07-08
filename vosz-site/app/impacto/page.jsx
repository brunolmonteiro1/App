import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import CtaFinal from "@/components/home/CtaFinal";
import Image from "next/image";
import { impacto, transparencia } from "@/lib/content";

// Galeria com fotos do material oficial da marca (uso autorizado).
const galeria = [
  { src: "/fotos/estudo.jpg", alt: "Crianças escrevendo em atividade do contraturno", legenda: "Contraturno" },
  { src: "/fotos/bale.jpg", alt: "Meninas praticando balé", legenda: "Arte" },
  { src: "/fotos/criatividade.jpg", alt: "Criança mostrando origami", legenda: "Criatividade" },
  { src: "/fotos/muaythai.jpg", alt: "Aula de artes marciais", legenda: "Esporte" },
  { src: "/fotos/refeicao.jpg", alt: "Refeição das crianças", legenda: "Alimentação" },
  { src: "/fotos/coral.jpg", alt: "Coral de crianças do Vosz", legenda: "Eventos" },
];

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

      {/* O que medimos */}
      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="O que medimos"
            titulo="Indicadores a serviço do cuidado"
            subtitulo="Frequência, participação, desenvolvimento pedagógico e socioemocional, participação familiar, acesso a direitos e caminhos de autonomia — sem reduzir pessoas a números."
            center
          />
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink/50">{impacto.notaMetricas}</p>
        </Container>
      </Section>

      {/* Galeria */}
      <Section className="bg-cream">
        <Container>
          <SectionHeading eyebrow="Galeria" titulo="O cuidado em imagens" center />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {galeria.map((g) => (
              <figure key={g.src} className="group relative overflow-hidden rounded-3xl shadow-soft">
                <Image
                  src={g.src}
                  alt={g.alt}
                  width={640}
                  height={480}
                  className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
                  sizes="(min-width: 640px) 33vw, 50vw"
                />
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-vosz-roxo-escuro/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {g.legenda}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-ink/45">
            Fotos do material institucional oficial do Instituto Vosz.
          </p>
        </Container>
      </Section>

      {/* Relatórios */}
      <Section className="bg-white">
        <Container>
          <SectionHeading eyebrow="Relatórios" titulo="Documentos e prestação de contas" center />
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {transparencia.documentos.map((d) => (
              <div key={d.titulo} className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-cream p-5">
                <span className="font-bold text-vosz-roxo-escuro">{d.titulo}</span>
                <span className="shrink-0 rounded-full bg-vosz-roxo/10 px-3 py-1 text-xs font-semibold text-vosz-roxo">{d.status}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CtaFinal />
    </>
  );
}
