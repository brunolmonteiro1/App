import { Container } from "../ui/Section";
import Button from "../ui/Button";
import Grafismo from "../ui/Grafismo";
import { ctaFinal } from "@/lib/content";

export default function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-vosz-roxo to-vosz-roxo-escuro py-20 sm:py-28">
      <Grafismo className="pointer-events-none absolute left-6 top-6 h-20 w-20 opacity-30" color="rosa" />
      <Grafismo className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 opacity-20" color="branco" flip />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vosz-rosa/20 blur-3xl" />

      <Container className="relative text-center">
        <h2 className="mx-auto max-w-3xl text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
          {ctaFinal.titulo}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{ctaFinal.texto}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={ctaFinal.ctaPrimario.href} variant="branco" size="lg">
            {ctaFinal.ctaPrimario.label}
          </Button>
          <Button href={ctaFinal.ctaSecundario.href} variant="fantasmaBranco" size="lg">
            {ctaFinal.ctaSecundario.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
