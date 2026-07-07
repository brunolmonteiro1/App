import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import PixCard from "@/components/ui/PixCard";
import { IconCard } from "@/components/ui/Card";
import LeadForm from "@/components/forms/LeadForm";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { contato, whatsappUrl } from "@/lib/site";
import { portaVosz, salaSensorial } from "@/lib/content";

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

      {/* Projeto em captação — Sala Sensorial */}
      <Section id="sala-sensorial" className="grain relative scroll-mt-20 overflow-hidden bg-vosz-roxo-escuro">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-vosz-rosa/20 blur-[110px]" />
        <Container className="relative">
          <SectionHeading
            eyebrow={salaSensorial.eyebrow}
            titulo={salaSensorial.titulo}
            subtitulo={salaSensorial.subtitulo}
            dark
            center
          />
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-vosz-amarelo">O desafio</h3>
              <p className="mt-3 leading-relaxed text-white/80">{salaSensorial.problema}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-vosz-verde">A solução</h3>
              <p className="mt-3 leading-relaxed text-white/80">{salaSensorial.solucao}</p>
            </div>
          </div>
          <div className="mx-auto mt-4 grid max-w-4xl gap-4 sm:grid-cols-3">
            {salaSensorial.beneficios.map((b, i) => (
              <Reveal key={b.titulo} delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-white p-6 shadow-soft-lg">
                  <h3 className="font-extrabold text-vosz-roxo-escuro">{b.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{b.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-vosz-rosa p-7 text-center shadow-soft-lg sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/85">Meta do projeto</p>
            <p className="mt-1 text-4xl font-black text-white">{salaSensorial.meta}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/90">{salaSensorial.metaDescricao}</p>
            <div className="mt-5">
              <Button as="a" href={whatsappUrl("Olá! Quero apoiar o projeto da Sala Sensorial do Instituto Vosz.")} variant="branco" size="md">
                Quero apoiar este projeto
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Seja um Porta Vosz */}
      <Section id="porta-vosz" className="scroll-mt-20 bg-white">
        <Container>
          <SectionHeading eyebrow="Embaixadores" titulo={portaVosz.titulo} subtitulo={portaVosz.intro} center />
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {portaVosz.acoes.map((a, i) => (
              <Reveal key={a.titulo} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-black/[0.06] bg-cream p-6 shadow-soft">
                  <h3 className="font-extrabold text-vosz-roxo-escuro">{a.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{a.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-xl font-extrabold text-vosz-rosa sm:text-2xl">{portaVosz.frase}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button as="a" href={whatsappUrl("Olá! Quero ser um Porta Vosz.")} variant="rosa" size="md">
              Quero me engajar
            </Button>
            <Button as="a" href={whatsappUrl("Olá! Gostaria de agendar uma apresentação do Instituto Vosz.")} variant="contorno" size="md">
              Agendar apresentação
            </Button>
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
