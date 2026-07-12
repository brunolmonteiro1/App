"use client";

// Bloco introdutório didático (BLUEPRINT v2 §26): recolhível, estado no navegador.
import { useEffect, useState } from "react";

const KEY = "cr-about-collapsed";

export default function AboutDashboard() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(localStorage.getItem(KEY) !== "1");
  }, []);

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem(KEY, v ? "1" : "0");
      return !v;
    });
  };

  return (
    <section className="rounded-xl border border-hairline bg-surface">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium">Sobre este dashboard · como ler os dados</span>
        <span className="text-muted text-xs">{open ? "recolher ▲" : "expandir ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-secondary space-y-3">
          <p>
            Ferramenta de discernimento pastoral e análise teológica das pregações da A Casa da Rocha.
            <strong> Não substitui o discernimento da liderança</strong>, nem transforma pregações em
            simples números: organiza evidências, revela padrões e ajuda o presbitério a enxergar a
            dieta formativa da comunidade.
          </p>
          <p>
            Os dados são <strong>hipóteses verificáveis, não vereditos</strong>. Cada gráfico informa
            fonte, denominador e nível de validação. A revisão humana é a camada decisiva para
            conclusões pastorais.
          </p>
          <div>
            <p className="font-medium text-foreground mb-1">Como ler (camadas de proveniência):</p>
            <ul className="space-y-0.5 text-xs">
              <li>• <strong>Lexical preliminar</strong> — encontra vocabulário, não intenção ou contexto.</li>
              <li>• <strong>Motor bíblico</strong> — detecta referências e uso bíblico (determinístico).</li>
              <li>• <strong>IA contextual</strong> — interpreta a pregação inteira segundo as rubricas.</li>
              <li>• <strong>Revisado por humano</strong> — validado manualmente; base dos relatórios finais.</li>
            </ul>
          </div>
          <p className="text-xs text-muted">
            Importante: este dashboard não produz diagnóstico espiritual automático. Ele organiza
            evidências para apoiar discernimento pastoral responsável.
          </p>
        </div>
      )}
    </section>
  );
}
