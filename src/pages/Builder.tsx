import { useState } from 'react';
import { Option, Step } from '../data/gpIa';
import { loadSteps, saveSteps, resetSteps, hasCustomSteps } from '../lib/stepsStore';

function labelFor(s: Step){
  return s.kind==='question' ? s.title
    : s.kind==='insight' ? 'Tela de contexto'
    : s.kind==='intro' ? 'Abertura'
    : s.kind==='branch' ? 'Resposta condicional'
    : s.kind==='processing' ? 'Gerando resultado'
    : s.kind==='email' ? 'Captura de e-mail'
    : s.kind==='name' ? 'Captura de nome'
    : 'Resultado';
}

export default function Builder(){
  const [steps,setSteps]=useState<Step[]>(()=>loadSteps());
  const [sel,setSel]=useState(0);
  const [savedMsg,setSavedMsg]=useState('');
  const [customized,setCustomized]=useState(hasCustomSteps());
  const step=steps[sel];

  const update=(patch: Partial<Step>)=>{
    setSteps(prev=>prev.map((s,i)=>i===sel?{...s,...patch} as Step:s));
  };
  const updateOption=(optIdx:number, patch: Partial<Option>)=>{
    if(step.kind!=='question') return;
    const opts=step.options.map((o,i)=>i===optIdx?{...o,...patch}:o);
    update({options:opts} as Partial<Step>);
  };
  const addOption=()=>{
    if(step.kind!=='question') return;
    const opts=[...step.options, {label:'Nova opção', value:`opt-${Date.now()}`}];
    update({options:opts} as Partial<Step>);
  };
  const removeOption=(optIdx:number)=>{
    if(step.kind!=='question') return;
    if(step.options.length<=1) return;
    update({options: step.options.filter((_,i)=>i!==optIdx)} as Partial<Step>);
  };
  const publish=()=>{
    saveSteps(steps);
    setCustomized(true);
    setSavedMsg('Publicado ✓');
    setTimeout(()=>setSavedMsg(''),2200);
  };
  const restore=()=>{
    resetSteps();
    const defaults=loadSteps();
    setSteps(defaults);
    setSel(0);
    setCustomized(false);
    setSavedMsg('Restaurado ao padrão');
    setTimeout(()=>setSavedMsg(''),2200);
  };

  return <>
    <header className="page-head">
      <div><div className="crumb">Diagnósticos › GP com IA</div><h1>Editor do diagnóstico</h1></div>
      <div className="head-actions">
        {savedMsg && <span className="conn ok" style={{alignSelf:'center',marginRight:8}}>{savedMsg}</span>}
        <a className="btn" href="/d/gp-ia" target="_blank" rel="noreferrer">Pré-visualizar</a>
        <button className="btn" onClick={restore} title="Volta às perguntas originais neste navegador">Restaurar padrão</button>
        <button className="btn dark" onClick={publish}>Publicar</button>
      </div>
    </header>
    {customized && <p className="muted" style={{margin:'-10px 0 18px'}}>Você está editando uma versão personalizada, salva neste navegador. Quem acessa o link em outro dispositivo ainda vê a versão publicada no código.</p>}
    <div className="builder-grid">
      <section className="steps-panel">
        <div className="steps-title">Fluxo <span>{steps.length} telas</span></div>
        {steps.map((s,i)=><div className={`step-item ${i===sel?'active':''}`} key={s.id} onClick={()=>setSel(i)} style={{cursor:'pointer'}}>
          <span className="step-num">{i+1}</span>
          <div><b>{labelFor(s)}</b><small>{s.kind}</small></div>
        </div>)}
      </section>

      <section className="builder-canvas">
        <div className="canvas-phone">
          <div className="mini-progress"><span style={{width:`${Math.round(((sel+1)/steps.length)*100)}%`}}/></div>
          <div className="canvas-inner">
            {step.kind==='question' && <>
              <h2>{step.title}</h2>
              {step.subtitle && <p style={{textAlign:'center',color:'#7a8b9c',marginTop:-8}}>{step.subtitle}</p>}
              {step.options.map(o=><div className="option-card" key={o.value}>{o.emoji?`${o.emoji} `:''}{o.label}</div>)}
            </>}
            {step.kind==='insight' && <>
              <h2>{step.title}</h2>
              <p style={{textAlign:'center',color:'#7a8b9c'}}>{step.body}</p>
              {step.stat && <div className="option-card"><b>{step.stat}</b></div>}
            </>}
            {step.kind==='intro' && <>
              <h2>{step.title}</h2>
              <p style={{textAlign:'center',color:'#7a8b9c'}}>{step.body}</p>
            </>}
            {step.kind==='branch' && <>
              <h2>{Object.values(step.variants)[0]?.title}</h2>
              <p style={{textAlign:'center',color:'#7a8b9c'}}>Varia conforme a resposta anterior</p>
            </>}
            {(step.kind==='email'||step.kind==='name') && <h2>{step.title}</h2>}
            {step.kind==='processing' && <h2>{step.title}</h2>}
            {step.kind==='result' && <p style={{textAlign:'center',color:'#7a8b9c'}}>Tela de resultado (composta, ver pré-visualização)</p>}
          </div>
        </div>
      </section>

      <aside className="props-panel">
        <h3>Propriedades</h3>

        {step.kind==='question' && <>
          <label>Título</label>
          <textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Subtítulo</label>
          <textarea value={step.subtitle||''} onChange={e=>update({subtitle:e.target.value} as Partial<Step>)}/>
          <label>Tipo</label>
          <select value={step.input} onChange={e=>update({input:e.target.value as any} as Partial<Step>)}>
            <option value="single">Escolha única</option>
            <option value="multi">Múltipla escolha</option>
            <option value="scale">Escala</option>
          </select>
          <label>Opções</label>
          {step.options.map((o,i)=><div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
            <input style={{width:36}} value={o.emoji||''} placeholder="🙂" onChange={e=>updateOption(i,{emoji:e.target.value})}/>
            <input style={{flex:1}} value={o.label} onChange={e=>updateOption(i,{label:e.target.value})}/>
            <button className="btn" onClick={()=>removeOption(i)} title="Remover opção">✕</button>
          </div>)}
          <button className="btn" onClick={addOption}>+ Adicionar opção</button>
        </>}

        {step.kind==='insight' && <>
          <label>Categoria (eyebrow)</label>
          <textarea value={step.eyebrow||''} onChange={e=>update({eyebrow:e.target.value} as Partial<Step>)}/>
          <label>Título</label>
          <textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Texto</label>
          <textarea value={step.body} onChange={e=>update({body:e.target.value} as Partial<Step>)}/>
          <label>Destaque (stat)</label>
          <textarea value={step.stat||''} onChange={e=>update({stat:e.target.value} as Partial<Step>)}/>
          <label>Fonte</label>
          <textarea value={step.source||''} onChange={e=>update({source:e.target.value} as Partial<Step>)}/>
          <small style={{color:'#8a99a8',display:'block',marginTop:10}}>Gráficos e listas de ícones desta tela seguem configurados no código.</small>
        </>}

        {step.kind==='intro' && <>
          <label>Título</label>
          <textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Texto</label>
          <textarea value={step.body} onChange={e=>update({body:e.target.value} as Partial<Step>)}/>
          <label>Botão</label>
          <textarea value={step.cta} onChange={e=>update({cta:e.target.value} as Partial<Step>)}/>
        </>}

        {step.kind==='branch' && <>
          {Object.entries(step.variants).map(([key,v])=><div key={key} style={{marginBottom:14}}>
            <label>Título ({key})</label>
            <textarea value={v.title} onChange={e=>update({variants:{...step.variants,[key]:{...v,title:e.target.value}}} as Partial<Step>)}/>
            <label>Texto ({key})</label>
            <textarea value={v.body} onChange={e=>update({variants:{...step.variants,[key]:{...v,body:e.target.value}}} as Partial<Step>)}/>
          </div>)}
        </>}

        {(step.kind==='email'||step.kind==='name'||step.kind==='processing') && <>
          <label>Título</label>
          <textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
        </>}

        {step.kind==='result' && <p className="muted">A tela de resultado é composta a partir das respostas e não tem campos de texto fixos aqui.</p>}
      </aside>
    </div>
  </>
}
