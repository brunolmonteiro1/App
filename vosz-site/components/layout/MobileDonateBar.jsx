"use client";

import Link from "next/link";
import { whatsappUrl } from "@/lib/site";

// Barra fixa de conversão no rodapé do mobile (obrigatória no blueprint).
export default function MobileDonateBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(66,0,172,0.25)] backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <a
          href={whatsappUrl("Olá! Gostaria de falar com o Instituto Vosz.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-vosz-roxo font-bold text-vosz-roxo"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.8-4.3-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.3.1.7-.1 1.4Z" />
          </svg>
          WhatsApp
        </a>
        <Link
          href="/como-apoiar"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-vosz-rosa font-bold text-white shadow-soft"
        >
          Quero Doar
        </Link>
      </div>
    </div>
  );
}
