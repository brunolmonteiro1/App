// Benchmark "igreja saudável" (HEALTH_BENCHMARK.md) em forma executável:
// textos-base → (livro, capítulo) para presença determinística via motor bíblico,
// + campo de score para centralidade (codificação) + trilha complementar sugerida.

export interface BenchmarkRef {
  slug: string;
  chapters: number[]; // capítulos-base (presença = pregação citando livro+capítulo)
  label: string;
}

export interface BenchmarkTopicDef {
  topic: string;
  refs: BenchmarkRef[];
  scoreField: string; // centralidade (codificação)
  trilha: string; // recomendação complementar — nunca "mudar o púlpito"
}

export const BENCHMARK_TOPICS: BenchmarkTopicDef[] = [
  {
    topic: "Igreja como corpo",
    refs: [
      { slug: "1-corintios", chapters: [12], label: "1Co 12" },
      { slug: "romanos", chapters: [12], label: "Rm 12" },
      { slug: "efesios", chapters: [4], label: "Ef 4" },
    ],
    scoreField: "communityMutualityScore",
    trilha: "pequenos grupos / grupos de cuidado",
  },
  {
    topic: "Serviço",
    refs: [
      { slug: "marcos", chapters: [10], label: "Mc 10.45" },
      { slug: "joao", chapters: [13], label: "Jo 13" },
      { slug: "galatas", chapters: [5], label: "Gl 5.13" },
      { slug: "1-pedro", chapters: [4], label: "1Pe 4.10" },
    ],
    scoreField: "serviceDiaconiaScore",
    trilha: "trilha de voluntariado sem culpa",
  },
  {
    topic: "Missão",
    refs: [
      { slug: "mateus", chapters: [28], label: "Mt 28.18-20" },
      { slug: "atos", chapters: [1], label: "At 1.8" },
      { slug: "2-corintios", chapters: [5], label: "2Co 5.18-20" },
    ],
    scoreField: "missionEvangelismScore",
    trilha: "missão local estruturada",
  },
  {
    topic: "Generosidade",
    refs: [
      { slug: "2-corintios", chapters: [8, 9], label: "2Co 8–9" },
      { slug: "atos", chapters: [2, 4], label: "At 2.42-47; 4.32-35" },
    ],
    scoreField: "generosityScore",
    trilha: "formação de generosidade saudável (sem barganha)",
  },
  {
    topic: "Liderança servidora",
    refs: [
      { slug: "1-pedro", chapters: [5], label: "1Pe 5.1-4" },
      { slug: "atos", chapters: [20], label: "At 20.28" },
      { slug: "1-timoteo", chapters: [3], label: "1Tm 3" },
      { slug: "tito", chapters: [1], label: "Tt 1" },
    ],
    scoreField: "ecclesiologyScore",
    trilha: "formação de facilitadores/anfitriões",
  },
  {
    topic: "Discipulado",
    refs: [
      { slug: "lucas", chapters: [9], label: "Lc 9.23" },
      { slug: "colossenses", chapters: [1], label: "Cl 1.28" },
      { slug: "2-timoteo", chapters: [2], label: "2Tm 2.2" },
    ],
    scoreField: "discipleshipScore",
    trilha: "formação de discipuladores",
  },
  {
    topic: "Mutualidade (uns aos outros)",
    refs: [
      { slug: "romanos", chapters: [12], label: "Rm 12" },
      { slug: "efesios", chapters: [4], label: "Ef 4" },
      { slug: "colossenses", chapters: [3], label: "Cl 3" },
      { slug: "hebreus", chapters: [10], label: "Hb 10" },
    ],
    scoreField: "communityMutualityScore",
    trilha: "rede de cuidado mútuo na semana",
  },
  {
    topic: "Maturidade",
    refs: [
      { slug: "efesios", chapters: [4], label: "Ef 4.11-16" },
      { slug: "hebreus", chapters: [5], label: "Hb 5.11-14" },
    ],
    scoreField: "sanctificationScore",
    trilha: "trilha de maturidade pós-acolhimento",
  },
  {
    topic: "Cuidado dos pobres",
    refs: [
      { slug: "mateus", chapters: [25], label: "Mt 25" },
      { slug: "tiago", chapters: [1, 2], label: "Tg 1–2" },
      { slug: "isaias", chapters: [58], label: "Is 58" },
    ],
    scoreField: "careForPoorScore",
    trilha: "ações sociais com onboarding acolhedor",
  },
  {
    topic: "Correção sem abuso",
    refs: [
      { slug: "mateus", chapters: [18], label: "Mt 18" },
      { slug: "galatas", chapters: [6], label: "Gl 6.1-2" },
      { slug: "2-timoteo", chapters: [4], label: "2Tm 4.1-5" },
    ],
    scoreField: "forgivenessReconciliationScore",
    trilha: "cultura de correção e reconciliação",
  },
];
