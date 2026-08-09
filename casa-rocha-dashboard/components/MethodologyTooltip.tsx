"use client";

// Tooltip metodológico acessível (BLUEPRINT v2 §27): clique/tap, foco por teclado,
// ESC e clique externo fecham. Não depende só de hover.
import { useEffect, useRef, useState } from "react";

export interface MethodologyTooltipProps {
  title: string;
  question?: string;
  source?: string;
  methodology?: string;
  interpretation?: string;
  limitations?: string;
}

export default function MethodologyTooltip(props: MethodologyTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        aria-label={`Metodologia: ${props.title}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-hairline text-[10px] text-muted hover:text-foreground"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-0 top-6 z-20 block w-72 rounded-lg border border-hairline bg-surface p-3 text-xs shadow-lg text-secondary">
          <strong className="block text-foreground mb-1">{props.title}</strong>
          {props.question && <span className="block mb-1"><span className="text-muted">Pergunta:</span> {props.question}</span>}
          {props.source && <span className="block mb-1"><span className="text-muted">Origem:</span> {props.source}</span>}
          {props.methodology && <span className="block mb-1"><span className="text-muted">Cálculo:</span> {props.methodology}</span>}
          {props.interpretation && <span className="block mb-1"><span className="text-muted">Leitura:</span> {props.interpretation}</span>}
          {props.limitations && <span className="block"><span className="text-muted">Limitações:</span> {props.limitations}</span>}
        </span>
      )}
    </span>
  );
}
