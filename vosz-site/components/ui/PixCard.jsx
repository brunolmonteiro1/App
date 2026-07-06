"use client";

import { useState } from "react";
import Image from "next/image";
import { pix } from "@/lib/site";

// Card de doação via PIX: chave, botão copiar (copia e cola) e QR Code.
export default function PixCard() {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback silencioso para navegadores sem clipboard API
      setCopiado(false);
    }
  };

  return (
    <div className="grid gap-6 rounded-4xl border border-black/[0.06] bg-white p-6 shadow-soft sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
      <div>
        <span className="inline-block rounded-full bg-vosz-verde/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0f9d63]">
          Doação via PIX
        </span>
        <h3 className="mt-3 text-2xl font-extrabold text-vosz-roxo-escuro">
          Sua doação é um gesto de amor
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          Chave PIX ({pix.tipo}) · {pix.beneficiario}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-xl bg-vosz-roxo/5 px-4 py-3 font-mono text-sm font-semibold text-vosz-roxo">
            {pix.chaveFormatada}
          </code>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-2 rounded-full bg-vosz-rosa px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:brightness-105 active:scale-[0.98]"
          >
            {copiado ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Você pode copiar o código &ldquo;copia e cola&rdquo; e colar no app do seu banco, ou
          escanear o QR Code ao lado.
        </p>
      </div>

      <div className="justify-self-center rounded-3xl border border-black/5 bg-white p-3">
        <Image
          src={pix.qr}
          alt="QR Code PIX do Instituto Vosz"
          width={180}
          height={180}
          className="h-40 w-40 sm:h-44 sm:w-44"
        />
      </div>
    </div>
  );
}
