import Image from "next/image";

// Logo do Instituto Vosz usando os assets oficiais extraídos do manual de marca.
// variant "cor"    -> símbolo colorido + wordmark roxo/rosa (para fundos claros)
// variant "branco" -> logo horizontal branco/rosa oficial (para fundos escuros/roxo)
export default function Logo({ variant = "cor", className = "", priority = false }) {
  if (variant === "branco") {
    return (
      <Image
        src="/logo-vosz-branco.png"
        alt="Instituto Vosz"
        width={1400}
        height={550}
        priority={priority}
        className={className || "h-10 w-auto"}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/simbolo-vosz.png"
        alt=""
        width={827}
        height={944}
        priority={priority}
        className="h-9 w-auto sm:h-10"
        aria-hidden="true"
      />
      <Image
        src="/logo-vosz-wordmark.png"
        alt="Instituto Vosz"
        width={850}
        height={303}
        priority={priority}
        className="h-6 w-auto sm:h-7"
      />
    </span>
  );
}
