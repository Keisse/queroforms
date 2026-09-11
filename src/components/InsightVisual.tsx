import { BarChart3, Sparkles, Users } from 'lucide-react';
import type { Step } from '../data/gpIa';

type InsightStep = Extract<Step,{kind:'insight'}>;

function AlmostThereVisual(){
  return <div className="qf-almost-ai-scene" aria-hidden="true">
    <div className="qf-almost-ai-halo"/>
    <div className="qf-almost-ai-scan"/>
    <div className="qf-almost-ai-ring r1"/>
    <div className="qf-almost-ai-ring r2"/>
    <div className="qf-almost-ai-core">IA</div>

    <div className="qf-almost-ai-line line-1"/>
    <div className="qf-almost-ai-line line-2"/>
    <div className="qf-almost-ai-line line-3"/>
    <div className="qf-almost-ai-line line-4"/>

    <div className="qf-almost-ai-node node-1"/>
    <div className="qf-almost-ai-node node-2"/>
    <div className="qf-almost-ai-node node-3"/>
    <div className="qf-almost-ai-node node-4"/>

    <div className="qf-almost-ai-chip live chip-1">interpretando dados</div>
    <div className="qf-almost-ai-chip chip-2">confiança analisada</div>
    <div className="qf-almost-ai-chip chip-3">uso atual</div>
    <div className="qf-almost-ai-chip chip-4">decisão</div>
    <div className="qf-almost-ai-chip chip-5">padrões em tempo real</div>

    <div className="qf-almost-ai-bars">
      <div className="qf-almost-ai-bar bar-1"/>
      <div className="qf-almost-ai-bar bar-2"/>
      <div className="qf-almost-ai-bar bar-3"/>
      <div className="qf-almost-ai-bar bar-4"/>
    </div>
  </div>;
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
  if(imageUrl){
    return <div className="insight-visual qf-context-upload-host"><img className="qf-context-upload-image" src={imageUrl} alt="Imagem da tela de contexto"/></div>;
  }

  if(step.id==='insight-4'){
    return <div className="insight-visual qf-almost-there-ai-host" role="img" aria-label="Inteligência artificial interpretando os dados do diagnóstico"><AlmostThereVisual/></div>;
  }

  if(step.id==='insight-pre-result-guide'){
    return <div className="insight-visual qf-pre-result-guide-visual"><PreResultGuideVisual/></div>;
  }

  return <div className="insight-visual">
    {step.visual==='chart'?<BarChart3 size={54}/>:step.visual==='people'?<Users size={54}/>:<Sparkles size={54}/>} 
  </div>;
}
