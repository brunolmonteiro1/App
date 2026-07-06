import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import { TimelineList } from "@/components/home/Timeline";
import CtaFinal from "@/components/home/CtaFinal";
import { timeline } from "@/lib/content";

export const metadata = {
  title: "Nossa História",
  description:
    "De uma semente chamada Cultivar (2017) a um ecossistema de cuidado integral. A trajetória do Instituto Vosz, ano a ano.",
  alternates: { canonical: "/nossa-historia" },
};

export default function NossaHistoriaPage() {
  return (
    <>
      <PageHero
        eyebrow="Nossa história"
        titulo={timeline.titulo}
        intro="Uma trajetória de continuidade: da ação pontual ao cuidado que caminha com crianças e famílias ao longo do tempo."
      />
      <Section className="bg-cream">
        <Container>
          <TimelineList itens={timeline.itens} />
        </Container>
      </Section>
      <CtaFinal />
    </>
  );
}
