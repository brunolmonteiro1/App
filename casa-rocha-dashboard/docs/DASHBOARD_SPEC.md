# DASHBOARD_SPEC — Páginas, filtros, gráficos, drill-down e relatórios

## 1. Diretrizes de UI

- Visual limpo, minimalista, fundo claro, letras escuras, estilo corporativo; sem cores agressivas ou visual acusatório.
- Recharts para gráficos; TanStack Table para tabelas; shadcn/ui para componentes.
- Todo card/gráfico interpretativo exibe: badge de proveniência (`lexical`/`ai_coded`/`reviewed`), denominador ("de N codificadas") e tipo de métrica (presença/centralidade/densidade).
- Painéis interpretativos com codificação incompleta mostram banner "dados parciais — hipótese a validar".

## 2. Filtros globais (barra superior/lateral, persistidos na URL)

Filtro compartilhável por link (query params):

- **Ano** (2020–2026) e intervalo de datas (datas estimadas sinalizadas);
- **Série**; **Pregador**; **Tipo de pregação**;
- **Livro bíblico / Testamento** (do motor bíblico);
- **Bloco temático** e **tema específico**;
- **Faixa de score** (ex.: ortopraxia ≥ 4); **Confiança mínima**;
- **Status** (não codificada / IA / revisada);
- **Busca full-text** (FTS5) com trecho destacado nos resultados.

Todo filtro se aplica simultaneamente a todos os gráficos da página.

## 3. Regra de ouro — drill-down obrigatório

**«Nenhum dado pode ficar isolado da fonte.»**

Clique em qualquer ponto, barra, fatia, célula ou card abre painel/modal com:

- lista das pregações que geraram o dado (título, data — com selo de estimada —, série, link do YouTube);
- score e comentário analítico;
- **trechos destacados (snippets)** da transcrição usados como evidência;
- botão "abrir transcrição completa" (com evidência destacada via índices) e botão "abrir vídeo".

Limitação declarada: sem timestamps na transcrição, o vídeo abre no início; a evidência é textual.

## 4. Páginas

### P1 — Visão geral (`/dashboard`)
Cards: total de pregações · total de séries · anos cobertos · analisadas · revisadas · confiança média · principais temas · principais lacunas (rotuladas como hipótese até codificação completa).
Gráficos: pregações por ano · por série · status de codificação · distribuição por tipo de pregação.

### P2 — Acervo e fontes (`/sermons`)
Tabela interativa: título, série, ano, link, tipo de fonte, status da transcrição, status da análise, confiança. Busca global, filtros, abrir pregação, abrir YouTube, exportar CSV.

### P3 — Pregação individual (`/sermons/[id]`)
Título, série, ano/data (+confiança da data), link original, **transcrição completa com evidências destacadas**, resumo em 3 linhas, texto bíblico principal, referências bíblicas detectadas, temas, doutrinas, todos os scores com evidências e comentários, densidades lexicais da pregação, nível de confiança, badge de proveniência.

### P4 — Bíblia e homilética (`/dashboard/biblia`)
- Livros mais pregados (barras); AT × NT; textos recorrentes;
- **Mapa de cobertura da Bíblia**: grade dos 66 livros em ordem canônica, cor por nº de pregações que citam — evidencia livros nunca tocados (dado determinístico, camada regex);
- Tipo de pregação (distribuição); séries expositivas; exposição bíblica média por série.

### P5 — Ortodoxia (`/dashboard/ortodoxia`)
Radar doutrinário · ranking de doutrinas · doutrina × ano (heatmap) · doutrina × série · painéis de cristologia, soteriologia, pneumatologia, eclesiologia, escatologia.

### P6 — Ortopraxia (`/dashboard/ortopraxia`)
Prática cristã por tema (serviço, generosidade, missão, discipulado, família, trabalho, dinheiro) · aplicação prática por ano e por série · chamados concretos por tipo · lacunas de prática (como hipótese).
- **Painel Ontológico × Pragmático** (`ontologicalVsPragmatic` / `practicalMethodScore`, `CODEBOOK.md` §4b): barras empilhadas mostrando, por eixo/tema/ano, quanto do ensino é modo *ser* (identidade) vs *fazer* (método). É a lente mais direta para a hipótese central do projeto. Banner: "modo de ensino, não qualidade — score pragmático baixo pode ser opção homilética legítima".

