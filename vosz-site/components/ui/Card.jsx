import Icon from "./Icon";

// Card básico da marca (formas arredondadas, sombra suave).
export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

// Card com ícone + título + texto, usado em grades (problema, pilares, apoiar).
export function IconCard({ icon, titulo, texto, accent = "rosa", className = "" }) {
  const accentBg = {
    rosa: "bg-vosz-rosa/10 text-vosz-rosa",
    roxo: "bg-vosz-roxo/10 text-vosz-roxo",
    azul: "bg-vosz-azul/15 text-[#00989a]",
    verde: "bg-vosz-verde/20 text-[#0f9d63]",
    amarelo: "bg-vosz-amarelo/25 text-[#a7860b]",
  }[accent];

  return (
    <div
      className={`group rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg ${className}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentBg}`}>
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-vosz-roxo-escuro">{titulo}</h3>
      {texto && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">{texto}</p>}
    </div>
  );
}
