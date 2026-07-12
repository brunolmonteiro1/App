// Rubrica executável por categoria — a "base teológica" do sistema.
// Fonte única usada no prompt (via prompt.ts). CODEBOOK.md é a referência conceitual;
// esta rubrica é o que o modelo efetivamente recebe, para não depender do treinamento dele.
// Formato: distinção operacional entre 1–2 (menção), 3 (moderado) e 4–5 (forte/central).

export const RUBRIC: Record<string, string> = {
  // ── Eixo 1 — Saúde bíblica e homilética ──────────────────────────────
  biblicalHealthScore:
    "Qualidade geral do uso da Bíblia. 1-2: texto lido mas abandonado, ou versículos soltos como enfeite. 3: texto conduz parte da mensagem. 4-5: o texto bíblico governa a estrutura e as conclusões da pregação.",
  homileticExpositionScore:
    "O texto é EXPLICADO no seu contexto (histórico/literário) ou só usado como ilustração/pretexto? 1-2: uso ilustrativo. 3: alguma explicação contextual. 4-5: exegese real — contexto, propósito do autor, às vezes original grego/hebraico.",
  christocentricReadingScore:
    "A leitura aponta para Cristo como centro da Escritura (sem alegoria forçada)? 1-2: Cristo mencionado ao final. 3: conexão cristológica desenvolvida. 4-5: o texto é lido explicitamente como testemunho de Cristo (ex.: AT lido como promessa que aponta para Jesus, não como moral de personagens).",
  biblicalApplicationScore:
    "O texto gera aplicação para o ouvinte? 1-2: nenhuma ou genérica ('creia mais'). 3: aplicação clara mas ampla. 4-5: aplicação específica ligada ao texto exposto.",

  // ── Eixo 2 — Ortodoxia ───────────────────────────────────────────────
  theologyProperScore:
    "Doutrina de Deus (teontologia): caráter, soberania, eternidade, santidade do Pai. 1-2: Deus citado sem desenvolvimento doutrinário. 3: um atributo desenvolvido. 4-5: quem Deus é estrutura a mensagem.",
  trinityScore:
    "Trindade: relação Pai-Filho-Espírito ensinada como tal. Não pontue alto só porque as três pessoas são citadas — 4-5 exige a RELAÇÃO trinitária desenvolvida.",
  christologyScore:
    "Pessoa e natureza de Cristo: encarnação, divindade/humanidade, Logos, senhorio, ofícios. 1-2: Jesus como exemplo moral apenas. 3: um aspecto cristológico ensinado. 4-5: quem Cristo É estrutura a pregação (alta cristologia).",
  crucicentrismScore:
    "Centralidade da CRUZ: morte/ressurreição como eixo. 1-2: 'Jesus morreu por nós' citado de passagem ou como pressuposto. 3: a cruz desenvolvida em parte da mensagem. 4-5: a cruz estrutura a pregação inteira (sacrifício, expiação, morte do ego derivada dela).",
  soteriologyScore:
    "Doutrina da salvação: graça, justificação, novo nascimento, redenção. 1-2: 'seja salvo' sem conteúdo. 3: um aspecto explicado. 4-5: o COMO da salvação é ensinado (só graça vs mérito, conversão real).",
  pneumatologyScore:
    "Espírito Santo: pessoa e obra (convencer, habitar, santificar, capacitar, fruto). 1-2: ES citado em fórmula. 3: uma obra do ES ensinada. 4-5: a atuação do ES estrutura a mensagem. Atenção: crítica a 'espetáculo do Espírito' é desconstrução, não pneumatologia positiva — pontue nos dois campos se houver ambos.",
  bibliologyScore:
    "Doutrina das Escrituras: autoridade, suficiência, como ler/estudar. 1-2: 'a Bíblia diz' como apelo. 3: ensino sobre a natureza da Escritura. 4-5: a doutrina da Palavra é tema desenvolvido (ex.: contra achismos, chamado ao estudo).",
  ecclesiologyScore:
    "Doutrina da igreja: corpo, povo, ofícios, natureza da igreja local/universal. 1-2: 'venha à igreja'. 3: uma imagem de igreja ensinada. 4-5: o que a igreja É estrutura a mensagem (ex.: comunidade dos arrependidos vs CNPJ).",
  hamartiologyScore:
    "Doutrina do pecado: natureza caída, pecado como condição (não só atos). 1-2: 'não peque'. 3: pecado explicado teologicamente. 4-5: a condição humana caída estrutura o argumento.",
  anthropologyScore:
    "Antropologia teológica: imagem de Deus, dignidade, finitude, identidade humana. 1-2: menção. 3: desenvolvida em parte. 4-5: quem o homem é diante de Deus estrutura a mensagem.",
  kingdomTheologyScore:
    "Reino de Deus: reinado presente/futuro, lógica invertida do Reino vs impérios. 1-2: 'Reino' como jargão. 3: um aspecto do Reino ensinado. 4-5: a mensagem é estruturada pela teologia do Reino.",
  eschatologyScore:
    "Últimas coisas: volta de Cristo, juízo, nova criação, esperança. Cronologias especulativas NÃO aumentam o score — 4-5 é esperança escatológica formando a vida presente.",
  sanctificationScore:
    "Santificação: transformação de caráter, fruto do Espírito, luta carne×Espírito, morte do ego. 1-2: moralismo ('melhore'). 3: processo explicado. 4-5: o caminho de transformação estrutura a mensagem — SEM virar lista moralista (isso reduziria para 2).",
  orthodoxyScore:
    "AGREGADO do eixo 2: densidade doutrinária geral da pregação. Não é média aritmética — é o peso da formação de crença correta na mensagem como um todo.",

  // ── Eixo 3 — Ortopraxia (prática ESTRUTURADA) ───────────────────────
  serviceDiaconiaScore:
    "Serviço/diaconia. 1-2: 'sirvam uns aos outros' genérico. 3: serviço desenvolvido como identidade (bacia e toalha). 4-5: chamado CONCRETO a servir (onde, como, quem) ou ensino estruturado de diaconia.",
  generosityScore:
    "Generosidade saudável (sem barganha). 1-2: menção. 3: generosidade ensinada como fruto. 4-5: ensino desenvolvido de dar/repartir com caminho prático. Crítica ao dízimo abusivo é desconstrução, não generosidade.",
  missionEvangelismScore:
    "Missão/evangelismo. 1-2: 'sejam luz' de passagem. 3: missão como identidade desenvolvida. 4-5: envio concreto ou ensino estruturado de evangelização/missão.",
  discipleshipScore:
    "Discipulado: seguir Jesus (Lc 9.23) e/ou formar outros (2Tm 2.2). 1-2: menção. 3: custo do discipulado desenvolvido. 4-5: caminho de discipulado ensinado (inclusive discipular alguém).",
  communityMutualityScore:
    "Comunhão/mutualidade: 'uns aos outros', carregar fardos, mesa. 1-2: menção. 3: mutualidade ensinada. 4-5: a vida do corpo estrutura a mensagem com prática relacional clara.",
  hospitalityScore: "Hospitalidade: acolher em casa/mesa. Mesma régua: menção (1-2) → desenvolvida (3) → concreta/central (4-5).",
  careForPoorScore:
    "Cuidado dos pobres/vulneráveis (Mt 25, Is 58). 1-2: menção. 3: desenvolvido teologicamente. 4-5: chamado concreto a agir pelos pobres.",
  forgivenessReconciliationScore:
    "Perdão e reconciliação PRÁTICOS (relações reais, Mt 18). 1-2: 'perdoe' genérico. 3: desenvolvido. 4-5: caminho concreto de reconciliação ensinado.",
  vocationWorkScore: "Trabalho/vocação como serviço a Deus. Menção (1-2) → desenvolvido (3) → ensino estruturado sobre viver a fé no trabalho (4-5).",
  familyRelationshipsScore:
    "Família: casamento, filhos, relações domésticas. 1-2: exemplo familiar como ilustração. 3: ensino desenvolvido. 4-5: a vida familiar é tema central com orientação aplicável.",
  financeStewardshipScore:
    "Finanças/mordomia: dinheiro, dívidas, consumo, administração. Crítica a Mamon/prosperidade é DESCONSTRUÇÃO; aqui só pontua ensino POSITIVO de mordomia. 4-5 exige orientação prática de finanças.",
  orthopraxyScore:
    "AGREGADO do eixo 3: peso da prática cristã ESTRUTURADA na mensagem (chamados concretos, caminhos aplicáveis) — exortação genérica não conta como 4-5.",

  // ── Eixo 4 — Espiritualidade ─────────────────────────────────────────
  prayerScore:
    "Oração. Distinga EXORTAÇÃO ('orem mais', 1-3) de MÉTODO/ENSINO (como orar, vida de oração ensinada, 4-5).",
  scriptureDevotionScore:
    "Leitura bíblica PESSOAL do crente. 1-2: 'leiam a Bíblia'. 3: importância desenvolvida. 4-5: como ler/estudar ensinado (plano, método, Caminho das Letras).",
  fastingScore: "Jejum. Raro no corpus: só pontue com menção real; 4-5 exige ensino do sentido/prática do jejum.",
  worshipScore:
    "Adoração como vida (não só música). 1-2: menção litúrgica. 3: adoração verdadeira ensinada. 4-5: teologia da adoração estrutura a mensagem (culto racional, Rm 12).",
  repentanceScore: "Arrependimento: metanoia real, confissão. 1-2: 'arrependa-se' de passagem. 3-5 conforme desenvolvimento e centralidade.",
  discernmentScore: "Discernimento: provar espíritos, testar ensinos, sabedoria. 4-5 quando a pregação ENSINA a discernir (critérios), não só alerta.",
  spiritualDisciplinesScore:
    "Disciplinas espirituais como MÉTODO (práticas regulares ensinadas). Só pontue 4-5 se houver prática concreta proposta — senão é exortação (1-3).",
  spiritualityScore: "AGREGADO do eixo 4: peso da vida devocional/espiritualidade na mensagem.",

  // ── Eixo 8 — Saúde pastoral ─────────────────────────────────────────
  healingWoundedScore:
    "Acolhimento dos feridos da religião: consolo, porta larga, 'igreja como hospital', graça para quebrados. 1-2: tom acolhedor difuso. 3: acolhimento desenvolvido. 4-5: o acolhimento do ferido estrutura a mensagem.",
  religiousDeconstructionScore:
    "Desconstrução da religião abusiva: crítica a legalismo, culpa, medo, barganha, mercado gospel, liderança autoritária. 1-2: alfinetada pontual. 3: crítica desenvolvida em parte. 4-5: a desconstrução estrutura a pregação. NÃO é score negativo — mede presença do tema.",
  discipleshipReconstructionScore:
    "Reconstrução discipular: depois de desconstruir, o que se constrói? Ensino positivo de caminho novo (identidade, comunidade, prática). 4-5: a pregação constrói alternativa concreta, não só critica.",
  practicalActivationScore:
    "Ativação prática: chamado CONCRETO e realizável ('procure alguém para discipular esta semana', 'sirva em X'). Exortação genérica ('vivam o evangelho') = 1-2. 4-5 exige chamado específico.",
  sendingHealedScore:
    "Envio dos curados: o acolhido é convocado a servir/ir. 1-2: menção. 3: envio ensinado como identidade. 4-5: envio concreto estrutura a conclusão.",
  coresponsibilityScore:
    "Corresponsabilidade: o membro como responsável pela vida/missão da comunidade (não consumidor). 4-5: responsabilidade mútua ensinada com peso.",
  passivityRiskScore:
    "RISCO a monitorar (não acusação): a mensagem, ao remover culpa/medo/recompensa, deixa o ouvinte sem chamado? 4-5 = acolhimento forte SEM nenhum contrapeso de envio/prática na mesma pregação. Exige evidência do desequilíbrio.",
  cynicismElitismRiskScore:
    "RISCO a monitorar: ironia/superioridade sobre 'os outros evangélicos' SEM chamado afirmativo correspondente (paradoxo de Lc 18.11: 'não sou como eles'). Crítica com autocrítica e construção = score baixo. 4-5 exige tom de superioridade recorrente evidenciado.",
  pastoralHealthScore: "AGREGADO do eixo 8: equilíbrio geral entre cura, verdade, construção e envio na mensagem.",

  // ── Transversal ──────────────────────────────────────────────────────
  practicalMethodScore:
    "Há CAMINHO PRÁTICO aplicável? 0: nenhum método. 1-2: princípio sem passo. 3: direção aplicável geral. 4-5: passos claros e acionáveis ('faça X assim'). Mede o modo FAZER, independente do tema.",

  // ── Crítica religiosa contextual (BLUEPRINT v2 §12) ──────────────────
  contextualCritiqueIntensityScore:
    "Presença REAL da crítica à religião abusiva na linha argumentativa INTEIRA (considere alvo, tom, proporção do discurso, fundamentação). Difere do sinal lexical: 4-5 = a crítica ao sistema estrutura a mensagem; 1-2 = alfinetada pontual. Score ≥4 exige evidência.",
  biblicalGroundingOfCritiqueScore:
    "A crítica é ANCORADA no texto bíblico (Jesus e fariseus, mercadores no templo, Mamon) ou é opinião/ironia sem base? 4-5: crítica claramente derivada da Escritura exposta. 0-2: crítica sem fundamentação bíblica no texto.",
  reconstructionAfterCritiqueScore:
    "Depois de criticar, a mensagem RECONSTRÓI (aponta o caminho positivo: cruz, graça, comunidade, serviço)? 4-5: reconstrução clara e desenvolvida. 0-2: permanece na denúncia.",
  activationAfterCritiqueScore:
    "Depois de criticar/reconstruir, há CHAMADO PRÁTICO à ação (servir, discipular, participar)? 4-5: convocação concreta. 0-2: sem ativação.",
  politicalIdolatryCritiqueScore:
    "Crítica à IDOLATRIA POLÍTICA (messianismo político, nacionalismo religioso, confusão igreja-Estado, uso eleitoral da fé). NÃO classifique a pregação como direita/esquerda — meça apenas o fenômeno. Score ≥3 exige evidência.",

  // ── Diaconia orgânica × institucional (BLUEPRINT v2 §12.5) ───────────
  organicDiaconiaScore:
    "Serviço COTIDIANO e orgânico: mutualidade, amor ao próximo, bacia e toalha, repartir pão, vida cristã como serviço espontâneo. 4-5: é eixo forte da mensagem.",
  institutionalActionScore:
    "Ação ESTRUTURADA: projetos, ministérios, equipes, escalas, grupos, trilhas, voluntariado organizado, mecanismos de engajamento. NÃO pontue alto só porque a mensagem fala em 'servir' — exige caminho institucional concreto. 0-2 é comum neste corpus (aversão a método).",
};
