import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import CtaFinal from "@/components/home/CtaFinal";
import { frentes, pilares } from "@/lib/content";

export const metadata = {
  title: "O que Fazemos",
  description:
    "Contraturno socioeducativo, assistência social e família, neuropsicologia, arte e cultura, tecnologia e maker, alimentação, bazar social e capacitação.",
  alternates: { canonical: "/o-que-fazemos" },
};

// Mapeia cada frente ao ícone correspondente definido nos pilares.
const iconById = Object.fromEntries(pilares.itens.map((p) => [p.id, p.icon]));

export default function OQueFazemosPage() {
  return (
    <>
      <PageHero
        eyebrow="O que fazemos"
        titulo="Uma única rede de cuidado, muitas frentes"
        intro="Cada frente se conecta às outras. Juntas, formam o contraturno socioeducativo com cuidado integral do Instituto Vosz."
      >
        {/* índice rápido */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Frentes de atuação">
          {frentes.map((f) => (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="rounded-full border border-vosz-roxo/20 bg-white px-3.5 py-1.5 text-sm font-semibold text-vosz-roxo transition hover:bg-vosz-roxo hover:text-white"
            >
              {f.titulo}
            </a>
          ))}
        </nav>
      </PageHero>

      <Section className="bg-cream">
        <Container className="space-y-4">
          {frentes.map((f, i) => (
            <Reveal key={f.id}>
              <article
                id={f.id}
                className="scroll-mt-24 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-vosz-roxo/10 text-vosz-roxo sm:h-14 sm:w-14">
                    <Icon name={iconById[f.id] || "heart"} className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-vosz-rosa">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="text-xl font-bold text-vosz-roxo-escuro sm:text-2xl">{f.titulo}</h2>
                    <p className="mt-2 max-w-3xl leading-relaxed text-ink/70">{f.texto}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </Container>
      </Section>

      <CtaFinal />
    </>
  );
}
