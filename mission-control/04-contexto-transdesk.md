# Contexto Transdesk — o que a reunião e o briefing mudam no plano

**Fontes:** transcrição da reunião de 30/04 (Bruno, Sanlla, Larissa) + "Transdesk Operational Transformation and AI Strategy Briefing". Este doc revisa os docs 01–03 à luz do contexto real da operação.

---

## 1. O mapa real dos sistemas (mais preciso que o dos docs anteriores)

| Sistema | Situação | Papel |
|---|---|---|
| **TAG** | Atual, obrigatório para contratos novos | Orçamentos, contratos, relatórios de inadimplência. BH usa só TAG; SP usa os três. Ainda sem renovações (menos de 1 ano de uso) |
| **ViaVante** | Em extinção — proibido lançar contrato novo; carteira migrando; prevista vazia ~out/2026 | Contratos ativos remanescentes, renovações |
| **STCOP** | Antigo mas vivo — matriz não permite tirar clientes; precisa girar caixa próprio | Contratos ativos, inadimplência, renovações |
| **SegTruck** | Morto | Histórico apenas |
| **Vilesoft** | Fornecedor por trás dos três sistemas — são espelhos um do outro ("Ctrl C, Ctrl V de base") | — |
| **AutoVist** | Terceiro, vistoria por link mobile por placa | A unidade **não vê** as fotos enviadas; contratos voltam 5–7× por foto recusada |
| **Tracker** | Terceiro (rastreador), OS e agendamento | Sem autonomia para integrar; relatório vem com instalados + pendentes misturados (11 págs de PDF) |
| **SplitSafe** | Base de pagamento de comissões | Chega por e-mail |

**Consequência técnica boa:** como TAG/ViaVante/STCOP são espelhos do mesmo produto Vilesoft, **um único script de coleta (Playwright) provavelmente serve para os três**, mudando URL e credencial — reduz o custo da Fase B.

**Acesso:** a equipe vai fornecer login próprio (escopo por unidade) para exploração — cenário melhor que o "login master único" dos docs iniciais, mas as mesmas regras de segurança valem (read-only, allowlist, sessão gravada).

## 2. Dores confirmadas + dores novas que os docs 01–03 subestimavam

Confirmadas: inadimplência sem visão única (puxa 4+ relatórios só na TAG), renovação manual ("o cliente é quem lembra a gente"), orçamento campo a campo do CRLV (frota de 20 placas = 20× o ciclo), retrabalho de vistoria.

**Novas / subestimadas:**

1. **Cliente pulverizado entre bases** ("Sr. Benedito" em 4 sistemas; "Robson" com contratos espalhados — para dizer onde ele está inadimplente, confere-se 3 sistemas). A consolidação por **CPF/CNPJ + placa** é o coração do valor, não um detalhe.
2. **Comissionamento sem governança** — foi a resposta da Larissa quando pediram *a* urgência para registro: relatório de contratos ativos com vigência, vencimento, mensalidade e margem, para calcular comissão de **consultor / micro A / micro B / master**. Os relatórios nativos de comissão simplesmente não funcionam. É matemática determinística sobre um export — cabe no piloto.
3. **Fim de contrato invisível** — cliente paga a 12ª parcela e ninguém percebe que acabou ("paguei o último boleto, não vai ter mais?"). Sinal de renovação que vem do relatório de parcelas, não só da data de vigência.
4. **Relatório de rastreador poluído** — filtrar instalado=sim/não é trivial e economiza a "pescaria" em PDF. Quick win.
5. **Pós-venda/cross-sell inexistente** (pneu, consórcio, vida, aniversário) — 4.000+ clientes sem nenhum toque programado. Fase B/C.

## 3. O escopo do piloto, revisado (continua 30 dias, continua read-only)

| # | Job | Mudança vs. docs 01–03 |
|---|---|---|
| 1 | **Inadimplência consolidada D+1** | Agora lê **3 exports** (TAG, ViaVante, STCOP) e consolida por CPF/CNPJ+placa numa visão única por cliente — resolve o "caso Robson" |
| 2 | **Renovações 30/60/90 + fim de parcelas** | Fontes principais são ViaVante/STCOP (TAG ainda não renova); adiciona detecção de "última parcela paga/próxima" |
| 3 | **Comissionamento** *(novo — era a urgência nº 1 da Larissa)* | Do export de contratos ativos: comissão por consultor/micro A/micro B/master, conferível contra o SplitSafe |
| 4 | **Fila de rascunhos + morning brief** | Igual ao planejado (Message Queue pending + resumo 08:00 no Telegram) — o "Agente de Dashboard Diário" do briefing |
| + | Filtro do relatório de rastreador | Quick win embutido, custo ~zero |

**Sai do piloto** (vai para Fase B/C): follow-up de orçamentos em grupos de WhatsApp (exige ler grupos — mais invasivo), **Plate-to-Data** (OCR de CRLV + consulta de placa para pré-preencher orçamento) e **Vistoria Inteligente** (pré-validação de foto antes do envio à AutoVist — depende de obter as regras de recusa da matriz). São as maiores dores *comerciais*, mas precisam de mais acesso/integração; entram assim que o piloto provar o modelo.

## 4. Onde o briefing técnico merece correção (mesma linha do doc 01)

- **"OpenClaw como orquestração + heartbeat a cada 30 min":** para jobs determinísticos e diários, um **cron do n8n é melhor que acordar um agente LLM de meia em meia hora** — mais barato, mais estável, auditável. LLM entra onde há linguagem ou visão: redigir cobrança personalizada, analisar foto de vistoria, ler CRLV. Toda a seção de economia de tokens do briefing (fallbacks, caching, budget caps) fica quase irrelevante na v1 porque a v1 usa ~zero tokens — que é o melhor controle de custo possível.
- **Roteamento de modelos:** correto em espírito (barato para tarefas simples, forte para raciocínio). Nota: os nomes citados no briefing estão desatualizados; definir modelos na fase em que LLM realmente entrar.
- **A tese Control Tower em si está certa** e é idêntica ao plano AI Mission Control: camada por cima dos legados, read-only primeiro, humano no loop, produtizável depois (a visão "vender resultado a outras corretoras" = exatamente a Fase C multi-tenant dos docs 01–03).

## 5. Riscos adicionais que o contexto revela

| Risco | Mitigação |
|---|---|
| Chave de consolidação suja (mesmo cliente com CPF grafado diferente/ausente entre bases) | Job 1 gera aba "pendências de unificação" para revisão humana em vez de casar automático no escuro |
| ViaVante esvazia até ~out/2026 | Coletor da ViaVante é descartável — não investir além do export simples |
| Scope creep (a reunião lista 10+ dores; todas são reais) | Piloto travado nos 4 jobs; o resto entra no funil de fases com gate de ROI |
| Regras de comissão não documentadas (margens por consultor/micro) | Fase 0 do briefing (playbook, dias 1–5) inclui a Larissa ditando as regras uma vez — viram config, não código |
