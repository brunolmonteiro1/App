// Fonte de verdade de todo o texto do site.
// Copy baseada no blueprint do Instituto Vosz e nos artigos institucional/autoral
// (Bruno Monteiro). Sem números de impacto inventados e sem nomes de projeto
// ainda não aprovados.

/* ----------------------------------------------------------------------------
 * HOME
 * ------------------------------------------------------------------------- */

export const hero = {
  eyebrow: "Assistência social · Contraturno socioeducativo · Cambuci/SP",
  titulo: "Do acolhimento à autonomia. Uma jornada de cuidado integral.",
  subtitulo:
    "O Instituto Vosz atua no contraturno socioeducativo com uma metodologia de cuidado integral, unindo assistência social, alimentação, neuropsicologia, arte, tecnologia e acompanhamento familiar para fortalecer crianças e famílias em situação de vulnerabilidade.",
  ctaPrimario: { label: "Quero Doar", href: "/como-apoiar" },
  ctaSecundario: { label: "Conheça a Metodologia", href: "/metodologia" },
  // Rótulos das camadas de cuidado que orbitam a criança na composição do hero.
  camadas: [
    "Alimentação",
    "Vínculos",
    "Família",
    "Saúde emocional",
    "Acesso a direitos",
    "Cultura",
    "Tecnologia",
    "Autonomia",
  ],
};

export const problema = {
  eyebrow: "O problema invisível",
  titulo: "Antes do conteúdo, vem a condição de aprender",
  texto:
    "Nem tudo que impede uma criança de aprender está dentro da sala de aula. A dificuldade pode estar na insegurança alimentar, na ausência de rotina, em vínculos fragilizados, em sofrimento emocional, em uma condição não diagnosticada ou na falta de acesso a direitos. Por isso, o cuidado precisa olhar para a criança por inteiro.",
  cards: [
    { titulo: "Alimentação", texto: "Segurança alimentar como base para atenção e desenvolvimento.", icon: "utensils" },
    { titulo: "Família", texto: "Vínculos familiares que sustentam ou fragilizam a rotina da criança.", icon: "home" },
    { titulo: "Saúde emocional", texto: "Sofrimento emocional que muitas vezes é lido como desinteresse.", icon: "heart" },
    { titulo: "Diagnóstico", texto: "Condições de neurodesenvolvimento ainda não identificadas.", icon: "search" },
    { titulo: "Acesso a direitos", texto: "Documentos, benefícios e serviços que nem sempre chegam.", icon: "shield" },
    { titulo: "Cultura", texto: "Repertório, arte e experiências que ampliam o mundo.", icon: "palette" },
    { titulo: "Tecnologia", texto: "Ferramentas e criatividade como caminho de futuro.", icon: "chip" },
    { titulo: "Vínculos", texto: "Adultos atentos e relações de confiança que não desistem.", icon: "link" },
  ],
};

export const resposta = {
  eyebrow: "Nossa resposta",
  titulo: "Contraturno socioeducativo com cuidado integral",
  texto:
    "O contraturno do Vosz não é reforço escolar nem apenas ocupação de tempo. É um espaço de proteção, convivência, aprendizagem, escuta e desenvolvimento integral no período oposto à escola.",
  destaques: [
    "Turmas reduzidas",
    "Ensino personalizado",
    "Alimentação",
    "Arte e cultura",
    "Robótica e tecnologia",
    "Neuropsicologia",
    "Assistência social",
    "Acompanhamento familiar",
  ],
  frase: "Um espaço de proteção, convivência e desenvolvimento — com método e afeto.",
};

