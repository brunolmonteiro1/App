"use client";

import { useState, useEffect } from "react";

// Banner de cookies simples e sem trackers. Guarda a escolha no localStorage.
// Quando o Instituto definir analytics (GA/Meta), plugar o carregamento aqui.
export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("vosz-cookies")) setVisivel(true);
    } catch {
      /* ambiente sem localStorage */
    }
  }, []);

  const aceitar = () => {
    try {
      localStorage.setItem("vosz-cookies", "1");
    } catch {}
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-2xl rounded-3xl border border-black/[0.06] bg-white p-4 shadow-soft-lg sm:inset-x-4 sm:bottom-4 sm:p-5 lg:bottom-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink/70">
          Usamos cookies essenciais para o funcionamento do site. Ao continuar navegando, você
          concorda com a nossa política de privacidade.
        </p>
        <button
          type="button"
          onClick={aceitar}
          className="shrink-0 rounded-full bg-vosz-roxo px-6 py-2.5 text-sm font-bold text-white transition hover:bg-vosz-roxo-escuro"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
