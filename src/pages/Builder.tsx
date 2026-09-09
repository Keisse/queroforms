import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Option, Step } from '../data/gpIa';
import { loadSteps, saveSteps, resetSteps, hasCustomSteps } from '../lib/stepsStore';
import { fetchPublishedSteps, publishSteps } from '../lib/surveyConfig';

const INTRO_TITLE = 'Se torne um mestre do cloud certificado.';
const INTRO_QUESTION = 'Você já usa o cloud?';
const LEGACY_INTRO_TITLE = 'Descubra seu nível de maturidade em IA na Gestão de Projetos';
const FLOW_WIDTH_KEY='queroforms-builder-flow-width';
const PROPS_WIDTH_KEY='queroforms-builder-props-width';

function readPanelWidth(key:string, fallback:number){
  if(typeof window==='undefined') return fallback;
  const value=Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value>0 ? value : fallback;
}

function normalizeIntro(items: Step[]){
  return items.map(s=>s.kind==='intro' && s.id==='intro'
    ? {...s,title:s.title===LEGACY_INTRO_TITLE?INTRO_TITLE:s.title,body:s.body.startsWith('Em poucos minutos')?INTRO_QUESTION:s.body}
    : s);
}

function introHeading(title:string){
  const marker='cloud certificado.';
  const pos=title.toLowerCase().indexOf(marker);
  if(pos<0) return title;
  return <>{title.slice(0,pos)}<span style={{color:'#1479d0'}}>{title.slice(pos)}</span></>;
}

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
  const [steps,setSteps]=useState<Step[]>(()=>normalizeIntro(loadSteps()));
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(0);
  const [savedMsg,setSavedMsg]=useState('');
  const [publishError,setPublishError]=useState('');
  const [publishing,setPublishing]=useState(false);
  const [customized,setCustomized]=useState(hasCustomSteps());
  const [flowWidth,setFlowWidth]=useState(()=>readPanelWidth(FLOW_WIDTH_KEY,260));
  const [propsWidth,setPropsWidth]=useState(()=>readPanelWidth(PROPS_WIDTH_KEY,380));
  const step=steps[sel];

  useEffect(()=>{
    let active=true;
    fetchPublishedSteps('gp-ia').then(remote=>{
      if(!active) return;
      if(remote) setSteps(normalizeIntro(remote));
      setLoading(false);
    });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{ window.localStorage.setItem(FLOW_WIDTH_KEY,String(Math.round(flowWidth))); },[flowWidth]);
  useEffect(()=>{ window.localStorage.setItem(PROPS_WIDTH_KEY,String(Math.round(propsWidth))); },[propsWidth]);

  const startResize=(side:'flow'|'props',e:ReactPointerEvent<HTMLDivElement>)=>{
    if(window.innerWidth<=1080) return;
    e.preventDefault();
    const startX=e.clientX;
    const initialFlow=flowWidth;
    const initialProps=propsWidth;
    document.body.classList.add('builder-resizing');

    const onMove=(ev:PointerEvent)=>{
      const delta=ev.clientX-startX;
      if(side==='flow') setFlowWidth(Math.max(210,Math.min(520,initialFlow+delta)));
      else setPropsWidth(Math.max(260,Math.min(560,initialProps-delta)));
    };
    const onUp=()=>{
      document.body.classList.remove('builder-resizing');
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('pointerup',onUp);
    };
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp,{once:true});
  };

  const resetPanelWidths=()=>{
    setFlowWidth(260);
    setPropsWidth(380);
  };

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
  const publish=async()=>{
    setPublishing(true); setPublishError('');
    try{
      await publishSteps('gp-ia', steps);
      saveSteps(steps);
      setCustomized(true);
      setSavedMsg('Publicado ✓ já vale para todo mundo');
    }catch{
      setPublishError('Não consegui publicar agora. As alterações continuam salvas neste navegador.');
      saveSteps(steps);
    }finally{
      setPublishing(false);
      setTimeout(()=>{setSavedMsg('');setPublishError('');},3500);
    }
  };
  const restore=()=>{
    resetSteps();
    const defaults=normalizeIntro(loadSteps());
    setSteps(defaults);
    setSel(0);
    setCustomized(false);
    setSavedMsg('Restaurado ao padrão (lembre de clicar em Publicar)');
    setTimeout(()=>setSavedMsg(''),3500);
  };

  const [deleteIdx,setDeleteIdx]=useState<number|null>(null);
  const [confirmText,setConfirmText]=useState('');

  const requestDelete=(i:number)=>{ setDeleteIdx(i); setConfirmText(''); };
  const cancelDelete=()=>{ setDeleteIdx(null); setConfirmText(''); };
  const confirmDelete=()=>{
    if(deleteIdx===null || confirmText!=='EXCLUIR') return;
    setSteps(prev=>prev.filter((_,i)=>i!==deleteIdx));
    setSel(prev=>{
      if(deleteIdx===null) return prev;
      if(prev>deleteIdx) return prev-1;
      if(prev===deleteIdx) return Math.max(0,deleteIdx-1);
      return prev;
    });
    setDeleteIdx(null);
    setConfirmText('');
  };

  if(loading) return <p className="muted">Carregando perguntas publicadas...</p>;

  return <>
    <header className="page-head">
      <div><div className="crumb">Diagnósticos › GP com IA</div><h1>Editor do diagnóstico</h1></div>
      <div className="head-actions">
        {savedMsg && <span className="conn ok" style={{alignSelf:'center',marginRight:8}}>{savedMsg}</span>}
        {publishError && <span className="save-error" style={{alignSelf:'center',marginRight:8,padding:'6px 10px'}}>{publishError}</span>}
        <button className="btn" onClick={resetPanelWidths} title="Volta as colunas ao tamanho inicial">Redefinir colunas</button>
        <a className="btn" href="/d/gp-ia" target="_blank" rel="noreferrer">Pré-visualizar</a>
        <button className="btn" onClick={restore} title="Volta às perguntas originais do código">Restaurar padrão</button>
        <button className="btn dark" onClick={publish} disabled={publishing}>{publishing?'Publicando...':'Publicar'}</button>
      </div>
    </header>
    {customized && <p className="muted" style={{margin:'-10px 0 18px'}}>Publicado: quem acessar o link do diagnóstico, em qualquer dispositivo, já vê essa versão.</p>}
    <div className="builder-grid" style={{gridTemplateColumns:`${flowWidth}px 12px minmax(300px,1fr) 12px ${propsWidth}px`}}>
      <section className="steps-panel">
        <div className="steps-title">Fluxo <span>{steps.length} telas</span></div>
        {steps.map((s,i)=><div className={`step-item ${i===sel?'active':''}`} key={s.id} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
          <span onClick={()=>setSel(i)} style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
            <span className="step-num">{i+1}</span>
            <div><b>{labelFor(s)}</b><small>{s.kind}</small></div>
          </span>
          <button className="btn" title="Excluir esta tela" onClick={e=>{e.stopPropagation();requestDelete(i);}} style={{padding:'6px 10px',color:'#a93434',borderColor:'#f0d4d4'}}><Trash2 size={16}/></button>
        </div>)}
      </section>

      <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label="Redimensionar painel de fluxo" title="Arraste para ajustar o tamanho" onPointerDown={e=>startResize('flow',e)}><span/></div>

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
            {step.kind==='intro' && <div className="builder-intro-preview">
              <div className="builder-certificate-image-wrap">
                <img src="https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png" alt="Certificado Gestão de Projetos com IA - Formação Mestre GP" />
              </div>
              <h2>{introHeading(step.title)}</h2>
              <p className="builder-intro-question">{step.body}</p>
              <div className="builder-intro-choices"><div>Sim <span>→</span></div><div>Não <span>→</span></div></div>
            </div>}
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

      <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label="Redimensionar painel de propriedades" title="Arraste para ajustar o tamanho" onPointerDown={e=>startResize('props',e)}><span/></div>

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
          <label>Pergunta</label>
          <textarea value={step.body} onChange={e=>update({body:e.target.value} as Partial<Step>)}/>
          <small style={{color:'#8a99a8',display:'block',marginTop:10}}>A imagem do certificado e os botões Sim/Não seguem o layout visual da abertura.</small>
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

    <div className="builder-resize-hint">↔ Arraste as divisórias entre os painéis para ajustar os tamanhos. Sua preferência fica salva neste navegador.</div>

    {deleteIdx!==null && <div style={{position:'fixed',inset:0,background:'rgba(15,30,50,.45)',display:'grid',placeItems:'center',zIndex:50}} onClick={cancelDelete}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:28,width:380,display:'flex',flexDirection:'column',gap:12}}>
        <h3 style={{margin:0}}>Excluir esta tela?</h3>
        <p className="muted" style={{margin:0}}>Você está prestes a excluir "<b>{labelFor(steps[deleteIdx])}</b>". Essa ação não pode ser desfeita depois de publicar. Digite <b>EXCLUIR</b> para confirmar.</p>
        <input autoFocus value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="EXCLUIR" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn" onClick={cancelDelete}>Cancelar</button>
          <button className="btn dark" disabled={confirmText!=='EXCLUIR'} onClick={confirmDelete} style={confirmText!=='EXCLUIR'?{opacity:.5,cursor:'not-allowed'}:{background:'#c0392b',borderColor:'#c0392b'}}>Excluir tela</button>
        </div>
      </div>
    </div>}
  </>
}