export const voar = {
  eyebrow: "Jornada VOAR",
  titulo: "Jornada VOAR",
  subtitulo:
    "Uma metodologia de cuidado que acompanha crianças e famílias do acolhimento à autonomia.",
  etapas: [
    {
      letra: "V",
      nome: "Voz / Vosz",
      resumo: "Escutamos, acolhemos e reconhecemos a história de cada criança e família.",
      detalhe:
        "O Instituto assume o papel de facilitador, promovendo protagonismo e dando voz às famílias. Escuta, acolhimento e defesa de direitos: antes de qualquer atividade, reconhecemos a história de quem chega.",
      cor: "roxo",
    },
    {
      letra: "O",
      nome: "Oportunidade",
      resumo: "Criamos acesso a educação, capacitação profissional e empreendedorismo.",
      detalhe:
        "Acesso à educação complementar, arte, tecnologia, cultura, capacitação profissional e empreendedorismo. Oportunidades reais, oferecidas com excelência e não como favor.",
      cor: "rosa",
    },
    {
      letra: "A",
      nome: "Ação",
      resumo: "Intervenções práticas e integradas, com resultados mensuráveis.",
      detalhe:
        "Intervenções práticas e integradas com resultados mensuráveis: assistência social, neuropsicologia, plano de cuidado, família e encaminhamentos. O cuidado vira método, com registros e responsabilidade.",
      cor: "azul",
    },
    {
      letra: "R",
      nome: "Restauração",
      resumo: "Rumo à dignidade e à autonomia das famílias atendidas.",
      detalhe:
        "Rumo à dignidade e à autonomia das famílias atendidas. Fortalecimento de vínculos e transformação comunitária — o objetivo não é dependência: é autonomia.",
      cor: "verde",
    },
  ],
};

// Jornada do Beneficiário — como o cuidado funciona na prática (apresentação oficial).
export const jornadaBeneficiario = {
  eyebrow: "Como funciona na prática",
  titulo: "Da chegada à autonomia, passo a passo",
  subtitulo:
    "Aqui, não entregamos apenas atividades. Construímos percursos que transformam — com começo, acompanhamento e horizonte de autonomia.",
  etapas: [
    {
      titulo: "Escuta e diagnóstico",
      texto:
        "Tudo começa com uma anamnese multidisciplinar da situação da família, que gera um plano de atendimento individualizado.",
    },
    {
      titulo: "A criança entra no contraturno",
      texto:
        "A criança é inserida nos programas socioeducativos: educação complementar, arte, esporte, tecnologia e alimentação.",
    },
    {
      titulo: "A família ganha caminhos",
      texto:
        "Os responsáveis são direcionados para capacitação profissional, orientação jurídica, recolocação, geração de renda e outros apoios.",
    },
    {
      titulo: "O plano é revisado",
      texto:
        "A cada 6 meses, o plano é revisado, acompanhando o progresso da família rumo à autonomia.",
    },
    {
      titulo: "O vínculo continua",
      texto:
        "Após a saída formal do acompanhamento, o atendimento à criança continua nos programas educativos. O cuidado não se rompe.",
    },
  ],
};

export const turmas = {
  eyebrow: "Turmas reduzidas",
  titulo: "Em grupos menores, cada criança pode ser vista de perto",
  texto:
    "No Vosz, a escolha por turmas reduzidas não é luxo. É método. Grupos menores permitem que professores observem melhor, adaptem materiais, identifiquem sinais e acompanhem o desenvolvimento de cada criança.",
  frase: "Para que nenhuma criança passe despercebida.",
};

export const pilares = {
  eyebrow: "O que fazemos",
  titulo: "Pilares de atuação",
  subtitulo:
    "Frentes que se integram em uma única rede de cuidado — da assistência social à autonomia familiar.",
  itens: [
    { id: "assistencia-social", titulo: "Assistência Social e Família", texto: "Acompanhamento familiar, escuta, visitas, acesso a direitos, vínculos e encaminhamentos.", icon: "family" },
    { id: "contraturno", titulo: "Contraturno Socioeducativo", texto: "Educação complementar, rotina, convivência, turmas reduzidas e ensino personalizado.", icon: "book" },
    { id: "neuropsicologia", titulo: "Neuropsicologia e Saúde Emocional", texto: "Avaliação, observação, sala sensorial, cuidado emocional e identificação precoce.", icon: "brain" },
    { id: "arte-cultura", titulo: "Arte, Cultura e Esporte", texto: "Balé, música, teatro, expressão corporal, esportes e experiências culturais.", icon: "palette" },
    { id: "tecnologia", titulo: "Tecnologia e Laboratório Maker", texto: "Robótica, criatividade, pensamento lógico, inovação e ferramentas digitais.", icon: "chip" },
    { id: "alimentacao", titulo: "Alimentação e Cozinha Social", texto: "Refeições, capacitação e geração de renda para a sustentabilidade da missão.", icon: "utensils" },
    { id: "bazar", titulo: "Bazar e Sustentabilidade", texto: "Acesso a itens de qualidade por valores simbólicos e reinvestimento social.", icon: "tag" },
    { id: "capacitacao", titulo: "Capacitação e Autonomia", texto: "Cursos, empreendedorismo, formação profissional e fortalecimento familiar.", icon: "sprout" },
  ],
};

