// Blocos de layout reutilizáveis: Container, Section e SectionHeading.

export function Container({ className = "", children }) {
  return <div className={`container-vosz ${className}`}>{children}</div>;
}

export function Section({ id, className = "", children, dark = false }) {
  return (
    <section
      id={id}
      className={`relative ${dark ? "bg-vosz-roxo-escuro text-white" : ""} py-16 sm:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, dark = false }) {
  return (
    <span
      className={`inline-block text-xs font-extrabold uppercase tracking-[0.18em] ${
        dark ? "text-vosz-amarelo" : "text-vosz-rosa"
      }`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, titulo, subtitulo, dark = false, center = false, className = "" }) {
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-3xl"} ${className}`}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2 className={`mt-3 text-3xl leading-tight sm:text-4xl md:text-[2.6rem] ${dark ? "text-white" : ""}`}>
        {titulo}
      </h2>
      {subtitulo && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/80" : "text-ink/70"}`}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}
