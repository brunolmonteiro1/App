import { Container } from "./Section";
import Grafismo from "./Grafismo";

// Cabeçalho padrão das páginas internas: faixa clara com eyebrow + título + intro.
export default function PageHero({ eyebrow, titulo, intro, children }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-cream pb-4 pt-14 sm:pt-20">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-vosz-rosa/10 blur-3xl" />
      <Grafismo className="pointer-events-none absolute right-5 top-5 h-14 w-14 opacity-70" color="rosa" />
      <Container className="relative">
        {eyebrow && (
          <span className="inline-block text-xs font-extrabold uppercase tracking-[0.18em] text-vosz-rosa">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.1] sm:text-5xl">{titulo}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{intro}</p>}
        {children}
      </Container>
    </section>
  );
}
