import Image from "next/image";
import { Container, Section, SectionHeading } from "../ui/Section";
import { turmas } from "@/lib/content";

// Comparação abstrata (pontos), sem fotos sensíveis:
// sala cheia (sinais passam despercebidos) x grupos pequenos (cada um é visto).
function Dots({ count, small }) {
  return (
    <div className={`flex flex-wrap ${small ? "gap-2.5" : "gap-1.5"}`}>
      {Array.from({ length: count }).map((_, i) => {
        // numa sala cheia, um ponto "se perde" (apagado); nos grupos, todos visíveis
        const perdido = !small && i === 17;
        return (
          <span
            key={i}
            className={`rounded-full ${small ? "h-4 w-4 bg-vosz-rosa" : perdido ? "h-2.5 w-2.5 bg-ink/15" : "h-2.5 w-2.5 bg-vosz-roxo/40"}`}
          />
        );
      })}
    </div>
  );
}

export default function TurmasReduzidas() {
  return (
    <Section id="turmas" className="bg-white">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={turmas.eyebrow} titulo={turmas.titulo} subtitulo={turmas.texto} />
          <p className="mt-6 text-xl font-extrabold text-vosz-rosa sm:text-2xl">
            &ldquo;{turmas.frase}&rdquo;
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-black/[0.06] bg-cream p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Modelo comum</p>
              <p className="mt-1 text-sm font-semibold text-ink/70">Salas cheias</p>
              <div className="mt-5">
                <Dots count={40} />
              </div>
              <p className="mt-5 text-sm text-ink/60">Na multidão, sinais passam despercebidos.</p>
            </div>

            <div className="rounded-3xl border-2 border-vosz-rosa/30 bg-vosz-rosa/[0.04] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-vosz-rosa">Modelo Vosz</p>
              <p className="mt-1 text-sm font-semibold text-vosz-roxo-escuro">Turmas reduzidas</p>
              <div className="mt-5">
                <Dots count={8} small />
              </div>
              <p className="mt-5 text-sm text-ink/70">Cada criança pode ser vista de perto.</p>
            </div>
          </div>

          {/* Foto real: uma criança vista de perto — a tese da seção em imagem */}
          <figure className="relative overflow-hidden rounded-3xl shadow-soft-lg">
            <Image
              src="/fotos/retrato.jpg"
              alt="Criança com camiseta do Instituto Vosz olhando para frente"
              width={647}
              height={815}
              className="h-full min-h-[20rem] w-full object-cover"
              sizes="(min-width: 1024px) 420px, 90vw"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-vosz-roxo-escuro/60 via-transparent to-transparent" />
            <figcaption className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
              Ser visto de perto muda a história de uma criança.
            </figcaption>
          </figure>
        </div>
      </Container>
    </Section>
  );
}
