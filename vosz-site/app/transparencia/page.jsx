import PageHero from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { transparencia } from "@/lib/content";
import { juridico, contato, whatsappUrl } from "@/lib/site";

export const metadata = {
  title: "Transparência",
  description:
    "Informações institucionais, compromissos com a proteção de crianças e LGPD, e documentos públicos do Instituto Vosz.",
  alternates: { canonical: "/transparencia" },
};

export default function TransparenciaPage() {
  return (
    <>
      <PageHero eyebrow="Transparência" titulo={transparencia.titulo} intro={transparencia.intro} />

      {/* Dados institucionais */}
      <Section className="bg-cream">
        <Container>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-vosz-rosa">Razão social</p>
              <p className="mt-2 font-bold text-vosz-roxo-escuro">{juridico.razaoSocial}</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-vosz-rosa">CNPJ</p>
              <p className="mt-2 font-bold text-vosz-roxo-escuro">{juridico.cnpj}</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider text-vosz-rosa">Natureza</p>
              <p className="mt-2 font-bold text-vosz-roxo-escuro">{juridico.natureza}</p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Compromissos */}
      <Section className="bg-white">
        <Container>
          <SectionHeading eyebrow="Nossos compromissos" titulo="Cuidar também é proteger" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {transparencia.compromissos.map((c, i) => (
              <Reveal key={c.titulo} delay={i * 0.05}>
                <Card className="h-full">
                  <h3 className="text-lg font-bold text-vosz-roxo-escuro">{c.titulo}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">{c.texto}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Documentos */}
      <Section id="lgpd" className="scroll-mt-20 bg-cream">
        <Container>
          <SectionHeading
            eyebrow="Documentos públicos"
            titulo="Prestação de contas"
            subtitulo="Documentos disponibilizados pela equipe do Instituto. Solicite o que precisar pelos nossos canais de contato."
          />
          <ul className="mt-10 divide-y divide-black/5 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-soft">
            {transparencia.documentos.map((d) => (
              <li key={d.titulo} className="flex items-center justify-between gap-4 p-5">
                <span className="font-semibold text-vosz-roxo-escuro">{d.titulo}</span>
                <span className="rounded-full bg-vosz-roxo/5 px-3 py-1 text-xs font-bold text-vosz-roxo">
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink/60">
            Para solicitar documentos ou esclarecimentos, escreva para{" "}
            <a href={`mailto:${contato.email}`} className="font-bold text-vosz-rosa">
              {contato.email}
            </a>
            .
          </p>
        </Container>
      </Section>

      {/* Contato institucional */}
      <Section className="bg-white">
        <Container className="rounded-4xl bg-vosz-roxo-escuro p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-2xl text-2xl text-white sm:text-3xl">
            Fale com a nossa equipe
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Dúvidas institucionais, imprensa, editais e parcerias: estamos à disposição.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button as="a" href={whatsappUrl("Olá! Gostaria de falar com a equipe do Instituto Vosz.")} variant="branco" size="md">
              WhatsApp institucional
            </Button>
            <Button as="a" href={`mailto:${contato.email}`} variant="fantasmaBranco" size="md">
              {contato.email}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
