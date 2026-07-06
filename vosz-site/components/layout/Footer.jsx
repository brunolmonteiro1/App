import Link from "next/link";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { nav, contato, juridico, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-vosz-roxo-escuro text-white">
      <div className="container-vosz grid gap-10 py-14 sm:py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo variant="branco" className="h-11 w-auto" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            {site.description}
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={contato.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do Instituto Vosz"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-vosz-rosa"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={contato.linktree}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Links do Instituto Vosz"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-vosz-rosa"
            >
              <Icon name="link" className="h-5 w-5" />
            </a>
          </div>
        </div>

        <nav aria-label="Rodapé — navegação">
          <h2 className="text-sm font-bold uppercase tracking-wider text-vosz-amarelo">Navegação</h2>
          <ul className="mt-4 space-y-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/75 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-vosz-amarelo">Contato</h2>
          <address className="mt-4 space-y-2.5 text-sm not-italic text-white/75">
            <p>
              {contato.enderecoLinha1}
              <br />
              {contato.enderecoLinha2}
            </p>
            <p>
              <a href={`mailto:${contato.email}`} className="transition-colors hover:text-white">
                {contato.email}
              </a>
            </p>
            <p>{contato.instagramHandle}</p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-vosz flex flex-col gap-2 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {juridico.razaoSocial} · CNPJ {juridico.cnpj}
          </p>
          <p>{juridico.natureza}</p>
        </div>
      </div>
    </footer>
  );
}