export const sustentabilidade = {
  eyebrow: "Sustentabilidade",
  titulo: "Gratuito para quem precisa. Sustentável para quem cuida.",
  texto:
    "O atendimento às famílias acompanhadas pelo Vosz é gratuito. Mas cuidado de qualidade exige estrutura, equipe, alimentação, tecnologia, acompanhamento técnico e continuidade. Por isso, o Instituto desenvolve frentes de sustentabilidade e negócios sociais. Toda receita gerada é reinvestida na missão.",
  frentes: [
    { titulo: "Doações", icon: "heart" },
    { titulo: "Cozinha", icon: "utensils" },
    { titulo: "Bazar", icon: "tag" },
    { titulo: "Escola de Artes", icon: "palette" },
    { titulo: "Parcerias", icon: "handshake" },
    { titulo: "Empresas", icon: "building" },
    { titulo: "Eventos", icon: "calendar" },
    { titulo: "Voluntariado", icon: "users" },
  ],
  cicloConverge: "Atendimento gratuito, cuidado contínuo e reinvestimento integral na missão.",
};

export const timeline = {
  eyebrow: "Nossa história",
  titulo: "De uma semente chamada Cultivar a um ecossistema de cuidado integral",
  itens: [
    { ano: "2017", titulo: "Cultivar", texto: "Início do projeto social na igreja A Casa da Rocha, com aulas de Muay Thai para crianças." },
    { ano: "2020", titulo: "Pandemia", texto: "Atuação emergencial com entrega de cestas básicas e kits de Natal para famílias." },
    { ano: "2020", titulo: "Instituto Vosz", texto: "O projeto amadurece e se torna oficialmente Instituto Vosz." },
    { ano: "2022", titulo: "Nova sede", texto: "Retomada das atividades presenciais no Cambuci." },
    { ano: "2024", titulo: "Nova fase", texto: "Reestruturação da atuação, com construção de metodologia, equipe, contraturno socioeducativo, assistência social e sustentabilidade." },
    { ano: "Hoje", titulo: "Ecossistema de cuidado", texto: "O Vosz atua como ecossistema de cuidado integral, unindo assistência social, educação, arte, tecnologia, família e autonomia." },
  ],
};

export const apoiar = {
  eyebrow: "Como apoiar",
  titulo: "Faça parte dessa história",
  cards: [
    { titulo: "Doe", texto: "Sua doação ajuda a manter alimentação, professores, equipe técnica, materiais e acompanhamento familiar.", cta: "Quero Doar", href: "/como-apoiar", icon: "heart" },
    { titulo: "Seja voluntário", texto: "Compartilhe seu tempo, conhecimento e habilidades.", cta: "Quero ser Voluntário", href: "/como-apoiar#voluntariado", icon: "users" },
    { titulo: "Seja empresa parceira", texto: "Conecte sua empresa a uma causa real, com impacto social e responsabilidade comunitária.", cta: "Minha empresa quer apoiar", href: "/como-apoiar#empresas", icon: "building" },
    { titulo: "Divulgue", texto: "Ajude a levar a voz do Vosz mais longe.", cta: "Compartilhar", href: "/contato", icon: "megaphone" },
  ],
};

export const ctaFinal = {
  titulo: "Ajude uma criança a ser vista por inteiro",
  texto:
    "Quando uma criança recebe cuidado, vínculo, alimentação, escuta, arte, tecnologia e acompanhamento, ela não ganha apenas atividades. Ela ganha a chance de construir futuro.",
  ctaPrimario: { label: "Quero Doar Agora", href: "/como-apoiar" },
  ctaSecundario: { label: "Falar com o Vosz", href: "/contato" },
};

/* ----------------------------------------------------------------------------
 * PÁGINAS INTERNAS
 * ------------------------------------------------------------------------- */

