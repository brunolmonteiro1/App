import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import PixCard from "@/components/ui/PixCard";
import { IconCard } from "@/components/ui/Card";
import LeadForm from "@/components/forms/LeadForm";
import Button from "@/components/ui/Button";
import { contato, whatsappUrl } from "@/lib/site";

export const metadata = {
  title: "Como Apoiar — Doe agora",
  description:
    "Doe via PIX, seja voluntário ou torne sua empresa parceira do Instituto Vosz. Cada gesto sustenta o cuidado integral de crianças e famílias.",
  alternates: { canonical: "/como-apoiar" },
};

const formas = [
  { icon: "heart", titulo: "Doação única", texto: "Contribua com qualquer valor via PIX — rápido e seguro.", accent: "rosa" },
  { icon: "calendar", titulo: "Doação recorrente", texto: "Torne-se doador(a) mensal e ajude a sustentar o cuidado contínuo.", accent: "roxo" },
  { icon: "users", titulo: "Voluntariado", texto: "Compartilhe tempo, conhecimento e habilidades.", accent: "azul" },
  { icon: "building", titulo: "Empresa parceira", texto: "Conecte sua marca a uma causa real de impacto social.", accent: "verde" },
];

export default function ComoApoiarPage() {
  return (
    <>
      <PageHero
        eyebrow="Como apoiar"
        titulo="Faça parte dessa jornada de cuidado"
        intro="O atendimento às famílias é gratuito. É o apoio de doadores, voluntários e empresas que sustenta a estrutura, a equipe e a continuidade do cuidado."
      />

      {/* PIX em destaque */}
      <Section className="bg-cream pt-10">
        <Container>
          <PixCard />
          <p className="mt-4 text-center text-sm text-ink/60">
            Prefere doar por outro canal?{" "}
            <a href={contato.linktree} target="_blank" rel="noopener noreferrer" className="font-bold text-vosz-rosa underline-offset-2 hover:underline">
              Veja todas as opções no nosso linktree
            </a>
            .
          </p>
        </Container>
      </Section>

      {/* Formas de apoiar */}
      <Section className="bg-white pt-4">
        <Container>
          <SectionHeading eyebrow="Formas de apoiar" titulo="Escolha como caminhar com o Vosz" center />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {formas.map((f) => (
              <IconCard key={f.titulo} icon={f.icon} titulo={f.titulo} texto={f.texto} accent={f.accent} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Voluntariado */}
      <Section id="voluntariado" className="scroll-mt-20 bg-cream">
        <Container className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Voluntariado"
              titulo="Doe seu tempo e seu talento"
              subtitulo="Precisamos de pessoas em educação, arte, tecnologia, comunicação, eventos e apoio administrativo. Conte pra gente como você pode contribuir."
            />
          </div>
          <LeadForm tipo="voluntario" id="form-voluntario" />
        </Container>
      </Section>

      {/* Empresas */}
      <Section id="empresas" className="scroll-mt-20 bg-white">
        <Container className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Empresas parceiras"
              titulo="Impacto social com responsabilidade comunitária"
              subtitulo="Sua empresa pode apoiar frentes específicas, patrocinar atividades, doar produtos ou construir uma parceria de longo prazo com o Instituto."
            />
            <div className="mt-6">
              <Button as="a" href={whatsappUrl("Olá! Minha empresa gostaria de apoiar o Instituto Vosz.")} variant="roxo" size="md">
                Falar sobre parceria
              </Button>
            </div>
          </div>
          <LeadForm tipo="empresa" id="form-empresa" />
        </Container>
      </Section>
    </>
  );
}
