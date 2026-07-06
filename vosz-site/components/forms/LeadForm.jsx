"use client";

import { useState } from "react";
import { whatsappUrl, contato } from "@/lib/site";

// Formulário de captação. Sem backend por ora: monta uma mensagem e abre o
// WhatsApp (ou e-mail como alternativa). Pronto para plugar um endpoint depois
// (ver comentário em handleSubmit).
const presets = {
  contato: {
    titulo: "Fale com o Vosz",
    intro: "Preencha e continue a conversa pelo WhatsApp.",
    assunto: "Contato pelo site",
    campoMensagem: "Como podemos ajudar?",
  },
  voluntario: {
    titulo: "Quero ser voluntário(a)",
    intro: "Conte um pouco sobre você e sua disponibilidade.",
    assunto: "Quero ser voluntário(a)",
    campoMensagem: "Áreas de interesse e disponibilidade",
  },
  empresa: {
    titulo: "Minha empresa quer apoiar",
    intro: "Vamos construir uma parceria de impacto social.",
    assunto: "Empresa parceira",
    campoMensagem: "Como sua empresa gostaria de apoiar?",
  },
  familia: {
    titulo: "Sou família e busco atendimento",
    intro: "Deixe seu contato que retornaremos com cuidado.",
    assunto: "Atendimento a família",
    campoMensagem: "Conte brevemente sua situação",
  },
};

export default function LeadForm({ tipo = "contato", id }) {
  const cfg = presets[tipo] || presets.contato;
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nome = data.get("nome") || "";
    const telefone = data.get("telefone") || "";
    const email = data.get("email") || "";
    const mensagem = data.get("mensagem") || "";

    // Monta a mensagem para o WhatsApp.
    const texto =
      `*${cfg.assunto} — Instituto Vosz*\n` +
      `Nome: ${nome}\n` +
      (telefone ? `Telefone: ${telefone}\n` : "") +
      (email ? `E-mail: ${email}\n` : "") +
      `\n${mensagem}`;

    // TODO(backend): quando houver endpoint/CRM, enviar `data` via fetch aqui.
    window.open(whatsappUrl(texto), "_blank", "noopener,noreferrer");
    setEnviado(true);
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="rounded-4xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8"
    >
      <h3 className="text-2xl font-extrabold text-vosz-roxo-escuro">{cfg.titulo}</h3>
      <p className="mt-1 text-sm text-ink/60">{cfg.intro}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="nome" required autoComplete="name" />
        <Field label="Telefone / WhatsApp" name="telefone" type="tel" autoComplete="tel" inputMode="tel" />
        <Field label="E-mail" name="email" type="email" autoComplete="email" className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <label htmlFor={`${tipo}-mensagem`} className="mb-1.5 block text-sm font-semibold text-vosz-roxo-escuro">
            {cfg.campoMensagem}
          </label>
          <textarea
            id={`${tipo}-mensagem`}
            name="mensagem"
            rows={4}
            required
            className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none transition focus:border-vosz-roxo"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-vosz-rosa px-6 py-3.5 font-bold text-white shadow-soft transition hover:brightness-105 active:scale-[0.99] sm:w-auto"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.8-4.3-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.3.1.7-.1 1.4Z" />
        </svg>
        Enviar pelo WhatsApp
      </button>

      {enviado && (
        <p className="mt-4 rounded-2xl bg-vosz-verde/15 px-4 py-3 text-sm font-semibold text-[#0f9d63]">
          Abrimos o WhatsApp para você concluir o envio. Se não abriu, escreva para {contato.email}.
        </p>
      )}
      <p className="mt-4 text-xs text-ink/50">
        Ao enviar, você concorda com o uso dos seus dados apenas para retornar seu contato (LGPD).
      </p>
    </form>
  );
}

function Field({ label, name, type = "text", required, className = "", ...props }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-sm font-semibold text-vosz-roxo-escuro">
        {label} {required && <span className="text-vosz-rosa">*</span>}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none transition focus:border-vosz-roxo"
        {...props}
      />
    </div>
  );
}