export const quemSomos = {
  titulo: "Existimos para erguer a voz em favor de quem precisa ser cuidado",
  intro:
    "O Instituto Vosz é uma Organização da Sociedade Civil de inspiração cristã que atua no campo da assistência social, oferecendo contraturno socioeducativo e cuidado integral para crianças, adolescentes e famílias em situação de vulnerabilidade no Cambuci, em São Paulo.",
  blocos: [
    {
      titulo: "Uma organização que se movimenta a partir do amor",
      texto:
        "Somos uma organização cristã que atua de maneira prioritária com crianças, adolescentes e suas famílias. Acreditamos que a convivência e o desenvolvimento comunitário, por meio de ações pacificadoras, geram justiça, direito, dignidade e liberdade.",
    },
    {
      titulo: "Da semente Cultivar ao Instituto Vosz",
      texto:
        "Nossa história começou em 2017 como o projeto Cultivar, na igreja A Casa da Rocha. O que era uma atuação pontual amadureceu, em 2020, no Instituto Vosz — e, a partir de 2024, foi reestruturado em torno de uma metodologia de cuidado integral com continuidade, equipe técnica e acompanhamento familiar.",
    },
    {
      titulo: "Confessionalidade que acolhe",
      texto:
        "Temos nossa confessionalidade cristã e entendemos o amor como uma pessoa, Cristo. Esse é o nosso espelho. Mas o cuidado que oferecemos é para todos: acolhemos cada criança e família com dignidade, sem distinção.",
    },
    {
      titulo: "Território de atuação",
      texto:
        "Atuamos no Cambuci, em São Paulo, em rede com escola, família, comunidade e serviços públicos. Não substituímos a escola nem somos um departamento da igreja: somos uma organização de assistência social com proposta socioeducativa complementar.",
    },
  ],
};

// Frentes detalhadas da página "O que Fazemos".
export const frentes = [
  {
    id: "contraturno",
    titulo: "Contraturno Socioeducativo",
    texto:
      "Educação complementar no período oposto à escola, com rotina, convivência, turmas reduzidas e ensino personalizado. Disciplinas como Português, Matemática, Robótica, Teatro, Balé, Educação Física, Musicalização, Ecologia e Sustentabilidade — com metodologias STEAM-S e PBL. Um espaço de proteção e desenvolvimento, não de ocupação de tempo.",
  },
  {
    id: "assistencia-social",
    titulo: "Assistência Social e Família",
    texto:
      "Acompanhamento familiar com escuta, visitas e acesso a direitos. Usamos a Bússola Social para compreender a realidade das famílias — moradia, renda, composição familiar, benefícios e vínculos — e transformar percepção em plano de ação.",
  },
  {
    id: "neuropsicologia",
    titulo: "Neuropsicologia e Sala Sensorial",
    texto:
      "Avaliação, observação e cuidado emocional que ajudam a identificar precocemente sinais que precisam de atenção. A sala sensorial apoia a regulação e o desenvolvimento das crianças.",
  },
  {
    id: "arte-cultura",
    titulo: "Arte, Cultura e Esporte",
    texto:
      "Balé, música, teatro e expressão corporal desenvolvem disciplina, autoestima, pertencimento e sensibilidade. Modalidades esportivas como muay thai, jiu-jitsu e futsal completam a formação. A arte não é entretenimento: é parte da formação humana.",
  },
  {
    id: "tecnologia",
    titulo: "Tecnologia e Maker",
    texto:
      "Robótica, criatividade e pensamento lógico ampliam repertório e capacidade de resolver problemas. A tecnologia também organiza dados para que o cuidado seja mais responsável — sem substituir o olhar humano.",
  },
  {
    id: "alimentacao",
    titulo: "Alimentação e Cozinha",
    texto:
      "Refeições que garantem a condição básica para aprender. A cozinha também pode capacitar familiares e gerar receita para a sustentabilidade do Instituto.",
  },
  {
    id: "bazar",
    titulo: "Bazar Social",
    texto:
      "Acesso a itens de qualidade por valores simbólicos, com reinvestimento social. Uma frente de sustentabilidade que aproxima a comunidade.",
  },
  {
    id: "capacitacao",
    titulo: "Capacitação e Autonomia",
    texto:
      "Cursos, empreendedorismo e formação profissional que fortalecem as famílias e abrem caminhos para a autonomia — porque o objetivo não é criar dependência.",
  },
];

