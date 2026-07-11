# ROADMAP — Fases, critérios de aceite e estrutura do projeto

## 1. Estrutura de pastas do app Next.js

```
casa-rocha-dashboard/
  CLAUDE.md
  docs/                      # esta documentação
  data/
    raw/                     # A Casa da Rocha-backup-2026-07-10.json (canônico)
    processed/               # CSVs exportados
  app/
    dashboard/               # P1 + páginas P4–P13 (subrotas)
    sermons/                 # P2
    sermons/[id]/            # P3
    coding/                  # P15
    evidence/                # P14
    reports/                 # relatórios
    settings/                # P16 qualidade de dados, codebook
  components/
    charts/  tables/  filters/  sermon/  coding/
  prisma/
    schema.prisma            # ver DATA_MODEL.md
  scripts/
    import-notebooklm-backup.ts
    detect-biblical-references.ts
    run-lexical-analysis.ts
    export-csv.ts
    generate-analysis-template.ts
  lib/
    db.ts  parsing.ts  scoring.ts  text-utils.ts  codebook.ts  bible-books.ts
```

## 2. Ordem obrigatória de desenvolvimento

1. Criar projeto base (Next.js + TS + Tailwind + shadcn/ui + Prisma/SQLite).
2. Criar schema de dados (`DATA_MODEL.md`).
3. Script de importação do JSON — incluindo extração do TSV embutido.
4. Cruzar fontes × TSV por YouTube ID (com alertas de conflito).
5. Tabela `sermons` populada; listagem e página individual.
6. Tabelas `sermon_scores` e `sermon_evidence`.
7. Dicionários temáticos (seed do codebook).
8. Análise lexical inicial + motor bíblico (camadas 0–1).
9. Snippets por tema.
10. Dashboard básico.
11. Drill-down.
12. Tela de codificação e revisão humana.
13. **Só depois**: relatórios e conclusões pastorais.

Não começar pelo relatório. Não começar por conclusões. Não inventar percentuais. Não chamar hipótese de resultado.

## 3. Fases

### Fase 1 — Importador e banco ✅ (implementada em 2026-07-10)
Configurar projeto · schema Prisma · importar JSON (com idempotência e ImportRun) · listar fontes · abrir transcrições.
Resultado: 266 fontes / 263 pregações importadas; re-importação idempotente verificada.

### Fase 2 — Tabela e busca ✅ (implementada em 2026-07-10)
Tabela com filtros (TanStack) · busca full-text (FTS5) · filtros por série/ano/tipo · página individual da pregação · motor bíblico (regex) + análise lexical (dicionários, densidade/10k, snippets) — camadas determinísticas completas.
Resultado: 1.510 referências bíblicas detectadas; 9.138 métricas lexicais; ISC calculado para 263 pregações; deploy via Docker (`INSTALL.md`).
Decisões de MVP: busca com SQL `LIKE` (FTS5 fica para otimização futura); tabela server-rendered (TanStack quando a tela de codificação chegar); shadcn/ui adiado para a Fase 3; gráficos com Recharts e paleta validada.

### Fase 3 — Codebook e codificação ✅ (implementada em 2026-07-11)
Seed do codebook (régua 0–5 + dicionários) · tela `/coding` · geração de prompt de lote · validação Zod da resposta · cadastro de scores e evidências · fila de revisão humana side-by-side.
Resultado: codificação por IA **via OpenRouter dentro do sistema** (modelo escolhível na UI, chave via `OPENROUTER_API_KEY`), uma pregação por requisição, validação anti-alucinação (citação localizada literalmente na transcrição, com índices reais) e revisão humana em `/coding/review/[id]`. Fluxo manual de colar prompt foi descontinuado. Catálogo canônico de scores em `lib/coding/score-fields.ts` (substitui o seed de `CodebookCategory` no MVP).

### Fase 4 — Dashboard básico ✅ (implementada em 2026-07-11)
Visão geral · séries · anos · Bíblia/homilética (mapa de cobertura) · ortodoxia · ortopraxia · saúde pastoral — com badges de proveniência e denominadores.
Resultado: `/dashboard/equilibrio` (scatter ortodoxia×ortopraxia com quadrantes e drill-down + radar dos 8 eixos), `/dashboard/pastoral` (funil de maturidade, desconstrução×reconstrução, riscos de passividade/cinismo, modo ser×fazer), `/evidence` (P14 — evidências auditáveis filtráveis). Todos com banner de denominador, filtro "só revisadas" e estado vazio que aponta para `/coding`. Mapa de cobertura da Bíblia (P4) fica para a Fase 5.

### Fase 5 — Dashboard avançado
Heatmaps · scatter plots com quadrantes · radar dos 8 eixos · calendário heatmap · comparador de séries · sparklines de vocabulário · drill-down completo · página de evidências auditáveis · página de qualidade de dados.

### Fase 6 — Relatórios
Resumo executivo · relatório por série · relatório por tema · relatório de confiabilidade (kappa) · pacote de auditoria por afirmação · exportações (CSV/Markdown/PDF) · modo apresentação.

## 4. Critérios de aceite do MVP

O MVP está pronto quando:

1. O app importa o JSON do NotebookLM (com TSV embutido, idempotente).
2. As fontes aparecem em tabela.
3. Cada fonte abre com título, link e transcrição.
4. O app permite cadastrar análise manual.
5. O app permite salvar scores 0–5.
6. O app permite salvar evidências textuais (com posição no texto).
7. O dashboard mostra pelo menos: pregações por série · por ano · scores médios por eixo · ortodoxia × ortopraxia · desconstrução × reconstrução · lacunas formativas (como hipótese).
8. Todo gráfico permite clicar e abrir as pregações relacionadas.
9. A aplicação exporta CSV.
10. **Nenhum percentual final aparece sem base em dados codificados** (denominador e proveniência visíveis).

## 5. Evolução pós-MVP

- Migração SQLite → PostgreSQL/Supabase (multiusuário, deploy);
- codificação via API em batch (além do fluxo colar-prompt);
- embeddings/clustering para descoberta temática;
- visualizações do YouTube via API (coluna pendente no TSV);
- relatório DOCX;
- importação de novos backups do NotebookLM (pregações futuras) como rotina.
