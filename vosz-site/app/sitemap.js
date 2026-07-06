import { rotas, site } from "@/lib/site";

export default function sitemap() {
  const now = new Date();
  return rotas.map((rota) => ({
    url: `${site.url}${rota === "/" ? "" : rota}`,
    lastModified: now,
    changeFrequency: rota === "/" ? "weekly" : "monthly",
    priority: rota === "/" ? 1 : rota === "/como-apoiar" ? 0.9 : 0.7,
  }));
}
