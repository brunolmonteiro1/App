/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Instituto Vosz
        vosz: {
          roxo: "#4200ac",
          "roxo-escuro": "#25006d",
          rosa: "#ff00a7",
          amarelo: "#fcdd32",
          verde: "#3ffc94",
          azul: "#00e7e9",
        },
        // Neutros de apoio (fundos claros predominantes)
        cream: "#faf9fc",
        ink: "#1a1030",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(66, 0, 172, 0.18)",
        "soft-lg": "0 24px 60px -20px rgba(66, 0, 172, 0.28)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
