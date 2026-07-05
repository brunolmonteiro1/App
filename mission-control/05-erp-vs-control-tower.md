# Parecer: ERP novo vs. outras soluções — análise de consultor técnico

**Pergunta:** dado o problema da Transdesk, a resposta é um sistema novo tipo ERP que gerencie tudo, ou outra solução?

---

## 1. O fato que decide a questão antes de qualquer análise técnica

**A Transdesk é franqueada. Os sistemas que doem não são dela.**

Evidências da própria reunião:
- "Como franqueados, vocês são obrigados a usar a TAG?" → "A gente é obrigado para lançar o contrato."
- As tabelas de preço são parametrizadas pela matriz; a unidade só ajusta margem.
- A STCOP "não deixa a gente tirar o cliente de lá"; a análise de vistoria é da central do Grupo UNOS (Cascavel); a AutoVist e a Tracker são terceiros sem acesso da unidade.
- A estrutura regulatória (SUSEP, estipulante BVix) amarra onde o contrato juridicamente vive.

**Conclusão imediata:** um "ERP novo que gerencie tudo" não é uma opção disponível para a unidade — é uma decisão da matriz (Grupo UNOS/Vilesoft). A unidade pode construir por cima, ao lado, mas não no lugar. Qualquer proposta de substituição total vendida à unidade seria dinheiro jogado fora, porque o contrato continuaria obrigatoriamente sendo lançado na TAG.

## 2. O diagnóstico conceitual: eles não têm falta de ERP — têm falta de camada de operação

Vale separar dois papéis que estão sendo confundidos na dor:

| Papel | O que é | Quem tem hoje |
|---|---|---|
| **Sistema de registro** (system of record) | Onde o contrato existe juridicamente: apólice, matrícula, boleto, precificação | TAG (e resíduos em ViaVante/STCOP). Existe e funciona — mal, mas funciona |
| **Sistema de operação** (system of operation) | Onde o trabalho acontece: visão 360º do cliente, funil, cobrança, renovação, comissão, alertas, follow-up | **Não existe.** Hoje é a memória da Larissa e da Sanlla + planilhas + grupos de WhatsApp |

A dor relatada inteira — inadimplência sem alerta, renovação que o cliente lembra, comissão manual, orçamento parado, pós-venda zero — é dor de **sistema de operação ausente**, não de sistema de registro ruim. Trocar o registro (ERP novo) não cria a camada de operação; e criar a camada de operação não exige trocar o registro.

## 3. As quatro opções na mesa

| Opção | Custo | Prazo até valor | Risco | Veredito |
|---|---|---|---|---|
| **A. ERP novo substituindo tudo** | R$ 300k–1M+ (build) ou licenças pesadas (buy), migração de 3 bases que nunca foram migradas | 12–24 meses até o primeiro valor | Altíssimo: não é decisão da unidade; migração traumática; a matriz já provou não migrar dados (criou 3 sistemas em vez de versionar 1) | **Descartado para a unidade.** Só faz sentido como projeto DA MATRIZ — ver §5 |
| **B. CRM de mercado** (Pipedrive, Ploomes, RD, HubSpot) | R$ 100–500/usuário/mês | Semanas para o funil | Médio: vira o 5º silo se ninguém alimentar; não resolve consolidação das 3 bases, nem comissão multi-nível, nem vistoria; dupla digitação mata a adoção | Parcial. Pode entrar depois como *front* do funil, alimentado automaticamente pela camada de dados — nunca como solução isolada |
| **C. "Mini-ERP" próprio paralelo** | R$ 80–200k | 6–12 meses | Alto: dupla digitação TAG + sistema próprio → bases divergem em semanas → vira o quarto sistema arcaico da história (o mesmo erro da matriz, repetido pela unidade) | Descartado como ponto de partida |
| **D. Control Tower: camada de dados + automação + cockpit por cima da TAG** | US$ 2,5–4k (piloto) escalando por fases conforme ROI | **Semanas** | Baixo: read-only no início, não briga com a obrigação contratual de usar a TAG, cada fase se paga antes da próxima | **Recomendado — é o plano dos docs 01–04** |

## 4. Por que a opção D também responde ao desejo de "um CRM"

O que a Larissa pediu ("CRM para controle de vendas, das bases e das ativações") não é um CRM de prateleira — é exatamente o **cockpit da Fase C**: funil de orçamento→efetivação→vistoria→aceite→ativação, visão única do cliente consolidada por CPF/placa, comissões calculadas, alertas D+1. A sequência natural:

1. **Piloto (agora):** a "base unificada" nasce como planilha consolidada — inadimplência, renovações, comissões (docs 03–04);
2. **Fase B:** a planilha vira banco (Supabase) com coleta automática dos 3 sistemas — surge a **Visão Única do Cliente**, o dado que nenhum dos sistemas da matriz tem;
3. **Fase C:** em cima desse banco nasce o cockpit (o "CRM" pedido) — telas de funil, cobrança, renovação, comissão, aprovações. Nesse ponto a decisão *build vs. buy* do front de CRM pode ser revisitada com dados: se um Pipedrive alimentado automaticamente resolver o funil, ótimo (mais barato); o que é inegociável construir é a camada de dados consolidada, porque não existe à venda.

Efeito estratégico: a unidade passa a ser dona **do dado operacional consolidado** — o único ativo de tecnologia que a franquia pode possuir de verdade. E se um dia a matriz trocar o ERP, a Control Tower sobrevive: troca-se o coletor, mantém-se tudo o mais (o mesmo princípio de substituibilidade do Agent Gateway).

## 5. E o caminho "vender um ERP novo para a matriz"?

Na reunião, cogitou-se "vender a ideia para a matriz". Leitura honesta:

- É um **outro negócio**, de outra ordem de grandeza: um sistema de gestão de proteção veicular multi-franquia (matrícula, apólice, boleto, precificação, comissão multi-nível, vistoria, SUSEP) é projeto de 12–24 meses e 7 dígitos, competindo com o incumbente (Vilesoft) dentro da política do grupo.
- O caminho inteligente é o mesmo dos docs: **a Control Tower da unidade é a prova de conceito viva.** Dashboards funcionando, inadimplência caindo, renovação subindo em uma franquia valem mais que qualquer proposta em PDF para a matriz — e o produto da Fase C (multi-tenant) já nasce replicável para outras unidades/corretoras, que é a tese de produtização do próprio briefing.
- Em paralelo, custo zero: **reportar à matriz os defeitos que são dela** (relatórios de comissão quebrados, relatório de rastreador sem filtro sim/não, link de vistoria sem visibilidade da unidade). São correções triviais do fornecedor que, se saírem, só facilitam a Control Tower.

## 6. Resposta em uma frase

**Não é ERP novo: é uma camada de operação e inteligência por cima do ERP que já existe** — porque o ERP não é da unidade para ser trocado, porque a dor real é de operação e não de registro, e porque essa camada entrega valor em semanas, se paga por fase e ainda se torna o ativo replicável que a unidade pode, aí sim, um dia vender para a matriz e para o mercado.
