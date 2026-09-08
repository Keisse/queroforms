export type Option = { label: string; value: string; emoji?: string; score?: number };
export type Step =
  | { id: string; kind: 'intro'; title: string; body: string; cta: string; art?: 'hero' }
  | { id: string; kind: 'question'; title: string; subtitle?: string; input: 'single'|'multi'|'scale'; options: Option[]; dimension?: string }
  | { id: string; kind: 'insight'; eyebrow?: string; title: string; body: string; stat?: string; source?: string }
  | { id: string; kind: 'processing'; title: string }
  | { id: string; kind: 'email'; title: string }
  | { id: string; kind: 'name'; title: string }
  | { id: string; kind: 'result' };

const scale = [
  { label: 'Nada', value: '1', emoji: '👎', score: 1 },
  { label: 'Pouco', value: '2', emoji: '🤏', score: 2 },
  { label: 'Mais ou menos', value: '3', emoji: '🤷', score: 3 },
  { label: 'Bastante', value: '4', emoji: '👍', score: 4 },
  { label: 'Muito', value: '5', emoji: '🙌', score: 5 },
];

export const gpIaSteps: Step[] = [
  { id:'intro', kind:'intro', title:'Descubra seu nível de maturidade em IA na Gestão de Projetos', body:'Em poucos minutos, vamos identificar como você usa IA hoje e o que falta para transformar ferramentas em vantagem real na gestão de projetos.', cta:'Começar diagnóstico', art:'hero' },
  { id:'goal', kind:'question', title:'O que você mais quer conquistar usando IA na Gestão de Projetos?', input:'single', dimension:'aspiracao', options:[
    {label:'Ganhar produtividade e tempo',value:'produtividade',emoji:'⚡'},{label:'Tomar decisões melhores',value:'decisoes',emoji:'🎯'},{label:'Planejar projetos com mais precisão',value:'planejamento',emoji:'🗺️'},{label:'Antecipar riscos e problemas',value:'riscos',emoji:'🛡️'},{label:'Evoluir profissionalmente',value:'carreira',emoji:'🚀'}]},
  { id:'role', kind:'question', title:'Qual opção mais representa sua atuação hoje?', input:'single', dimension:'perfil', options:[
    {label:'Gerente / Líder de Projetos',value:'gp',emoji:'🧭'},{label:'PMO / VMO',value:'pmo',emoji:'🏢'},{label:'Produto / Ágil',value:'agile',emoji:'🔁'},{label:'Analista / Coordenador',value:'analista',emoji:'📊'},{label:'Executivo / Gestor',value:'gestor',emoji:'💼'},{label:'Outro',value:'outro',emoji:'✨'}]},
  { id:'pmi-cert', kind:'question', title:'Quais certificações do PMI você possui?', subtitle:'Selecione todas que se aplicam', input:'multi', dimension:'certificacao', options:[
    {label:'PMP®',value:'pmp',emoji:'🏅'},{label:'CAPM®',value:'capm',emoji:'📘'},{label:'PMI-ACP®',value:'acp',emoji:'🔁'},{label:'PMI-CPMAI™',value:'cpmai',emoji:'🤖'},{label:'Outra certificação PMI',value:'outra',emoji:'🎓'},{label:'Ainda não possuo certificação PMI',value:'nenhuma',emoji:'🌱'}]},
  { id:'cpmai-awareness', kind:'question', title:'Você já conhece a certificação PMI-CPMAI™?', input:'single', dimension:'cpmai', options:[
    {label:'Sim, já tenho a certificação',value:'certified',emoji:'🏆'},{label:'Sim, conheço e tenho interesse',value:'interested',emoji:'🚀'},{label:'Já ouvi falar, mas conheço pouco',value:'heard',emoji:'👀'},{label:'Não conhecia até agora',value:'new',emoji:'✨'}]},
  { id:'ai-use', kind:'question', title:'Com que frequência você usa IA no trabalho?', input:'single', dimension:'uso', options:[
    {label:'Ainda não uso',value:'never',score:0},{label:'Algumas vezes por mês',value:'monthly',score:1},{label:'Algumas vezes por semana',value:'weekly',score:2},{label:'Praticamente todos os dias',value:'daily',score:3}]},
  { id:'tools', kind:'question', title:'Quais ferramentas de IA você já utilizou?', subtitle:'Selecione todas que se aplicam', input:'multi', dimension:'ferramentas', options:[
    {label:'ChatGPT',value:'chatgpt',emoji:'🤖'},{label:'Microsoft Copilot',value:'copilot',emoji:'🧩'},{label:'Gemini',value:'gemini',emoji:'✨'},{label:'Claude',value:'claude',emoji:'✳️'},{label:'Perplexity',value:'perplexity',emoji:'🔎'},{label:'Ainda nenhuma',value:'none',emoji:'🌱'}]},
  { id:'confidence', kind:'question', title:'Quão confiante você se sente usando IA no trabalho?', input:'scale', dimension:'confianca', options:scale },
  { id:'insight-1', kind:'insight', eyebrow:'PMBOK® 8ª edição', title:'IA já faz parte do novo contexto da gestão de projetos.', body:'O guia destaca aplicações como análise de grandes volumes de dados, previsão de riscos, recomendação de ações, automação de tarefas rotineiras e apoio ao planejamento. Mas reforça dois pontos críticos: qualidade das entradas e supervisão humana.', stat:'IA + julgamento humano = decisões melhores', source:'Guia PMBOK® — 8ª edição' },
  { id:'q7', kind:'question', title:'Quando precisa iniciar um projeto, você usa IA para estruturar o plano?', input:'single', dimension:'planejamento', options:[
    {label:'Nunca',value:'0',score:0},{label:'Só para ideias iniciais',value:'1',score:1},{label:'Para criar estrutura e entregáveis',value:'2',score:2},{label:'Para estruturar cenários, premissas e alternativas',value:'3',score:3}]},
  { id:'q8', kind:'question', title:'Você utiliza IA para transformar objetivos em escopo e entregáveis?', input:'scale', dimension:'planejamento', options:scale },
  { id:'q9', kind:'question', title:'Você usa IA para estimar riscos antes que eles virem problemas?', input:'scale', dimension:'riscos', options:scale },
  { id:'q10', kind:'question', title:'Ao receber um projeto atrasado, o que você faria com IA?', input:'single', dimension:'decisao', options:[
    {label:'Não saberia como usar IA',value:'0',score:0},{label:'Pediria um resumo',value:'1',score:1},{label:'Pediria causas e problemas',value:'2',score:2},{label:'Analisaria causas, riscos, cenários e próximas ações',value:'3',score:3}]},
  { id:'q11', kind:'question', title:'Você usa IA para preparar relatórios executivos de status?', input:'scale', dimension:'comunicacao', options:scale },
  { id:'q12', kind:'question', title:'Você usa IA para adaptar a comunicação para diferentes partes interessadas?', input:'scale', dimension:'comunicacao', options:scale },
  { id:'q13', kind:'question', title:'Você usa IA para transformar reuniões em decisões, responsáveis e próximos passos?', input:'scale', dimension:'execucao', options:scale },
  { id:'insight-2', kind:'insight', eyebrow:'Gestão moderna de projetos', title:'O gerente de projetos está deixando de ser apenas organizador para atuar cada vez mais como estrategista e agente de mudança.', body:'No contexto atual, a tecnologia amplia a capacidade do profissional, mas o valor vem de conectar informação, decisão, pessoas e objetivos estratégicos.', stat:'Menos operação repetitiva. Mais tempo para estratégia e valor.', source:'Guia PMBOK® — 8ª edição' },
  { id:'q14', kind:'question', title:'Como você normalmente escreve suas instruções para a IA?', input:'single', dimension:'prompting', options:[
    {label:'Faço perguntas simples, como em um buscador',value:'0',score:0},{label:'Explico rapidamente o que preciso',value:'1',score:1},{label:'Dou contexto, objetivo e formato esperado',value:'2',score:2},{label:'Uso estruturas reutilizáveis, exemplos e critérios',value:'3',score:3}]},
  { id:'q15', kind:'question', title:'Você mantém uma biblioteca de instruções ou modelos reutilizáveis para IA?', input:'scale', dimension:'prompting', options:scale },
  { id:'q16', kind:'question', title:'Você já criou algum fluxo recorrente usando IA?', input:'single', dimension:'automacao', options:[
    {label:'Não',value:'0',score:0},{label:'Faço tudo manualmente',value:'1',score:1},{label:'Tenho alguns modelos reutilizáveis',value:'2',score:2},{label:'Tenho automações, agentes ou fluxos estruturados',value:'3',score:3}]},
  { id:'q17', kind:'question', title:'Quanto dos dados do projeto você consegue transformar em insights com IA?', input:'scale', dimension:'dados', options:scale },
  { id:'q18', kind:'question', title:'Você usa IA para comparar cenários antes de tomar decisões?', input:'scale', dimension:'decisao', options:scale },
  { id:'q19', kind:'question', title:'Você usa IA para priorizar tarefas, riscos ou decisões?', input:'scale', dimension:'decisao', options:scale },
  { id:'q20', kind:'question', title:'Você consegue explicar para outra pessoa um processo de uso de IA que você criou?', input:'scale', dimension:'processo', options:scale },
  { id:'insight-3', kind:'insight', eyebrow:'Foco em valor', title:'O PMBOK® atual reforça uma mudança de mentalidade: projeto bom não é só o que entrega. É o que gera valor.', body:'Por isso, maturidade em IA não deve ser medida pelo número de ferramentas usadas, mas pela capacidade de melhorar decisões, resultados e valor para as partes interessadas.', stat:'Ferramentas são meio. Valor é o resultado.', source:'Guia PMBOK® — 8ª edição' },
  { id:'q21', kind:'question', title:'Onde você mais gostaria de usar IA na Gestão de Projetos?', subtitle:'Selecione todas que se aplicam', input:'multi', dimension:'interesse', options:[
    {label:'Planejamento',value:'planejamento',emoji:'🗺️'},{label:'Cronogramas',value:'cronograma',emoji:'📅'},{label:'Riscos',value:'riscos',emoji:'🛡️'},{label:'Reuniões',value:'reunioes',emoji:'📝'},{label:'Relatórios',value:'relatorios',emoji:'📊'},{label:'Partes interessadas',value:'stakeholders',emoji:'💬'},{label:'Decisões',value:'decisoes',emoji:'🎯'},{label:'Automação',value:'automacao',emoji:'🤖'}]},
  { id:'q22', kind:'question', title:'Você se preocupa em ficar para trás profissionalmente se não evoluir no uso de IA?', input:'scale', dimension:'motivacao', options:scale },
  { id:'q23', kind:'question', title:'Quão preparado você se sente para aprender aplicações mais avançadas de IA?', input:'scale', dimension:'prontidao', options:scale },
  { id:'q24', kind:'question', title:'Quanto tempo por dia você conseguiria dedicar para evoluir no uso de IA?', input:'single', dimension:'tempo', options:[{label:'5 minutos',value:'5'},{label:'10 minutos',value:'10'},{label:'15 minutos',value:'15'},{label:'20 minutos ou mais',value:'20'}]},
  { id:'q25', kind:'question', title:'Qual é hoje sua maior barreira para usar IA melhor?', input:'single', dimension:'barreira', options:[{label:'Não sei exatamente onde aplicar',value:'onde'},{label:'Não sei criar boas instruções',value:'prompt'},{label:'Falta tempo para aprender',value:'tempo'},{label:'Falta conhecimento técnico',value:'tecnico'},{label:'Não consigo integrar ao meu processo',value:'processo'},{label:'Minha empresa ainda não usa de forma estruturada',value:'empresa'}]},
  { id:'q26', kind:'question', title:'Quanto você acredita que já utiliza do potencial da IA hoje?', input:'single', dimension:'autopercepcao', options:[{label:'Menos de 10%',value:'10',score:1},{label:'Entre 10% e 30%',value:'30',score:2},{label:'Entre 30% e 60%',value:'60',score:3},{label:'Mais de 60%',value:'90',score:4}]},
  { id:'q27', kind:'question', title:'Qual frase mais representa sua realidade?', input:'single', dimension:'maturidade', options:[{label:'Sei que IA é importante, mas ainda não sei por onde começar.',value:'0',score:0},{label:'Já uso IA, mas sinto que aproveito pouco.',value:'1',score:1},{label:'IA já faz parte da minha rotina, mas ainda não está integrada aos processos.',value:'2',score:2},{label:'Já uso IA de forma estruturada e quero avançar para agentes e automações.',value:'3',score:3}]},
  { id:'insight-4', kind:'insight', eyebrow:'Quase lá', title:'Seu diagnóstico já consegue enxergar um padrão claro.', body:'Estamos cruzando seu uso atual, confiança, aplicação prática, capacidade de decisão e nível de estruturação para chegar ao seu perfil.', stat:'Seu resultado é construído a partir das suas respostas — não de um teste genérico.' },
  { id:'q28', kind:'question', title:'Você já apresentou ou defendeu uma decisão de projeto com apoio de IA?', input:'scale', dimension:'lideranca', options:scale },
  { id:'q29', kind:'question', title:'Você já transformou um processo manual do projeto em um fluxo assistido por IA?', input:'scale', dimension:'automacao', options:scale },
  { id:'q30', kind:'question', title:'Se tivesse um método prático de Gestão de Projetos com IA, quão provável seria aplicar já no próximo projeto?', input:'scale', dimension:'intencao', options:scale },
  { id:'email', kind:'email', title:'Seu diagnóstico está quase pronto. Qual e-mail devemos usar para liberar o resultado?' },
  { id:'name', kind:'name', title:'E como podemos chamar você?' },
  { id:'processing', kind:'processing', title:'Gerando seu diagnóstico de maturidade em IA...' },
  { id:'result', kind:'result' }
];

