import Link from "next/link";

// Botão/CTA da marca. Variantes: rosa (conversão), roxo, contorno, branco (fundo escuro), fantasma.
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 focus-visible:outline-none disabled:opacity-60";

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[0.95rem]",
  lg: "px-7 py-3.5 text-base",
};

const variants = {
  rosa: "bg-vosz-rosa text-white shadow-soft hover:brightness-105 hover:shadow-soft-lg active:scale-[0.98]",
  roxo: "bg-vosz-roxo text-white shadow-soft hover:bg-vosz-roxo-escuro active:scale-[0.98]",
  contorno: "border-2 border-vosz-roxo text-vosz-roxo hover:bg-vosz-roxo hover:text-white",
  branco: "bg-white text-vosz-roxo hover:bg-vosz-amarelo hover:text-vosz-roxo-escuro shadow-soft",
  fantasmaBranco: "border-2 border-white/70 text-white hover:bg-white hover:text-vosz-roxo",
};

export default function Button({
  as = "link",
  href,
  variant = "rosa",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (as === "a") {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  if (as === "button") {
    return (
      <button className={cls} {...props}>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
