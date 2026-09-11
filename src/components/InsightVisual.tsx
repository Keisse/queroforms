import { BarChart3, Sparkles, Users } from 'lucide-react';
import type { Step } from '../data/gpIa';

type InsightStep = Extract<Step,{kind:'insight'}>;

function AlmostThereVisual(){
  return <div className="qf-almost-ai-scene" aria-hidden="true">
    <div className="qf-almost-ai-grid"/>
    <div className="qf-almost-ai-halo"/>

    <div className="qf-almost-ai-radar">
      <div className="qf-almost-ai-ring r1"/>
      <div className="qf-almost-ai-ring r2"/>
      <div className="qf-almost-ai-ring r3"/>
      <div className="qf-almost-ai-ring r4"/>
      <div className="qf-almost-ai-axis axis-x"/>
      <div className="qf-almost-ai-axis axis-y"/>
      <div className="qf-almost-ai-scan"/>
      <div className="qf-almost-ai-core"><span/></div>
    </div>

    <div className="qf-almost-ai-line line-1"/>
    <div className="qf-almost-ai-line line-2"/>
    <div className="qf-almost-ai-line line-3"/>
    <div className="qf-almost-ai-line line-4"/>
    <div className="qf-almost-ai-line line-5"/>
    <div className="qf-almost-ai-line line-6"/>

    <div className="qf-almost-ai-node node-1"/>
    <div className="qf-almost-ai-node node-2"/>
    <div className="qf-almost-ai-node node-3"/>
    <div className="qf-almost-ai-node node-4"/>
    <div className="qf-almost-ai-node node-5"/>
    <div className="qf-almost-ai-node node-6"/>
    <div className="qf-almost-ai-node node-7"/>
    <div className="qf-almost-ai-node node-8"/>

    <div className="qf-almost-ai-chip live chip-1">interpretando dados</div>
    <div className="qf-almost-ai-chip chip-2">confiança</div>
    <div className="qf-almost-ai-chip chip-3">uso atual</div>
    <div className="qf-almost-ai-chip chip-4">aplicação prática</div>
    <div className="qf-almost-ai-chip chip-5">capacidade de decisão</div>
    <div className="qf-almost-ai-chip chip-6">estruturação</div>
    <div className="qf-almost-ai-chip chip-7">planejamento</div>
    <div className="qf-almost-ai-chip chip-8">riscos</div>
    <div className="qf-almost-ai-chip chip-9">comunicação</div>
    <div className="qf-almost-ai-chip chip-10">automação</div>
    <div className="qf-almost-ai-chip chip-11">dados</div>
    <div className="qf-almost-ai-chip chip-12">processos</div>
    <div className="qf-almost-ai-chip chip-13">ferramentas</div>
    <div className="qf-almost-ai-chip chip-14">prontidão</div>
    <div className="qf-almost-ai-chip chip-15">interesses</div>
  </div>;
}

