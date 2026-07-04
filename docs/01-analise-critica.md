# Análise Crítica — Norton Impact

> Baseada nos 10 documentos estratégicos fornecidos (blueprints, briefing de produto v2,
> RFQ v3, proposta comercial Codegang e 5 decks). Opinião honesta: o que está forte,
> o que preocupa e o que eu mudaria.

## 1. Veredicto geral

A tese é **boa e está bem amadurecida**. Os documentos mostram uma evolução clara de
"app de caridade por km" para **infraestrutura B2B2C de campanhas**, e as decisões
técnicas centrais estão corretas. O maior risco do projeto hoje **não é técnico — é
comercial e operacional**: nenhum documento indica uma empresa-piloto assinada, e a
operação (curadoria de ONGs, CS de campanha) é trabalho humano que nenhum app resolve.

## 2. O que está forte (manter)

| Decisão | Por que está certa |
|---|---|
| **Pivotagem Strava → nativo (HealthKit/Health Connect)** | As restrições da API do Strava (2024+) realmente inviabilizam leaderboards e dashboards com dados de terceiros. Fontes nativas do SO são gratuitas, universais e estáveis. |
| **`ActivityRecord` interno source-agnostic** | É A decisão arquitetural do projeto. Desacopla o produto de qualquer fornecedor de dados e habilita auditoria, antifraude e ranking proprietários. |
| **Verba fechada + marcos de liberação (25/50/100%)** | Elimina o risco de passivo ilimitado ("R$1/km") que mataria a venda B2B. Fácil de explicar ao jurídico do patrocinador. |
| **Separação fee tecnológico × verba de doação (repasse direto empresa→ONG)** | Elegante: a plataforma nunca toca o dinheiro da doação. Evita bitributação, intermediação financeira regulada e risco reputacional. |
| **Pontos de Impacto nunca sacáveis** | Mitiga o enquadramento como loteria/sorteio (relevante no Brasil) e mantém o programa como fidelidade/performance. |
| **Cliente pagante = empresa (B2B)** | Doação B2C pulverizada não sustenta o negócio; verba de RH/ESG/marketing sustenta. Os benchmarks (Impact App) confirmam. |
| **Antifraude por regras na Fase 1** (capping, plausibilidade, dedup, revisão manual) | Proporcional ao risco do MVP. ML seria over-engineering agora. |
| **Mobile-first com web só como landing** | O comportamento central (permissões de saúde, tracking passivo, streaks, push) só existe no celular. Correto. |

## 3. O que preocupa (riscos e lacunas)

### 3.1 Comercial antes do código (risco nº 1)
Os docs descrevem a Fase 0 como "validação comercial", mas não há evidência de
empresa-piloto ou ONG assinada. **Construir o MVP inteiro antes de ter um piloto
vendido é o erro clássico.** Recomendação: usar o protótipo navegável (APK demo com
dados fictícios — que já estamos gerando neste repositório) + landing page para fechar
o piloto **antes** de investir nos 3 meses de build completo.

### 3.2 A proposta Codegang (US$ 3.000 / 3 meses) é barata demais
O escopo P0 dos próprios documentos inclui: 2 apps nativos, backend com motor de
desafios/ligas/impacto, antifraude, admin, relatórios CSV/PDF, landing page, QA e
publicação. Isso é trabalho para uma equipe de 3-5 pessoas por 3 meses; a preços de
mercado (mesmo na Índia) valeria 10-30× o cotado. Preço irrealista costuma significar:
corte de qualidade invisível (sem testes, sem hardening), atrasos, aditivos de escopo
("change requests") ou abandono. **Não é golpe necessariamente — mas é sinal de
alerta.** Opções, na minha ordem de preferência:
1. **Construir internamente com Claude Code** (custo marginal ~zero além do seu tempo
   de revisão), mantendo a Codegang como opção para QA em dispositivos reais / release.
2. Negociar com a Codegang um escopo menor e verificável (ex.: só o Milestone 1) antes
   de comprometer os 3 meses.
3. Se contratar: exigir código no SEU repositório desde o dia 1, CI verde, builds
   testáveis a cada milestone (o RFQ já prevê isso — usar).

### 3.3 Tracking em background no Android é o maior risco técnico
Fabricantes (Xiaomi, Samsung, etc.) matam apps em background agressivamente. Passos
"passivos" via Health Connect mitigam isso (quem conta é o SO, não o app), mas a
sincronização continua dependendo do app acordar. Mitigações: sync no app-open +
WorkManager periódico + instruções por fabricante (o briefing já prevê) + não prometer
"tempo real" ao patrocinador — prometer "consolidado diário".

### 3.4 Confiabilidade e comparabilidade dos dados
Passos variam por aparelho/sensor; iPhone + Apple Watch contam diferente de um Android
de entrada. Para rankings corporativos isso gera contestação. Mitigações: ranking por
**pontos** (não passos brutos), capping, e regras claras no FAQ. Já previsto nos docs —
manter como requisito inegociável.

### 3.5 A operação é gente, não software
Curadoria de ONGs (Instituto Vosz), CS ativo de campanha, moderação de rankings,
prestação de contas com evidências — os decks descrevem isso corretamente como
"setores", mas são custo operacional recorrente que não escala com código. Para o MVP:
1 ONG, 1 empresa, 1 campanha. Não montar processo para 30 ONGs antes do primeiro piloto.

### 3.6 LGPD é estrutural, não um slide
Dados de saúde são **dados sensíveis** (art. 11). Isso exige: consentimento específico
e destacado, finalidade explícita, dashboards B2B exclusivamente agregados (já
previsto), opt-in para ranking nominal (já previsto), processo de exclusão de conta e
dados, e DPO/encarregado nomeado. Incluí esses itens como requisitos no blueprint — não
podem ficar para "depois do piloto", porque a empresa patrocinadora vai perguntar.

### 3.7 O escopo P0 ainda é grande — dá para cortar mais
Para validar a tese bastam: login, permissão de saúde, 1 campanha com 1 causa, pontos,
ranking, liga por código e relatório simples. Times, loja/moedas, badges elaborados,
GPS workout completo e iOS podem entrar depois do primeiro piloto Android. O roadmap
(doc 03) reflete esse corte em "MVP piloto" vs "MVP completo".

## 4. Perguntas em aberto (dos próprios documentos)

Estas perguntas dos docs continuam sem resposta e afetam o desenvolvimento — registradas
em [04-decisoes.md](04-decisoes.md):

1. Nome comercial: Norton, Quilômetro Solidário ou outro? (Há risco de marca com
   "Norton" — colide com a marca global de antivírus; vale checagem no INPI antes de
   investir em identidade.)
2. Piloto: qual empresa, qual ONG, doação real ou demonstrativa?
3. Métrica do piloto: km, passos, treino, streak — ou tudo?
4. Piloto aberto ao público ou somente por convite/código?
5. Closed testing basta para o piloto ou precisa de release pública?

## 5. Resumo da opinião

- **Tese**: validada nos benchmarks, bem construída. Seguir.
- **Sequência**: vender o piloto com protótipo antes de construir tudo.
- **Codegang**: não fechar os US$3k sem as salvaguardas da seção 3.2; alternativa
  preferida é construir internamente com Claude Code.
- **Técnica**: as decisões dos docs estão certas; os riscos reais são background sync
  no Android, comparabilidade de dados e LGPD.
- **Escopo**: cortar o P0 para "1 empresa, 1 causa, 1 campanha, Android primeiro".
