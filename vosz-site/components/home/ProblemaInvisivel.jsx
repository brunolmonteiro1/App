import { Container, Section, SectionHeading } from "../ui/Section";
import { IconCard } from "../ui/Card";
import { problema } from "@/lib/content";

const accents = ["rosa", "roxo", "azul", "verde", "amarelo", "rosa", "roxo", "azul"];

export default function ProblemaInvisivel() {
  return (
    <Section id="problema" className="relative overflow-hidden bg-white">
      {/* Número editorial da cena */}
      <span aria-hidden className="num-editorial pointer-events-none absolute -top-4 right-4 text-[9rem] sm:text-[13rem]">
        01
      </span>
      <Container className="relative">
        <SectionHeading eyebrow={problema.eyebrow} titulo={problema.titulo} subtitulo={problema.texto} />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {problema.cards.map((c, i) => (
            <IconCard key={c.titulo} icon={c.icon} titulo={c.titulo} texto={c.texto} accent={accents[i % accents.length]} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