export function scoreResult(answers: Record<string, string | string[]>) {
  let score = 0; let max = 0;
  const buckets: Record<string,{score:number;max:number}> = {};
  for (const step of gpIaSteps) {
    if (step.kind !== 'question') continue;
    const val = answers[step.id];
    if (!val) continue;
    let qScore = 0; let qMax = 0;
    if (Array.isArray(val)) { qScore = Math.min(val.length, 4); qMax = 4; }
    else {
      const op = step.options.find(o => o.value === val);
      if (op?.score !== undefined) { qScore = op.score; qMax = Math.max(...step.options.map(o => o.score ?? 0), 1); }
    }
    score += qScore; max += qMax;
    if (step.dimension && qMax > 0) {
      const b = buckets[step.dimension] ?? {score:0,max:0};
      b.score += qScore; b.max += qMax; buckets[step.dimension] = b;
    }
  }
  const pct = max ? Math.round((score/max)*100) : 0;
  const level = pct < 25 ? 1 : pct < 50 ? 2 : pct < 75 ? 3 : 4;
  const dimensions = Object.fromEntries(Object.entries(buckets).map(([key,b]) => [key, b.max ? Math.round((b.score/b.max)*100) : 0]));
  return { pct, level, dimensions };
}

export const levelCopy = {
  1: { name:'Explorador de IA', headline:'Você já percebeu que IA importa — agora precisa transformar curiosidade em aplicação prática.', next:'Seu próximo passo é aprender onde aplicar IA no ciclo de vida do projeto e criar seus primeiros usos estruturados.' },
  2: { name:'Usuário de IA', headline:'Você já usa IA, mas ainda captura apenas uma parte do valor que ela pode gerar.', next:'Seu próximo salto é sair das instruções isoladas e criar métodos reutilizáveis para planejamento, riscos, comunicação e decisão.' },
  3: { name:'Profissional Aumentado por IA', headline:'A IA já funciona como uma extensão da sua capacidade profissional.', next:'Agora o ganho está em transformar usos individuais em processos, automações e rotinas de gestão mais inteligentes.' },
  4: { name:'Gestor orientado por IA', headline:'Você já opera acima da média e pensa IA como parte do sistema de gestão.', next:'Seu desafio é escalar: agentes, integrações, governança e novas formas de operar projetos com IA.' }
};