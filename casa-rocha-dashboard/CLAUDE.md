# CLAUDE.md — Dashboard de Saúde Teológica e Formação Pastoral — A Casa da Rocha

Instruções de projeto para sessões do Claude Code. Leia este arquivo antes de qualquer implementação neste subprojeto.

## O que é este projeto

Um produto de dados (não uma análise em texto): aplicação web interativa que importa o backup do NotebookLM com 266 fontes (263 pregações do YouTube com transcrição completa, 2020–2026) da igreja A Casa da Rocha, estrutura cada pregação em banco de dados, permite codificação teológica/pastoral com evidências textuais e gera dashboards auditáveis com drill-down até a fonte.

Metáfora do produto: **um "exame de sangue" pastoral** — não acusa, não julga intenção, não inventa dado; mostra padrões, mostra evidências e permite clicar e conferir a fonte original.

Pergunta central: *«A Casa da Rocha está formando uma igreja saudável em ortodoxia, ortopraxia, espiritualidade, comunhão, missão, maturidade e corresponsabilidade?»*

## Ordem obrigatória de desenvolvimento

1. **Primeiro** construir a base auditável (banco, importação, telas, codebook).
2. **Depois** codificar as pregações (lexical → IA em lotes → revisão humana).
3. **Só depois** gerar percentuais finais e conclusões pastorais.

**Nunca** começar pelo relatório. **Nunca** inventar percentuais. **Nunca** chamar hipótese de resultado. Sem essa ordem, o projeto volta ao problema do NotebookLM: "resumir tudo" sem base auditável.

## Princípio pastoral (linguagem)

O projeto NÃO avalia o pregador como pessoa, nem julga intenção, espiritualidade privada, caráter ou motivação. É um raio-x da dieta formativa da igreja.

Linguagem proibida: "o Zé não prega sobre isso", "o púlpito falha", "a igreja é passiva", "o povo está acomodado", "isso está errado", "o vazio pragmático".

Linguagem correta: "ênfases observadas", "dieta formativa", "padrões recorrentes", "lacunas metodológicas", "oportunidades de formação", "trilhas complementares", "hipótese a validar", "a confirmar após codificação completa", "presença baixa nos dados codificados", "hipótese de baixa centralidade em Ortopraxia estruturada".

## Regras metodológicas inegociáveis

1. Não inventar percentuais — todo dado final vem de pregações codificadas.
2. Não inferir intenção do pregador.
3. Não transformar ausência de tema em acusação.
4. Não usar "sempre/nunca/quase nunca" sem contagem.
5. Separar sempre **presença**, **centralidade** e **densidade** (ver `docs/METHODOLOGY.md`).
6. Todo score 4–5 exige evidência textual; score 0 em tema importante = "não identificado nesta pregação".
7. Toda análise tem campo de confiança e selo de proveniência (`lexical`/`ai_coded`/`reviewed`).
8. Todo gráfico permite drill-down até as pregações e trechos que geraram o dado.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite (MVP) → PostgreSQL/Supabase (deploy futuro)
- Recharts (gráficos) + TanStack Table (tabelas)
- Scripts de importação/NLP em TypeScript (Node); validação de JSON de codificação com Zod
- UI limpa, minimalista, fundo claro, estilo corporativo, sem cores agressivas

## Dados

- Fonte canônica: `data/raw/A Casa da Rocha-backup-2026-07-10.json` (backup NotebookLM, 266 fontes).
- O CSV de metadados (`casadarocha_ze_bruno_preliminar.csv`) está **embutido no JSON** como fonte `SOURCE_TYPE_TEXT` — o importador extrai JSON e TSV do mesmo arquivo.
- Detalhes e limitações: `docs/DATA_AUDIT.md`.

## Documentação (ler antes de implementar cada área)

| Doc | Conteúdo |
|---|---|
| `docs/BLUEPRINT.md` | Visão do produto, hipótese pastoral, 8 eixos de análise |
| `docs/DATA_AUDIT.md` | Inspeção real dos dados, estruturas, limitações |
| `docs/DATA_MODEL.md` | Schema Prisma: sermons, analysis, scores, evidence, codebook, biblical_references |
| `docs/CODEBOOK.md` | Régua 0–5, categorias por eixo, eixo transversal ontológico×pragmático, dicionários temáticos |
| `docs/THEOLOGY_BASELINE.md` | Padrão confessional de referência (lido em runtime no prompt; editável pelo presbitério) |
| `docs/HEALTH_BENCHMARK.md` | Régua normativa "igreja saudável": textos-base, áreas de saúde, gap analysis (P17) |
| `docs/METHODOLOGY.md` | Presença/centralidade/densidade, camadas de proveniência, kappa, hipótese vs conclusão, fora de escopo |
| `docs/PIPELINE.md` | Importação, motor bíblico, NLP, codificação IA em lotes, revisão humana |
| `docs/CRITICAL_SATURATION.md` | Módulo ISC: proporção crítica ao sistema × Evangelho, limiar configurável, página P12b |
| `docs/DASHBOARD_SPEC.md` | Páginas, filtros, gráficos, drill-down, exportações, relatórios |
| `docs/ROADMAP.md` | Fases 1–6, critérios de aceite do MVP, estrutura de pastas |
| `docs/BLUEPRINT_MESTRE_v2.md` | Especificação canônica v2 (reparo seguro, tentativas auditáveis, campos contextuais, Master View) |
| `docs/BLUEPRINT_V2_ADEQUACAO.md` | **Ler antes de implementar o v2**: avaliação crítica, adaptações decididas e plano por rodadas (tem precedência operacional sobre o v2) |
