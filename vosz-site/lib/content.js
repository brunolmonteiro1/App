// Fonte de verdade de todo o texto do site.
// Copy baseada no blueprint do Instituto Vosz e nos artigos institucional/autoral
// (Bruno Monteiro). Sem números de impacto inventados e sem nomes de projeto
// ainda não aprovados.

/* ----------------------------------------------------------------------------
 * HOME
 * ------------------------------------------------------------------------- */

export const hero = {
  eyebrow: "Assistência social · Contraturno socioeducativo · Cambuci/SP",
  titulo: "A escola ensina. Mas quem cuida do que impede a criança de aprender?",
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
  frase: "Contraturno não é depósito de criança. É uma rede de cuidado.",
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
        "Escuta, acolhimento, protagonismo e defesa de direitos. Antes de qualquer atividade, reconhecemos a história de quem chega.",
      cor: "roxo",
    },
    {
      letra: "O",
      nome: "Oportunidade",
      resumo: "Criamos acesso a educação complementar, cultura, tecnologia, arte, alimentação e capacitação.",
      detalhe:
        "Educação complementar, arte, tecnologia, cultura e capacitação. Oportunidades reais, oferecidas com excelência e não como favor.",
      cor: "rosa",
    },
    {
      letra: "A",
      nome: "Ação",
      resumo: "Acompanhamos de forma técnica, com assistência social, neuropsicologia, registros e plano de cuidado.",
      detalhe:
        "Acompanhamento social, neuropsicologia, plano de cuidado, família e encaminhamentos. O cuidado vira método, com registros e responsabilidade.",
      cor: "azul",
    },
    {
      letra: "R",
      nome: "Restauração",
      resumo: "Buscamos fortalecer vínculos, dignidade, autonomia e desenvolvimento comunitário.",
      detalhe:
        "Dignidade, autonomia, fortalecimento de vínculos e transformação comunitária. O objetivo não é dependência: é autonomia.",
      cor: "verde",
    },
  ],
};

export const turmas = {
  eyebrow: "Turmas reduzidas",
  titulo: "Em grupos menores, cada criança pode ser vista de perto",
  texto:
    "No Vosz, a escolha por turmas reduzidas não é luxo. É método. Grupos menores permitem que professores observem melhor, adaptem materiais, identifiquem sinais e acompanhem o desenvolvimento de cada criança.",
  frase: "Na ânsia de atender todo mundo, quantos se perdem?",
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
  titulo: "De uma semente chamada Cultivar a uma jornada de cuidado integral",
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
  titulo: "Faça parte dessa jornada",
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
      "Educação complementar no período oposto à escola, com rotina, convivência, turmas reduzidas e ensino personalizado. Um espaço de proteção e desenvolvimento — não de ocupação de tempo.",
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
    titulo: "Arte e Cultura",
    texto:
      "Balé, música, teatro e expressão corporal desenvolvem disciplina, autoestima, pertencimento e sensibilidade. A arte não é entretenimento: é parte da formação humana.",
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
  qualitativos: [
    { titulo: "Crianças vistas por inteiro", texto: "Quando diferentes professores olham para a mesma criança e compartilham percepções, sinais importantes começam a aparecer." },
    { titulo: "Famílias acompanhadas", texto: "O acompanhamento social ajuda a enxergar o contexto que impacta o desenvolvimento da criança — sem reduzir pessoas a dados." },
    { titulo: "Vínculos fortalecidos", texto: "Rotina, escuta e adultos atentos reconstroem confiança e pertencimento." },
    { titulo: "Caminhos de autonomia", texto: "Capacitação e fortalecimento familiar abrem caminho para que o cuidado se multiplique." },
  ],
  // Sem métricas inventadas: espaço reservado para dados reais quando o Instituto os fornecer.
  notaMetricas:
    "Indicadores quantitativos de impacto serão publicados aqui à medida que forem consolidados pela equipe técnica do Instituto.",
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
