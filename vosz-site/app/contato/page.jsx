import PageHero from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import LeadForm from "@/components/forms/LeadForm";
import { contato, whatsappUrl } from "@/lib/site";

export const metadata = {
  title: "Contato",
  description:
    "Fale com o Instituto Vosz. Endereço no Cambuci/SP, WhatsApp, e-mail e Instagram. Formulários para famílias e parceiros.",
  alternates: { canonical: "/contato" },
};

const endereco = `${contato.enderecoLinha1}, ${contato.enderecoLinha2}`;
const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        titulo="Vamos conversar"
        intro="Estamos no Cambuci, em São Paulo. Escolha o melhor canal para falar com o Instituto Vosz."
      />

      <Section className="bg-cream">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Canais + mapa */}
          <div className="space-y-4">
            <ContatoItem icon="home" titulo="Endereço">
              {contato.enderecoLinha1}
              <br />
              {contato.enderecoLinha2}
            </ContatoItem>

            <a
              href={whatsappUrl("Olá! Vim pelo site do Instituto Vosz.")}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <ContatoInner icon="link" titulo="WhatsApp">
                Fale com a nossa equipe
              </ContatoInner>
            </a>

            <a
              href={`mailto:${contato.email}`}
              className="block rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <ContatoInner icon="megaphone" titulo="E-mail">
                {contato.email}
              </ContatoInner>
            </a>

            <a
              href={contato.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <ContatoInner icon="heart" titulo="Instagram">
                {contato.instagramHandle}
              </ContatoInner>
            </a>

            <div className="overflow-hidden rounded-3xl border border-black/[0.06] shadow-soft">
              <iframe
                title="Mapa — Instituto Vosz"
                src={mapsSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-6">
            <LeadForm tipo="contato" id="form-contato" />
            <p className="text-center text-sm text-ink/60">
              É uma família em busca de atendimento?{" "}
              <a href="#form-familia" className="font-bold text-vosz-rosa">
                Use este formulário
              </a>
              .
            </p>
            <div id="form-familia" className="scroll-mt-24">
              <LeadForm tipo="familia" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ContatoInner({ icon, titulo, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-vosz-roxo/10 text-vosz-roxo">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bold text-vosz-roxo-escuro">{titulo}</p>
        <p className="mt-0.5 text-sm text-ink/70">{children}</p>
      </div>
    </div>
  );
}

function ContatoItem({ icon, titulo, children }) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <ContatoInner icon={icon} titulo={titulo}>
        {children}
      </ContatoInner>
    </div>
  );
}
