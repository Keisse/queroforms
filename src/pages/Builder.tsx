import { Link } from 'react-router-dom';
import { gpIaSteps } from '../data/gpIa';
export default function Builder(){
  return <>
    <header className="page-head"><div><div className="crumb">Diagnósticos › GP com IA</div><h1>Editor do diagnóstico</h1></div><div className="head-actions"><Link className="btn" to="/d/gp-ia">Pré-visualizar</Link><button className="btn dark">Publicar</button></div></header>
    <div className="builder-grid">
      <section className="steps-panel"><div className="steps-title">Fluxo <span>{gpIaSteps.length} telas</span></div>{gpIaSteps.map((s,i)=><div className="step-item" key={s.id}><span className="step-num">{i+1}</span><div><b>{s.kind==='question'?s.title:s.kind==='insight'?'Tela de contexto':s.kind==='intro'?'Abertura':s.kind==='processing'?'Gerando resultado':s.kind==='email'?'Captura de e-mail':s.kind==='name'?'Captura de nome':'Resultado'}</b><small>{s.kind}</small></div></div>)}</section>
      <section className="builder-canvas"><div className="canvas-phone"><div className="mini-progress"><span/></div><div className="canvas-inner"><h2>O que você mais quer conquistar usando IA na Gestão de Projetos?</h2><div className="option-card">⚡ Ganhar produtividade e tempo</div><div className="option-card">🎯 Tomar decisões melhores</div><div className="option-card">🗺️ Planejar projetos com mais precisão</div></div></div></section>
      <aside className="props-panel"><h3>Propriedades</h3><label>Título</label><textarea defaultValue="O que você mais quer conquistar usando IA na Gestão de Projetos?"/><label>Tipo</label><select><option>Escolha única</option></select><label>Dimensão</label><select><option>Aspiração</option></select><label><input type="checkbox" defaultChecked/> Avançar ao selecionar</label></aside>
    </div>
  </>
}