function SalaryProjectionVisual(){
  return <svg className="qf-career-projection" viewBox="0 0 720 320" role="img" aria-label="Projeção de evolução profissional: Sem GP, Com GP sem IA e Com GP mais IA">
    <line x1="60" y1="258" x2="680" y2="258" className="qf-projection-axis" />
    <line x1="60" y1="42" x2="60" y2="258" className="qf-projection-axis" />
    <line x1="76" y1="202" x2="650" y2="202" className="qf-projection-grid" />
    <line x1="76" y1="145" x2="650" y2="145" className="qf-projection-grid" />
    <line x1="76" y1="88" x2="650" y2="88" className="qf-projection-grid" />

    <text x="55" y="25" className="qf-projection-axis-label">$</text>
    <text x="60" y="282" textAnchor="middle" className="qf-projection-axis-label">Hoje</text>
    <text x="220" y="282" textAnchor="middle" className="qf-projection-axis-label">1 ano</text>
    <text x="380" y="282" textAnchor="middle" className="qf-projection-axis-label">2 anos</text>
    <text x="540" y="282" textAnchor="middle" className="qf-projection-axis-label">3 anos</text>

    <path d="M60 255 C155 253 225 246 300 236 C380 225 450 212 535 196" className="qf-projection-line qf-no-gp" />
    <path d="M60 255 C135 248 220 226 300 198 C380 168 455 136 535 111" className="qf-projection-line qf-gp" />
    <path d="M60 255 C140 244 215 214 295 170 C375 125 455 79 535 54" className="qf-projection-line qf-gp-ai" />

    <circle cx="535" cy="196" r="7" className="qf-projection-point qf-no-gp qf-point-1" />
    <circle cx="535" cy="111" r="8" className="qf-projection-point qf-gp qf-point-2" />
    <circle cx="535" cy="54" r="9" className="qf-projection-point qf-gp-ai qf-point-3" />

    <g className="qf-projection-callout qf-callout-1">
      <rect x="452" y="202" width="171" height="50" rx="16" className="qf-callout-bg qf-no-gp" />
      <text x="538" y="223" textAnchor="middle" className="qf-callout-title qf-callout-dark">Sem GP</text>
      <text x="538" y="242" textAnchor="middle" className="qf-callout-value qf-callout-dark">crescimento menor</text>
    </g>

    <g className="qf-projection-callout qf-callout-2">
      <rect x="444" y="116" width="190" height="50" rx="16" className="qf-callout-bg qf-gp" />
      <text x="539" y="137" textAnchor="middle" className="qf-callout-title qf-callout-dark">Com GP sem IA</text>
      <text x="539" y="156" textAnchor="middle" className="qf-callout-value qf-callout-dark">evolução consistente</text>
    </g>

    <g className="qf-projection-callout qf-callout-3">
      <rect x="430" y="4" width="210" height="58" rx="18" className="qf-callout-bg qf-gp-ai" />
      <path d="M527 62 L543 62 L535 76 Z" className="qf-callout-arrow" />
      <text x="535" y="27" textAnchor="middle" className="qf-callout-title qf-callout-light">Com GP + IA</text>
      <text x="535" y="49" textAnchor="middle" className="qf-callout-value qf-callout-light">maior projeção</text>
    </g>
  </svg>;
}

function PreResultGuideVisual(){
  return <div className="qf-pre-result-placeholder" aria-label="Dados sobre inteligência artificial e gestão de projetos">
    <div className="qf-pre-result-stat">
      <span className="qf-pre-result-stat-icon" aria-hidden="true">⚙️</span>
      <span className="qf-pre-result-stat-number">80%</span>
      <span className="qf-pre-result-stat-copy">das tarefas de gestão de projetos serão executadas por IA até 2030<sup>1</sup></span>
    </div>
    <div className="qf-pre-result-stat">
      <span className="qf-pre-result-stat-icon" aria-hidden="true">↗</span>
      <span className="qf-pre-result-stat-number">86%</span>
      <span className="qf-pre-result-stat-copy">das empresas classificam IA e big data como competências prioritárias para sua força de trabalho<sup>2</sup></span>
    </div>
    <div className="qf-pre-result-stat">
      <span className="qf-pre-result-stat-icon" aria-hidden="true">✦</span>
      <span className="qf-pre-result-stat-number">1%</span>
      <span className="qf-pre-result-stat-copy">das organizações acreditam ter alcançado maturidade em GenAI, segundo pesquisa do PMI</span>
    </div>
  </div>;
}

export default function InsightVisual({step,imageUrl}:{step:InsightStep;imageUrl:string}){
  if(step.id==='insight-salary' && !imageUrl){
    return <div className="insight-visual qf-career-projection-host"><SalaryProjectionVisual/></div>;
  }

  if(imageUrl){
    return <div className="insight-visual qf-context-upload-host"><img className="qf-context-upload-image" src={imageUrl} alt="Imagem da tela de contexto"/></div>;
  }

  if(step.id==='insight-4'){
    return <div className="insight-visual qf-almost-there-ai-host" role="img" aria-label="Inteligência artificial cruzando e interpretando os dados do diagnóstico"><AlmostThereVisual/></div>;
  }

  if(step.id==='insight-pre-result-guide'){
    return <div className="insight-visual qf-pre-result-guide-visual"><PreResultGuideVisual/></div>;
  }

  return <div className="insight-visual">
    {step.visual==='chart'?<BarChart3 size={54}/>:step.visual==='people'?<Users size={54}/>:<Sparkles size={54}/>} 
  </div>;
}