### P7 — Ortodoxia × Ortopraxia (`/dashboard/equilibrio`)
Scatter plot por pregação (X = ortodoxia, Y = ortopraxia) com 4 quadrantes nomeados; filtro por ano/série; clique no ponto abre a pregação. Objetivo: visualizar se a formação de crença correta é acompanhada de prática estruturada.

### P8 — Espiritualidade (`/dashboard/espiritualidade`)
Oração · leitura bíblica pessoal · disciplinas espirituais · arrependimento · dependência de Deus · discernimento · santidade; distinção exortação × método devocional; presença de oração por ano.

### P9 — Comunidade e corpo (`/dashboard/comunidade`)
Imagens de igreja predominantes (corpo/família/mesa/hospital/auditório) · corpo × auditório · dons · mutualidade · liderança servidora · cuidado mútuo · sinais de necessidade de pequenos grupos.

### P10 — Missão e evangelismo (`/dashboard/missao`)
Missão por ano/série · evangelismo prático · apologética · missão local × global · presença pública · justiça e misericórdia · missão orgânica × programática × institucional.

### P11 — Vida cotidiana (`/dashboard/cotidiano`)
Casamento · filhos · família · trabalho · finanças · conflitos · saúde emocional · corpo · sexualidade — por ano e por série; temas recomendados para grupos/cursos (como hipótese).

### P12 — Cura, desconstrução e envio (`/dashboard/pastoral`)
Desconstrução religiosa por ano · reconstrução discipular por ano · acolhimento × envio · risco de passividade · **índice desconstrução × reconstrução** (gauge/barras comparativas ou scatter) · linha do tempo da linguagem (a crítica ao sistema mudou ao longo dos anos? o vocabulário de comunidade cresceu?).
- **Funil de maturidade**: acolhimento → cura/desconstrução → discipulado/reconstrução → envio → corresponsabilidade (barras/funnel dos scores do Eixo 8) — visualiza a hipótese de estágios iniciais fortes e finais fracos; só afirmável sobre dados `reviewed`.
- **Risco de cinismo/elitismo** (`cynicismElitismRiskScore`): distribuição por ano, com drill-down às evidências; rotulado como risco a monitorar, não acusação.

### P12b — Saturação Crítica (`/dashboard/saturacao`)
Módulo ISC (`CRITICAL_SATURATION.md`) — banner fixo: *"Métrica lexical — hipótese a validar; não mede intenção."*
- **Linha temporal**: média anual do ISC 2020–2026 com banda de dispersão e marcação de datas estimadas — a proporção de crítica caiu, manteve-se ou cresceu?
- **Scatter de pregações**: X = data, Y = ISC%; linha do limiar configurável; pontos `saturacao_alta` em cor de alerta; clique abre o sermão + snippets exatos do campo crítica;
- **Card comparativo**: "Em {ANO_A}, saturação crítica média (lexical) de {X}% ({n} pregações); em {ANO_B}, {Y}%" — verbo neutro, denominadores visíveis;
- Cruzamento ISC lexical × `religiousDeconstructionScore` codificado (validação convergente).

### P13 — Lacunas formativas (`/dashboard/lacunas`)
Tabela: tema · frequência (presença) · centralidade · score médio · evidências · recomendação pastoral · trilha sugerida. Só popula com dados `reviewed`; antes disso, exibe "hipóteses a validar".
Trilhas exemplo: grupos de cuidado, curso de oração, trilha de voluntariado, formação de discipuladores, aconselhamento financeiro, formação para família, missão local, discipulado básico, dons e serviço.

### P14 — Evidências auditáveis (`/evidence`)
Tabela filtrável: pregação · categoria · score · evidência textual · comentário · confiança · método (`analysisMethod`) · link para transcrição com destaque. Página essencial para auditoria do presbitério.

### P15 — Codificação (`/coding`)
Fila de pendências · montagem de lote (5–10) · geração do prompt · colagem/validação da resposta · fila de revisão side-by-side (ver `PIPELINE.md` §4–5).