export const metodologia = {
  titulo: "Jornada VOAR de Cuidado e Autonomia",
  intro:
    "A Jornada VOAR é a metodologia que organiza o cuidado do Instituto Vosz. Ela integra educação complementar, assistência social, saúde emocional, arte, cultura e tecnologia em um único caminho — do acolhimento à autonomia.",
  pilaresTecnicos: [
    { titulo: "Turmas reduzidas", texto: "Grupos menores para que cada criança seja observada e acompanhada de perto." },
    { titulo: "Ensino personalizado", texto: "Material adaptado a ritmos, dificuldades, interesses e potencialidades." },
    { titulo: "Acompanhamento multidisciplinar", texto: "Professores, coordenação, neuropsicologia e assistência social trocam percepções sobre a mesma criança." },
    { titulo: "Bússola Social", texto: "Ferramenta que organiza informações sobre a realidade das famílias para cuidar melhor — com responsabilidade e LGPD." },
    { titulo: "Dados a serviço do cuidado", texto: "Registros e avaliações que impedem a memória institucional de se perder. O dado não substitui o vínculo: ele apoia a decisão humana." },
    { titulo: "Autonomia como horizonte", texto: "Acolher, organizar, fortalecer e capacitar para que cada família caminhe com mais dignidade." },
  ],
};

export const sustentabilidadePagina = {
  titulo: "A receita serve ao cuidado. A gestão serve à missão.",
  intro:
    "O Instituto Vosz é uma OSC sem fins lucrativos. O atendimento às famílias é gratuito, e toda receita gerada pelas frentes de sustentabilidade é reinvestida integralmente na missão. Assim reduzimos a dependência exclusiva de doações e ganhamos independência e continuidade.",
  blocos: [
    { titulo: "Atendimento gratuito", texto: "As famílias acompanhadas não pagam pelo cuidado. Gratuito para quem precisa." },
    { titulo: "Negócios sociais", texto: "Cozinha, bazar e escola de artes geram receita e capacitam a comunidade." },
    { titulo: "Parcerias e doações", texto: "Empresas, doadores e voluntários sustentam a estrutura e a continuidade do cuidado." },
    { titulo: "Reinvestimento integral", texto: "Toda receita volta para a missão: alimentação, equipe, tecnologia e acompanhamento." },
  ],
};

export const impacto = {
  titulo: "Cuidado que aponta para autonomia",
  intro:
    "Transformação social exige continuidade, vínculo, acompanhamento técnico e presença constante. Nosso impacto se constrói no tempo — na criança que passa a ser vista, na família que ganha rede de apoio e no vínculo que não se rompe.",
  // Números da apresentação institucional oficial do Instituto.
  numeros: [
    { valor: "50", sufixo: "", legenda: "crianças atendidas diariamente no contraturno, com refeição completa garantida" },
    { valor: "+1.500", sufixo: "", legenda: "famílias apoiadas ao longo da história do Instituto" },
    { valor: "+26.000", sufixo: "", legenda: "cestas básicas entregues a famílias em vulnerabilidade" },
    { valor: "+2.000", sufixo: "", legenda: "kits de higiene e de Natal distribuídos" },
  ],
  fraseNumeros: "O impacto não se limita à criança. Transforma a família inteira.",
  qualitativos: [
    { titulo: "Crianças vistas por inteiro", texto: "Quando diferentes professores olham para a mesma criança e compartilham percepções, sinais importantes começam a aparecer." },
    { titulo: "Famílias acompanhadas", texto: "O acompanhamento social ajuda a enxergar o contexto que impacta o desenvolvimento da criança — sem reduzir pessoas a dados." },
    { titulo: "Vínculos fortalecidos", texto: "Rotina, escuta e adultos atentos reconstroem confiança e pertencimento." },
    { titulo: "Caminhos de autonomia", texto: "Capacitação e fortalecimento familiar abrem caminho para que o cuidado se multiplique." },
  ],
  notaMetricas:
    "Números da apresentação institucional do Instituto Vosz. Novos indicadores serão publicados à medida que forem consolidados pela equipe técnica.",
};

