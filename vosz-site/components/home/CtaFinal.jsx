import Image from "next/image";
import { Container } from "../ui/Section";
import Button from "../ui/Button";
import { ctaFinal } from "@/lib/content";

// Cena final full-bleed: foto real com véu roxo cinematográfico + headline massiva.
export default function CtaFinal() {
  return (
    <section className="grain relative overflow-hidden">
      {/* Foto de fundo com tratamento da marca */}
      <Image
        src="/fotos/criancas.jpg"
        alt=""
        aria-hidden
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-vosz-roxo-escuro/95 via-vosz-roxo/85 to-vosz-rosa/60" />

      <Container className="relative py-24 text-center sm:py-32">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm sm:text-xs">
          Sua doação é um gesto de amor
        </span>
        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          {ctaFinal.titulo}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{ctaFinal.texto}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
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
