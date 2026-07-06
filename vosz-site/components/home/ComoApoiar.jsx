import Link from "next/link";
import { Container, Section, SectionHeading } from "../ui/Section";
import Icon from "../ui/Icon";
import { apoiar } from "@/lib/content";

const accents = ["rosa", "roxo", "azul", "verde"];
const accentClasses = {
  rosa: "bg-vosz-rosa/10 text-vosz-rosa",
  roxo: "bg-vosz-roxo/10 text-vosz-roxo",
  azul: "bg-vosz-azul/15 text-[#00989a]",
  verde: "bg-vosz-verde/20 text-[#0f9d63]",
};

export default function ComoApoiar() {
  return (
    <Section id="apoiar" className="bg-white">
      <Container>
        <SectionHeading eyebrow={apoiar.eyebrow} titulo={apoiar.titulo} center />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {apoiar.cards.map((c, i) => (
            <Link
              key={c.titulo}
              href={c.href}
              className="group flex flex-col rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses[accents[i]]}`}>
                <Icon name={c.icon} className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-vosz-roxo-escuro">{c.titulo}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink/70">{c.texto}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-vosz-rosa">
                {c.cta}
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
