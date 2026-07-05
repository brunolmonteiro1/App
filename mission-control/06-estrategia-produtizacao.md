# Estratégia de produtização — da dor da unidade ao produto vendido à matriz

**Tese:** construir a Control Tower resolvendo a operação da Transdesk (unidade), e revender a solução ao Grupo UNOS (matriz) e, depois, ao mercado de proteção veicular. Este doc define o que torna isso executável — e as armadilhas que podem matar a venda.

---

## 1. Por que a tese é boa (e por que a ordem importa)

A sequência unidade → matriz → mercado é a única que funciona aqui:

1. **A unidade é o laboratório perfeito:** tem a dor, tem urgência, dá acesso, e o dono do problema (Sanlla/Larissa) participa do desenho. Custo de erro baixo.
2. **A venda à matriz é uma venda por evidência, não por proposta.** O Grupo UNOS já tem fornecedor (Vilesoft) e inércia. O que fura isso não é PDF: é uma franquia com inadimplência recuperada, renovação subindo e números auditáveis por 90 dias. O case É o pitch.
3. **O produto que a matriz compraria já é o que estamos desenhando:** a Fase C do plano (docs 02–03) é multi-tenant por construção — cada franquia = um tenant. Vender para a matriz é, tecnicamente, "ligar mais tenants e um painel consolidado do grupo". Nada precisa ser reescrito.

## 2. O que exatamente a matriz compraria

Não vender "um sistema novo" (ameaça ao Vilesoft, briga política). Vender a **camada que o Vilesoft nunca vai fazer**, módulo a módulo, cada um resolvendo um defeito que a própria matriz reconhece:

| Módulo (produto) | Dor que resolve | Quem sente |
|---|---|---|
| Cobrança D+1 consolidada | Inadimplência reativa em N bases | Unidade + matriz (receita) |
| Radar de renovação | Carteira perdida por silêncio | Unidade + matriz |
| Motor de comissões | Relatórios de comissão quebrados; consultor/micro A/micro B/master manual | Todas as franquias |
| Visão Única do Cliente | Cliente pulverizado entre TAG/ViaVante/STCOP | Todas as franquias + matriz |
| Plate-to-Data | Orçamento digitado campo a campo do CRLV | Comercial de todas as unidades |
| Vistoria Inteligente (pré-check IA) | Contratos voltando 5–7× por foto | Unidades + a própria central de análise (Cascavel) |
| Cockpit do grupo | Zero visibilidade consolidada das franquias | Diretoria da matriz |

Posicionamento: **complemento operacional, não substituto** — "seus sistemas continuam sendo o registro; nós somos a operação e a inteligência". Isso desarma a defesa do incumbente e deixa a porta aberta para, com confiança construída, expandir o escopo.

## 3. As três armadilhas que decidem o jogo (resolver ANTES de escalar)

### 3.1 Propriedade intelectual — a mais importante
Se isso vai virar produto, **a titularidade do código, da marca e do modelo de dados precisa nascer na entidade certa** (a empresa do Bruno/veículo próprio — não "da Transdesk", não informal). Transdesk entra como **design partner**: cliente fundador, com desconto vitalício/participação combinada em troca do acesso, do domínio operacional e do case. Isso se resolve com um contrato simples AGORA — depois que a coisa vale dinheiro, vira briga.

### 3.2 Base legal do acesso — o que pode contestar a venda
Hoje o plano usa logins da unidade para ler dados dos sistemas da matriz. Para o piloto read-only da própria operação, razoável. Mas antes de escalar:
- **Checar o contrato de franquia**: cláusulas sobre dados, sistemas e ferramentas de terceiros;
- **LGPD**: os titulares são clientes finais; a unidade é operadora/controladora conforme o caso — a camada precisa de bases de tratamento claras (execução de contrato/legítimo interesse para cobrança e renovação);
- **Estratégia inteligente**: informar a matriz cedo, em tom de "estamos otimizando nossa operação" (o que é verdade). O pior cenário para a venda futura é a matriz descobrir uma ferramenta paralela raspando seus sistemas sem conhecimento. O melhor cenário: ela acompanhar os resultados com curiosidade crescente.

### 3.3 Sequência política
1. **Meses 0–2:** piloto na unidade, silencioso, read-only, resultados medidos;
2. **Meses 2–4:** Fase B + números consolidados; em paralelo, reportar à matriz os defeitos que são dela (relatórios quebrados, filtros) — gera goodwill e mapeia os interlocutores técnicos;
3. **Meses 4–6:** case pronto (R$ recuperado, renovações salvas, horas economizadas) + demo do cockpit → reunião com a diretoria (o "Jonathan"/diretor-geral citado na reunião) propondo **piloto pago em 2–3 franquias**;
4. **Depois:** contrato de grupo (todas as unidades) e, com a marca validada, mercado aberto (outras corretoras/associações — a tese "AI Native Service" do briefing).

## 4. Modelo comercial recomendado

- **Para a unidade (agora):** projeto por fases (doc 03) — a unidade paga o build do que a serve.
- **Para a matriz (depois):** SaaS por franquia/mês (previsível, escala com o grupo) **ou** o modelo por resultado do briefing (% da inadimplência recuperada / renovação salva). Recomendação: **híbrido** — mensalidade base por unidade + success fee nos módulos de recuperação. Por resultado puro é ótimo discurso, mas depende de atribuição limpa (quem recuperou: o robô ou a Larissa?); o híbrido protege a margem.
- **Para o mercado (fase 3):** o mesmo multi-tenant, white-label, com onboarding por templates (já previsto na Fase C4).

## 5. O que muda no plano técnico por causa dessa tese

Quase nada — o plano já foi desenhado para isso (substituibilidade, multi-tenant, gateway). Três reforços:

1. **Modelo de dados nasce com o domínio completo**, mesmo que o piloto use 10% dele: organização → unidade/franquia → cliente → matrícula → contrato → placa → parcela → comissão (multi-nível) → vistoria. É o schema que o mercado inteiro de proteção veicular usa — é ele que faz o produto ser vendável além da Transdesk;
2. **Métricas de ROI instrumentadas desde o dia 1** (R$ em atraso identificado, R$ recuperado pós-contato, renovações salvas, horas economizadas): são o material de venda para a matriz — sem elas não há case, só anedota;
3. **Tudo tenant-scoped desde a migração 001** (já era regra) — a venda à matriz é literalmente criar novos tenants.

## 6. Resposta em uma frase

Sim — e o caminho já está montado: resolver a Transdesk por fases que se pagam, com IP na entidade certa, acesso juridicamente limpo e ROI instrumentado, para que em ~6 meses a conversa com a matriz não seja "temos uma ideia", e sim **"isso já roda numa franquia de vocês; aqui estão os números; querem para as outras?"**.
