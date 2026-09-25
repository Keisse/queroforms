export type ResultLevelCopy = {
  name: string;
  headline: string;
  next: string;
};

export type SurveyPresentation = {
  slug: string;
  quizLabel: string;
  branchAnswerKey: string;
  processing: {
    labels: [string,string,string];
    subtitle: string;
  };
  resultKicker: string;
  levels: Record<1|2|3|4, ResultLevelCopy>;
  gaugeLabels: [string,string,string,string];
  dimensions: readonly (readonly [string,string])[];
  showSalaryProjection: boolean;
  insightCard: {
    eyebrow: string;
    title: string;
    body: string;
    source?: string;
  };
};

const gpIa: SurveyPresentation = {
  slug:'gp-ia',
  quizLabel:'Diagnóstico de Maturidade',
  branchAnswerKey:'cloud-use',
  processing:{
    labels:['Mapeando seu uso de IA','Analisando sua maturidade','Identificando seu próximo salto'],
    subtitle:'Cruzamos suas respostas com os principais sinais de maturidade em IA aplicada à gestão de projetos.',
  },
  resultKicker:'Seu perfil de maturidade',
  levels:{
    1:{name:'Explorador de IA',headline:'Você já percebeu que IA importa. Agora precisa transformar curiosidade em aplicação prática.',next:'Seu próximo passo é aprender onde aplicar IA no ciclo de vida do projeto e criar seus primeiros usos estruturados.'},
    2:{name:'Usuário de IA',headline:'Você já usa IA, mas ainda captura apenas uma parte do valor que ela pode gerar.',next:'Seu próximo salto é sair das instruções isoladas e criar métodos reutilizáveis para planejamento, riscos, comunicação e decisão.'},
    3:{name:'Profissional Aumentado por IA',headline:'A IA já funciona como uma extensão da sua capacidade profissional.',next:'Agora o ganho está em transformar usos individuais em processos, automações e rotinas de gestão mais inteligentes.'},
    4:{name:'Gestor orientado por IA',headline:'Você já opera acima da média e pensa IA como parte do sistema de gestão.',next:'Seu desafio é escalar: agentes, integrações, governança e novas formas de operar projetos com IA.'},
  },
  gaugeLabels:['Explorador','Usuário','Aumentado','Orientado por IA'],
  dimensions:[
    ['Planejamento','planejamento'],
    ['Riscos','riscos'],
    ['Decisão','decisao'],
    ['Comunicação','comunicacao'],
    ['Automação','automacao'],
    ['Confiança','confianca'],
  ],
  showSalaryProjection:true,
  insightCard:{
    eyebrow:'Insight do PMBOK® 8ª edição',
    title:'Seu próximo salto não é usar mais ferramentas. É usar IA com mais contexto, governança e intenção.',
    body:'O guia atual coloca a IA dentro da realidade do gerenciamento de projetos: análise de dados, previsão de riscos, apoio à decisão, planejamento e automação. Ao mesmo tempo, reforça que a qualidade das entradas e a supervisão humana continuam determinantes para o resultado.',
  },
};

const pmoVmo: SurveyPresentation = {
  slug:'pmo-vmo',
  quizLabel:'Diagnóstico PMO / VMO',
  branchAnswerKey:'pmo-experience',
  processing:{
    labels:['Mapeando suas competências','Analisando suas decisões','Identificando seu próximo salto'],
    subtitle:'Cruzamos suas respostas para avaliar o quanto você está preparado para construir, reposicionar ou evoluir um PMO orientado a valor.',
  },
  resultKicker:'Sua maturidade para construir um PMO que gera valor',
  levels:{
    1:{
      name:'Executor Reativo',
      headline:'Você já reconhece a importância do PMO, mas sua atuação ainda tende a ficar mais próxima da execução e do controle.',
      next:'Seu próximo passo é construir uma base sólida para diagnosticar contextos, desenhar a estrutura adequada e explicar por que o PMO precisa existir.',
    },
    2:{
      name:'Estruturador de PMO',
      headline:'Você já possui base para organizar e estruturar um PMO, mas ainda há espaço para aumentar sua influência estratégica.',
      next:'Seu próximo salto está em priorização, governança, relacionamento com a liderança e na capacidade de demonstrar valor além de prazo, custo e escopo.',
    },
    3:{
      name:'Articulador Estratégico',
      headline:'Você já demonstra capacidade de conectar governança, decisões e prioridades ao contexto da organização.',
      next:'Agora o desafio é tornar essa influência sistemática: conectar portfólio, benefícios, indicadores e decisões para que o PMO seja percebido como parceiro da estratégia.',
    },
    4:{
      name:'Orquestrador de Valor',
      headline:'Você já pensa o PMO como instrumento de decisão, adaptação e geração contínua de valor.',
      next:'Seu próximo nível é ampliar essa capacidade: evoluir serviços, percepção de valor, portfólio e benefícios para operar cada vez mais próximo de uma lógica de VMO.',
    },
  },
  gaugeLabels:['Executor','Estruturador','Articulador','Valor'],
  dimensions:[
    ['Visão Estratégica','visao_estrategica'],
    ['Arquitetura de PMO','arquitetura_pmo'],
    ['Governança e Influência','governanca_influencia'],
    ['Gestão de Valor','gestao_valor'],
  ],
  showSalaryProjection:false,
  insightCard:{
    eyebrow:'PMI | Escritórios de Gerenciamento de Projetos',
    title:'O PMO moderno precisa ser adaptável, centrado nas necessidades do cliente e capaz de demonstrar valor.',
    body:'O guia prático do PMI reposiciona o PMO para além da aplicação de processos: contexto, serviços, competências, estratégia, percepção de valor e melhoria contínua passam a fazer parte da atuação profissional.',
    source:'PMI, Escritórios de Gerenciamento de Projetos: Um Guia Prático, 2025',
  },
};


