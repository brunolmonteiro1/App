// Grafismo da marca: a "fita V" (derivada do símbolo do logo), usada como
// destaque nos cantos e como textura leve. Decorativo — aria-hidden.

export default function Grafismo({ className = "", color = "rosa", flip = false }) {
  const fill = color === "roxo" ? "#4200ac" : color === "amarelo" ? "#fcdd32" : color === "branco" ? "#ffffff" : "#ff00a7";
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* Zigue-zague em fita, inspirado no grafismo do manual */}
      <path
        fill={fill}
        d="M6 20 L54 20 L30 56 L54 56 L14 108 L30 68 L8 68 Z"
        opacity="0.95"
      />
    </svg>
  );
}