// Missão, visão e alvo — texto oficial da apresentação institucional.
export const missaoVisao = {
  missao:
    "Enfrentar injustiças com auxílio imediato, integral e contínuo, promovendo acesso justo aos direitos e contribuindo para o desenvolvimento integral de crianças, adolescentes e famílias em vulnerabilidade social — gerando transformação, dignidade e liberdade por meio de programas educacionais, culturais e esportivos, ancorados em valores cristãos.",
  visao:
    "Ser um centro de referência em educação integral e inovação social, validando e replicando metodologias que gerem impacto efetivo em comunidades vulneráveis.",
  alvo:
    "Nos próximos 2 anos, sistematizar nossa metodologia e replicá-la por meio de formações e parcerias com outras instituições, ampliando ainda mais o alcance do trabalho.",
  versiculo:
    "Erga a voz em favor dos que não podem defender-se; seja o defensor de todos os desamparados. Erga a voz e julgue com justiça; defenda os direitos dos pobres e dos necessitados.",
  versiculoRef: "Provérbios 31:8-9 — o versículo que dá nome ao Vosz",
};

// Programa de embaixadores — presente na apresentação institucional oficial.
export const portaVosz = {
  titulo: "Seja um Porta Vosz",
  intro:
    "Quando uma criança entra no contraturno do Instituto Vosz, ela é acolhida em um ambiente estruturado onde aprende robótica, balé, matemática e teatro. Seus responsáveis, antes sem perspectiva, iniciam formações para gerar renda e dignidade. Em pouco tempo, essa família volta a sonhar. Essa transformação só é possível com pessoas como você.",
  frase: "Juntos, podemos restaurar sonhos e gerar autonomia.",
  acoes: [
    { titulo: "Mobilize sua rede", texto: "Leve a causa do Vosz para as pessoas ao seu redor." },
    { titulo: "Apresente o Vosz", texto: "Conecte o Instituto à sua igreja, empresa ou grupo." },
    { titulo: "Doe tempo, talento ou recurso", texto: "Cada forma de contribuição fortalece a missão." },
  ],
};

// Projeto em captação — Sala Sensorial (dados da apresentação oficial).
export const salaSensorial = {
  eyebrow: "Projeto em captação",
  titulo: "Sala Sensorial de Avaliação Multidisciplinar",
  subtitulo: "Transformando diagnósticos inacessíveis em oportunidades de futuro.",
  problema:
    "No SUS, uma criança pode esperar até 2 anos por uma avaliação neuropsicológica ou intervenção especializada. Essa demora gera perdas irreversíveis no desenvolvimento e amplia desigualdades.",
  solucao:
    "Com a Sala Sensorial concluída, o Vosz poderá diagnosticar em semanas — não anos —, personalizar planos de intervenção para cada criança e ampliar o alcance dos atendimentos gratuitos.",
  beneficios: [
    { titulo: "Para as crianças", texto: "Diagnóstico precoce, redução da defasagem escolar e inclusão real." },
    { titulo: "Para as famílias", texto: "Acesso gratuito a serviços de alto custo e orientação qualificada." },
    { titulo: "Para a comunidade", texto: "Um modelo de intervenção replicável, com transparência total." },
  ],
  meta: "R$ 55.000",
  metaDescricao:
    "Custo total estimado para concluir as obras: adequação elétrica, pintura, obras civis e mobiliário — com prestação de contas documentada.",
};

export const transparencia = {
  titulo: "Transparência e proteção",
  intro:
    "Confiança se constrói com clareza. Reunimos aqui as informações institucionais do Instituto Vosz e nossos compromissos com a proteção de crianças e com o uso responsável de dados.",
  compromissos: [
    { titulo: "Proteção infantil", texto: "Não utilizamos imagens que exponham crianças de forma vexatória e trabalhamos com políticas de proteção à criança e ao adolescente." },
    { titulo: "LGPD", texto: "Dados de famílias e doadores são tratados com responsabilidade e finalidade definida, conforme a Lei Geral de Proteção de Dados." },
    { titulo: "Reinvestimento integral", texto: "Toda receita gerada é reinvestida na missão. Nenhum recurso é distribuído como lucro." },
  ],
  // Slots para documentos públicos — preenchidos quando disponibilizados pelo Instituto.
  documentos: [
    { titulo: "Estatuto social", status: "Disponível sob solicitação" },
    { titulo: "Relatório de atividades", status: "Em consolidação" },
    { titulo: "Prestação de contas", status: "Em consolidação" },
    { titulo: "Diretoria e conselho", status: "Disponível sob solicitação" },
  ],
};