const tireProjeto: SurveyPresentation = {
  slug:'tire-projeto-do-papel',
  quizLabel:'Diagnóstico Tire Esse Projeto do Papel',
  branchAnswerKey:'project-start',
  processing:{
    labels:['Mapeando como você lida com projetos','Analisando sua forma de planejar e executar','Identificando seu próximo salto'],
    subtitle:'Cruzamos suas respostas para entender como você transforma ideias em projetos claros, executáveis e capazes de gerar resultado.',
  },
  resultKicker:'Sua maturidade para tirar projetos do papel',
  levels:{
    1:{name:'Idealizador Travado',headline:'Você tem boas ideias, mas ainda perde força na hora de transformar intenção em execução.',next:'Seu próximo passo é ganhar clareza, estruturar melhor o início e criar um caminho executável antes de sair fazendo.'},
    2:{name:'Organizador em Evolução',headline:'Você já consegue dar alguma estrutura aos projetos, mas ainda há pontos frágeis entre planejar, executar e ajustar.',next:'Seu próximo salto é transformar planejamento em rotina prática, antecipar riscos e acompanhar o projeto com mais consistência.'},
    3:{name:'Executor Estruturado',headline:'Você já demonstra boa capacidade de transformar ideias em projetos organizados e conduzir a execução com método.',next:'Agora o desafio é elevar a qualidade das decisões, adaptação e conexão entre entrega, benefício e resultado.'},
    4:{name:'Realizador de Projetos',headline:'Você já pensa o projeto do início ao fim, conectando clareza, planejamento, execução, adaptação e valor.',next:'Seu próximo nível é tornar essa capacidade cada vez mais previsível, replicável e orientada a benefícios.'},
  },
  gaugeLabels:['Ideia','Estrutura','Execução','Resultado'],
  dimensions:[
    ['Clareza e Viabilidade','clareza_viabilidade'],
    ['Planejamento e Estruturação','planejamento_estruturacao'],
    ['Execução e Adaptação','execucao_adaptacao'],
    ['Controle, Entrega e Valor','controle_valor'],
  ],
  showSalaryProjection:false,
  insightCard:{
    eyebrow:'PMI | Benefits Realization Management',
    title:'Tirar um projeto do papel é mais do que concluir tarefas. É transformar esforço em resultado e benefício.',
    body:'O guia do PMI reforça que entregas, resultados, benefícios e valor fazem parte de uma mesma cadeia. Projetos bem conduzidos mantêm essa conexão visível do início ao encerramento.',
    source:'PMI, Benefits Realization Management: A Practice Guide, 2019',
  },
};

const gestaoAgil: SurveyPresentation = {
  slug:'gestao-agil-sem-bagunca',
  quizLabel:'Diagnóstico Gestão Ágil sem Bagunça',
  branchAnswerKey:'agile-start',
  processing:{
    labels:['Analisando suas escolhas','Mapeando suas competências','Preparando seu próximo passo'],
    subtitle:'Suas respostas mostram como você prioriza, entrega, colabora e se adapta no dia a dia.',
  },
  resultKicker:'Seu perfil em Gestão Ágil sem Bagunça',
  levels:{
    1:{name:'Ágil de Fachada',headline:'Você já se aproximou das práticas ágeis, mas a correria e os rituais ainda podem esconder o que realmente precisa ser entregue.',next:'Comece escolhendo uma prioridade clara, conclua uma entrega pequena e peça retorno a quem vai usá-la.'},
    2:{name:'Organizador do Fluxo',headline:'Você já busca organizar o trabalho, mas ainda perde ritmo quando muitas demandas competem pela sua atenção.',next:'Seu próximo passo é limitar o trabalho simultâneo, tornar bloqueios visíveis e concluir antes de começar mais.'},
    3:{name:'Praticante Adaptativo',headline:'Você já entrega em ciclos, colabora e ajusta o plano quando aprende algo novo.',next:'Fortaleça a ligação entre cada entrega e seu valor para o cliente, e transforme aprendizados em melhorias frequentes.'},
    4:{name:'Facilitador de Valor',headline:'Você demonstra uma agilidade que vai além dos rituais: mantém o foco, faz o trabalho fluir e aprende com cada entrega.',next:'Seu próximo salto é ajudar outras pessoas a ganhar autonomia, clareza e um ritmo sustentável de entrega.'},
  },
  gaugeLabels:['Fachada','Fluxo','Adaptação','Valor'],
  dimensions:[
    ['Foco no que gera valor','foco_valor'],
    ['Fluxo e entrega','fluxo_entrega'],
    ['Colaboração e autonomia','colaboracao_autonomia'],
    ['Adaptação e aprendizado','adaptacao_aprendizado'],
  ],
  showSalaryProjection:false,
  insightCard:{
    eyebrow:'PMI | Guia de práticas ágeis',
    title:'Agilidade aparece nas decisões e nas entregas, não na quantidade de rituais.',
    body:'O guia associa práticas ágeis à entrega frequente de valor, ciclos curtos de feedback e adaptação ao contexto. Observe a dimensão em que seu resultado aponta mais espaço para crescer e comece com um ajuste concreto.',
    source:'PMI, Guia de práticas ágeis, 2ª edição, seções 2 e 5',
  },
};

export function getSurveyPresentation(slug:string): SurveyPresentation {
  return slug === 'pmo-vmo' ? pmoVmo : slug === 'tire-projeto-do-papel' ? tireProjeto : slug === 'gestao-agil-sem-bagunca' ? gestaoAgil : gpIa;
}
