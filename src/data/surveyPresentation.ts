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

export function getSurveyPresentation(slug:string): SurveyPresentation {
  return slug === 'pmo-vmo' ? pmoVmo : gpIa;
}