### P16 — Qualidade de dados (`/settings/quality`)
Transcrições com flag de qualidade · conflitos JSON × TSV · fontes sem série identificada · datas com confiança baixa · análises desatualizadas (versão de codebook antiga) · log de importações.

### P17 — Cobertura vs. Igreja Saudável (`/dashboard/benchmark`)
Gap analysis contra a régua normativa de `HEALTH_BENCHMARK.md`. Para cada tema (textos-base, 5 áreas de saúde, taxonomia de ortodoxia):
- **presença** dos textos-base no corpus (motor bíblico — determinístico, disponível desde a Fase 2);
- **centralidade** do tema (codificação `reviewed` — quando disponível);
- matriz/heatmap tema × cobertura, com selo de proveniência e denominador;
- coluna de **trilha complementar** sugerida (grupos, curso de oração, aconselhamento financeiro, formação para família, missão local, discipulado básico…), sempre como hipótese e como complemento — nunca como crítica ao púlpito (`METHODOLOGY.md` §2b).
Banner fixo: *"Lacuna = hipótese a validar; pode aparecer fora do corpus dominical (grupos, cursos, Caminho das Letras)."*

## 5. Catálogo de gráficos obrigatórios

**Cards**: total de pregações · total analisado · total revisado · confiança média · principais séries · principais temas.

**Barras**: pregações por ano · por série · temas por frequência · doutrinas por frequência · práticas por frequência.

**Heatmaps**: tema × ano · doutrina × ano · prática × série · desconstrução × ano · reconstrução × ano · **heatmap de vocabulário** (termos-chave × ano/série, por densidade lexical).

**Radar**: os 8 eixos (saúde bíblica, ortodoxia, ortopraxia, espiritualidade, comunidade, missão, vida cotidiana, saúde pastoral) — geral, por ano e por série.

**Scatter**: ortodoxia × ortopraxia · desconstrução × reconstrução · acolhimento × envio · explicação bíblica × aplicação prática · pregações × ISC com linha de limiar (P12b).

**Saturação Crítica (ISC)**: linha temporal da média anual · scatter com limiar · card comparativo entre anos — ver P12b e `CRITICAL_SATURATION.md`.

**Dieta teológica** (proporção entre blocos): preferir **treemap ou barras empilhadas** a pie chart — temas coexistem na mesma pregação (uma pregação pode ser simultaneamente cristológica, soteriológica e eclesiológica); pie única esconde isso. Rotular a métrica usada (densidade ou score médio).

**Extras aprovados**:
- **Calendário heatmap** (estilo GitHub): pregações por domingo — ritmo e buracos visíveis; datas estimadas com marcação;
- **Comparador de séries**: radar sobreposto de 2–3 séries selecionadas;
- **Sparklines de vocabulário**: evolução anual de termos-chave (cruz, sistema, servir, família…);
- **Modo apresentação**: versão limpa e sequencial dos painéis para projeção na reunião do presbitério.

**Tabelas auditáveis**: pregações por categoria · evidências por score · lacunas formativas · recomendações pastorais.

## 6. Exportações

- CSV/Excel: pregações, análises, scores, evidências, referências bíblicas, métricas lexicais;
- Resumo executivo em Markdown; dashboard em PDF; relatório pastoral em DOCX (futuro);
- **Pacote de auditoria por afirmação**: cada frase do resumo executivo exporta acompanhada da lista de pregações + trechos que a sustentam.

## 7. Relatórios automáticos (`/reports`)

Somente sobre registros `reviewed`, citando versão do codebook e seção fixa de limitações (`METHODOLOGY.md` §8):

- **Resumo executivo**: principais forças · principais oportunidades de formação · evolução por ano · recomendações de trilhas;
- **Relatório por série**: resumo, textos bíblicos, doutrinas, temas pastorais, scores médios, evidências;
- **Relatório por tema** (ex.: família, serviço, missão, oração, generosidade, desconstrução religiosa): frequência, centralidade, evidências, pregações principais, oportunidades, recomendação pastoral;
- **Relatório de confiabilidade**: concordância da dupla codificação (kappa) por categoria.
