import Link from "next/link";
import { Container, Section, SectionHeading } from "../ui/Section";
import { IconCard } from "../ui/Card";
import Button from "../ui/Button";
import { pilares } from "@/lib/content";

const accents = ["roxo", "rosa", "azul", "verde", "amarelo", "rosa", "roxo", "verde"];

export default function Pilares() {
  return (
    <Section id="pilares" className="relative overflow-hidden bg-cream">
      <span aria-hidden className="num-editorial pointer-events-none absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
        03
      </span>
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow={pilares.eyebrow} titulo={pilares.titulo} subtitulo={pilares.subtitulo} />
          <Button href="/o-que-fazemos" variant="contorno" size="md" className="shrink-0">
            Ver tudo o que fazemos
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {pilares.itens.map((p, i) => (
            <Link key={p.id} href={`/o-que-fazemos#${p.id}`} className="rounded-3xl focus-visible:outline-none">
              <IconCard icon={p.icon} titulo={p.titulo} texto={p.texto} accent={accents[i % accents.length]} className="h-full" />
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
