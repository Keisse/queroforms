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
  { label: 'Muito', value: '5', emoji: '👍', score: 5 },
];

export const gpIaSteps: Step[] = [
  { id:'intro', kind:'intro', title:'Descubra seu nível de maturidade em IA na Gestão de Projetos', body:'Em poucos minutos, vamos identificar como você usa IA hoje e o que falta para transformar ferramentas em vantagem real na gestão de projetos.', cta:'Começar diagnóstico', art:'hero' },
  { id:'goal', kind:'question', title:'O que você mais quer conquistar usando IA na Gestão de Projetos?', input:'single', dimension:'aspiracao', options:[
    {label:'Ganhar produtividade e tempo',value:'produtividade',emoji:'⚡'},{label:'Tomar decisões melhores',value:'decisoes',emoji:'🎯'},{label:'Planejar projetos com mais precisão',value:'planejamento',emoji:'🗺️'},{label:'Antecipar riscos e problemas',value:'riscos',emoji:'🛡️'},{label:'Evoluir profissionalmente',value:'carreira',emoji:'🚀'}]},
  { id:'role', kind:'question', title:'Qual opção mais representa sua atuação hoje?', input:'single', dimension:'perfil', options:[
    {label:'Gerente / Líder de Projetos',value:'gp',emoji:'🧭'},{label:'PMO / VMO',value:'pmo',emoji:'🏢'},{label:'Product / Agile',value:'agile',emoji:'🔁'},{label:'Analista / Coordenador',value:'analista',emoji:'📊'},{label:'Executivo / Gestor',value:'gestor',emoji:'💼'},{label:'Outro',value:'outro',emoji:'✨'}]},
  { id:'ai-use', kind:'question', title:'Com que frequência você usa IA no trabalho?', input:'single', dimension:'uso', options:[
    {label:'Ainda não uso',value:'never',score:0},{label:'Algumas vezes por mês',value:'monthly',score:1},{label:'Algumas vezes por semana',value:'weekly',score:2},{label:'Praticamente todos os dias',value:'daily',score:3}]},
  { id:'tools', kind:'question', title:'Quais ferramentas de IA você já utilizou?', subtitle:'Selecione todas que se aplicam', input:'multi', dimension:'ferramentas', options:[
    {label:'ChatGPT',value:'chatgpt',emoji:'🤖'},{label:'Microsoft Copilot',value:'copilot',emoji:'🧩'},{label:'Gemini',value:'gemini',emoji:'✨'},{label:'Claude',value:'claude',emoji:'✳️'},{label:'Perplexity',value:'perplexity',emoji:'🔎'},{label:'Ainda nenhuma',value:'none',emoji:'🌱'}]},
  { id:'confidence', kind:'question', title:'Quão confiante você se sente usando IA no trabalho?', input:'scale', dimension:'confianca', options:scale },
  { id:'insight-1', kind:'insight', eyebrow:'Você já começou', title:'O diferencial agora não é “usar IA”. É saber onde ela realmente muda o resultado do projeto.', body:'Profissionais que estruturam o uso de IA em processos deixam de depender de prompts soltos e passam a ganhar velocidade, qualidade e consistência.', stat:'IA aplicada ao processo > IA usada como buscador' },
  { id:'q7', kind:'question', title:'Quando precisa iniciar um projeto, você usa IA para estruturar o plano?', input:'single', dimension:'planejamento', options:[
    {label:'Nunca',value:'0',score:0},{label:'Só para ideias iniciais',value:'1',score:1},{label:'Para criar estrutura e entregáveis',value:'2',score:2},{label:'Para estruturar cenários, premissas e alternativas',value:'3',score:3}]},
  { id:'q8', kind:'question', title:'Você utiliza IA para transformar objetivos em escopo e entregáveis?', input:'scale', dimension:'planejamento', options:scale },
  { id:'q9', kind:'question', title:'Você usa IA para estimar riscos antes que eles virem problemas?', input:'scale', dimension:'riscos', options:scale },
  { id:'q10', kind:'question', title:'Ao receber um projeto atrasado, o que você faria com IA?', input:'single', dimension:'decisao', options:[
    {label:'Não saberia como usar IA',value:'0',score:0},{label:'Pediria um resumo',value:'1',score:1},{label:'Pediria causas e problemas',value:'2',score:2},{label:'Analisaria causas, riscos, cenários e próximas ações',value:'3',score:3}]},
  { id:'q11', kind:'question', title:'Você usa IA para preparar status reports executivos?', input:'scale', dimension:'comunicacao', options:scale },
  { id:'q12', kind:'question', title:'Você usa IA para adaptar a comunicação para diferentes stakeholders?', input:'scale', dimension:'comunicacao', options:scale },
  { id:'q13', kind:'question', title:'Você usa IA para transformar reuniões em decisões, responsáveis e próximos passos?', input:'scale', dimension:'execucao', options:scale },
  { id:'insight-2', kind:'insight', eyebrow:'Uma mudança importante', title:'IA não substitui o gerente de projetos. Ela aumenta a capacidade de leitura, síntese e decisão.', body:'A maior oportunidade não está em gerar textos mais rápido, mas em reduzir o tempo entre informação, entendimento e ação.', stat:'Mais velocidade para decidir. Menos tempo operacional.' },
  { id:'q14', kind:'question', title:'Como você normalmente escreve seus prompts?', input:'single', dimension:'prompting', options:[
    {label:'Perguntas simples, como no Google',value:'0',score:0},{label:'Explico rapidamente o que preciso',value:'1',score:1},{label:'Dou contexto, objetivo e formato',value:'2',score:2},{label:'Uso estruturas reutilizáveis, exemplos e critérios',value:'3',score:3}]},
  { id:'q15', kind:'question', title:'Você mantém uma biblioteca de prompts ou instruções reutilizáveis?', input:'scale', dimension:'prompting', options:scale },
  { id:'q16', kind:'question', title:'Você já criou algum fluxo recorrente usando IA?', input:'single', dimension:'automacao', options:[
    {label:'Não',value:'0',score:0},{label:'Faço tudo manualmente',value:'1',score:1},{label:'Tenho alguns modelos reutilizáveis',value:'2',score:2},{label:'Tenho automações, agentes ou fluxos estruturados',value:'3',score:3}]},
  { id:'q17', kind:'question', title:'Quanto dos dados do projeto você consegue transformar em insights com IA?', input:'scale', dimension:'dados', options:scale },
  { id:'q18', kind:'question', title:'Você usa IA para comparar cenários antes de tomar decisões?', input:'scale', dimension:'decisao', options:scale },
  { id:'q19', kind:'question', title:'Você usa IA para priorizar tarefas, riscos ou decisões?', input:'scale', dimension:'decisao', options:scale },
  { id:'q20', kind:'question', title:'Você consegue explicar para outra pessoa um processo de uso de IA que você criou?', input:'scale', dimension:'processo', options:scale },
  { id:'insight-3', kind:'insight', eyebrow:'O próximo nível', title:'Prompts isolados ajudam. Processos inteligentes escalam.', body:'Quando o uso deixa de depender de inspiração individual e passa a seguir um método, a IA começa a gerar valor de forma previsível.', stat:'Do prompt → ao processo → ao sistema' },
  { id:'q21', kind:'question', title:'Onde você mais gostaria de usar IA na Gestão de Projetos?', subtitle:'Selecione todas que se aplicam', input:'multi', dimension:'interesse', options:[
    {label:'Planejamento',value:'planejamento',emoji:'🗺️'},{label:'Cronogramas',value:'cronograma',emoji:'📅'},{label:'Riscos',value:'riscos',emoji:'🛡️'},{label:'Reuniões',value:'reunioes',emoji:'📝'},{label:'Relatórios',value:'relatorios',emoji:'📊'},{label:'Stakeholders',value:'stakeholders',emoji:'💬'},{label:'Decisões',value:'decisoes',emoji:'🎯'},{label:'Automação',value:'automacao',emoji:'🤖'}]},
  { id:'q22', kind:'question', title:'Você se preocupa em ficar para trás profissionalmente se não evoluir no uso de IA?', input:'scale', dimension:'motivacao', options:scale },
  { id:'q23', kind:'question', title:'Quão preparado você se sente para aprender aplicações mais avançadas de IA?', input:'scale', dimension:'prontidao', options:scale },
  { id:'q24', kind:'question', title:'Quanto tempo por dia você conseguiria dedicar para evoluir no uso de IA?', input:'single', dimension:'tempo', options:[{label:'5 minutos',value:'5'},{label:'10 minutos',value:'10'},{label:'15 minutos',value:'15'},{label:'20 minutos ou mais',value:'20'}]},
  { id:'q25', kind:'question', title:'Qual é hoje sua maior barreira para usar IA melhor?', input:'single', dimension:'barreira', options:[{label:'Não sei exatamente onde aplicar',value:'onde'},{label:'Não sei criar bons prompts',value:'prompt'},{label:'Falta tempo para aprender',value:'tempo'},{label:'Falta conhecimento técnico',value:'tecnico'},{label:'Não consigo integrar ao meu processo',value:'processo'},{label:'Minha empresa ainda não usa de forma estruturada',value:'empresa'}]},
  { id:'q26', kind:'question', title:'Quanto você acredita que já utiliza do potencial da IA hoje?', input:'single', dimension:'autopercepcao', options:[{label:'Menos de 10%',value:'10',score:1},{label:'Entre 10% e 30%',value:'30',score:2},{label:'Entre 30% e 60%',value:'60',score:3},{label:'Mais de 60%',value:'90',score:4}]},
  { id:'q27', kind:'question', title:'Qual frase mais representa sua realidade?', input:'single', dimension:'maturidade', options:[{label:'Sei que IA é importante, mas ainda não sei por onde começar.',value:'0',score:0},{label:'Já uso IA, mas sinto que aproveito pouco.',value:'1',score:1},{label:'IA já faz parte da minha rotina, mas ainda não está integrada aos processos.',value:'2',score:2},{label:'Já uso IA de forma estruturada e quero avançar para agentes e automações.',value:'3',score:3}]},
  { id:'insight-4', kind:'insight', eyebrow:'Quase lá', title:'Seu diagnóstico já consegue enxergar um padrão claro.', body:'Estamos cruzando seu uso atual, confiança, aplicação prática, capacidade de decisão e nível de estruturação para chegar ao seu perfil.', stat:'Seu resultado será baseado nas suas respostas — não em um teste genérico.' },
  { id:'q28', kind:'question', title:'Você já apresentou ou defendeu uma decisão de projeto com apoio de IA?', input:'scale', dimension:'lideranca', options:scale },
  { id:'q29', kind:'question', title:'Você já transformou um processo manual do projeto em um fluxo assistido por IA?', input:'scale', dimension:'automacao', options:scale },
  { id:'q30', kind:'question', title:'Se tivesse um método prático de GP com IA, quão provável seria aplicar já no próximo projeto?', input:'scale', dimension:'intencao', options:scale },
  { id:'processing', kind:'processing', title:'Gerando seu diagnóstico de maturidade em IA...' },
  { id:'email', kind:'email', title:'Seu resultado está pronto. Qual e-mail devemos usar para liberar seu diagnóstico?' },
  { id:'name', kind:'name', title:'E como podemos chamar você?' },
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
  2: { name:'Usuário de IA', headline:'Você já usa IA, mas ainda captura apenas uma parte do valor que ela pode gerar.', next:'Seu próximo salto é sair dos prompts isolados e criar métodos reutilizáveis para planejamento, riscos, comunicação e decisão.' },
  3: { name:'Profissional Aumentado por IA', headline:'A IA já funciona como uma extensão da sua capacidade profissional.', next:'Agora o ganho está em transformar usos individuais em processos, automações e rotinas de gestão mais inteligentes.' },
  4: { name:'Gestor AI-First', headline:'Você já opera acima da média e pensa IA como parte do sistema de gestão.', next:'Seu desafio é escalar: agentes, integrações, governança e novas formas de operar projetos com IA.' }
};
