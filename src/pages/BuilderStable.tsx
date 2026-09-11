import { useEffect, useMemo, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Option, Step } from '../data/gpIa';
import { loadSteps, saveSteps } from '../lib/stepsStore';
import { fetchBuilderSteps, publishSteps, saveDraftSteps } from '../lib/surveyConfig';

const LOCAL_DRAFT_KEY = 'qf_gp_ia_builder_screen_draft_v2';
const FLOW_WIDTH_KEY = 'queroforms-builder-flow-width';
const PROPS_WIDTH_KEY = 'queroforms-builder-props-width';
const INTRO_IMAGE_RE = /\s*\[\[QF_INTRO_IMAGE:([^\]]+)\]\]\s*/;
const CONTEXT_IMAGE_RE = /\s*\[\[QF_IMAGE:([^\]]+)\]\]\s*/;
const INTRO_FALLBACK_IMAGE = 'https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png';

type NewScreenType = 'single'|'multi'|'scale'|'insight'|'email'|'name'|'processing';
type DropPosition = 'before'|'after';

const NEW_SCREEN_OPTIONS:{type:NewScreenType;icon:string;title:string;description:string}[] = [
  {type:'single',icon:'◉',title:'Pergunta — escolha única',description:'Uma resposta entre várias opções.'},
  {type:'multi',icon:'☑',title:'Pergunta — múltipla escolha',description:'Permite selecionar mais de uma opção.'},
  {type:'scale',icon:'↔',title:'Pergunta — escala',description:'Escala de 1 a 5 para medir intensidade.'},
  {type:'insight',icon:'✦',title:'Tela de contexto',description:'Título, texto, destaque, fonte e imagem.'},
  {type:'email',icon:'@',title:'Captura de e-mail',description:'Solicita o e-mail do participante.'},
  {type:'name',icon:'Aa',title:'Captura de nome',description:'Solicita o nome do participante.'},
  {type:'processing',icon:'◌',title:'Processamento',description:'Tela de transição antes do resultado.'},
];

function readPanelWidth(key:string, fallback:number){
  if(typeof window === 'undefined') return fallback;
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function loadLocalDraft():Step[]|null{
  try{
    const raw=window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)&&parsed.length ? parsed as Step[] : null;
  }catch{return null;}
}
function saveLocalDraft(steps:Step[]){window.localStorage.setItem(LOCAL_DRAFT_KEY,JSON.stringify(steps));}
function clearLocalDraft(){window.localStorage.removeItem(LOCAL_DRAFT_KEY);}
function sameSteps(a:Step[],b:Step[]){return JSON.stringify(a)===JSON.stringify(b);}

function parseMarked(raw:string,re:RegExp){
  const match=raw.match(re);
  return {text:raw.replace(re,'').trim(),imageUrl:match?.[1]?.trim()||''};
}
function composeMarked(text:string,imageUrl:string,tag:'QF_INTRO_IMAGE'|'QF_IMAGE'){
  const clean=text.trim();
  const url=imageUrl.trim();
  return url ? `${clean}${clean?'\n':''}[[${tag}:${url}]]` : clean;
}
function introData(step:Extract<Step,{kind:'intro'}>){return parseMarked(step.body,INTRO_IMAGE_RE);}
function insightSource(step:Extract<Step,{kind:'insight'}>){return parseMarked(step.source||'',CONTEXT_IMAGE_RE);}

function labelFor(s:Step){
  return s.kind==='question'?s.title
    :s.kind==='insight'?'Tela de contexto'
    :s.kind==='intro'?'Abertura'
    :s.kind==='branch'?'Resposta condicional'
    :s.kind==='processing'?'Gerando resultado'
    :s.kind==='email'?'Captura de e-mail'
    :s.kind==='name'?'Captura de nome'
    :'Resultado';
}
function canReorderStep(s:Step){return s.kind!=='intro'&&s.kind!=='branch'&&s.kind!=='result';}

function createNewStep(type:NewScreenType):Step{
  const stamp=`${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  if(type==='single') return {id:`question-${stamp}`,kind:'question',title:'Nova pergunta',input:'single',options:[{label:'Opção 1',value:`option-1-${stamp}`},{label:'Opção 2',value:`option-2-${stamp}`}]};
  if(type==='multi') return {id:`question-${stamp}`,kind:'question',title:'Nova pergunta',subtitle:'Selecione todas que se aplicam',input:'multi',options:[{label:'Opção 1',value:`option-1-${stamp}`},{label:'Opção 2',value:`option-2-${stamp}`}]};
  if(type==='scale') return {id:`question-${stamp}`,kind:'question',title:'Nova pergunta em escala',input:'scale',options:[{label:'Nada',value:'1',score:1},{label:'Pouco',value:'2',score:2},{label:'Mais ou menos',value:'3',score:3},{label:'Bastante',value:'4',score:4},{label:'Muito',value:'5',score:5}]};
  if(type==='insight') return {id:`insight-${stamp}`,kind:'insight',eyebrow:'Contexto',title:'Novo contexto',body:'Adicione aqui o texto desta tela.',visual:'sparkle'};
  if(type==='email') return {id:`email-${stamp}`,kind:'email',title:'Qual é o seu melhor e-mail?'};
  if(type==='name') return {id:`name-${stamp}`,kind:'name',title:'Como podemos te chamar?'};
  return {id:`processing-${stamp}`,kind:'processing',title:'Estamos preparando seu resultado...'};
}

function ImagePreview({src,alt}:{src:string;alt:string}){
  if(!src) return <div style={{height:170,border:'1px dashed #c9d8e5',borderRadius:14,display:'grid',placeItems:'center',color:'#8092a3',marginBottom:14}}>Nenhuma imagem configurada</div>;
  return <div style={{height:190,borderRadius:16,overflow:'hidden',background:'#eef7ff',marginBottom:16}}><img src={src} alt={alt} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></div>;
}

export default function BuilderStable(){
  const [steps,setSteps]=useState<Step[]>([]);
  const [savedDraft,setSavedDraft]=useState<Step[]>([]);
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(0);
  const [savedMsg,setSavedMsg]=useState('');
  const [publishError,setPublishError]=useState('');
  const [publishing,setPublishing]=useState(false);
  const [savingDraft,setSavingDraft]=useState(false);
  const [localDraftExists,setLocalDraftExists]=useState(false);
  const [flowWidth,setFlowWidth]=useState(()=>readPanelWidth(FLOW_WIDTH_KEY,260));
  const [propsWidth,setPropsWidth]=useState(()=>readPanelWidth(PROPS_WIDTH_KEY,380));
  const [addOpen,setAddOpen]=useState(false);
  const [draggedStepId,setDraggedStepId]=useState<string|null>(null);
  const [dropTarget,setDropTarget]=useState<{id:string;position:DropPosition}|null>(null);
  const [deleteIdx,setDeleteIdx]=useState<number|null>(null);
  const [confirmText,setConfirmText]=useState('');

  useEffect(()=>{
    let active=true;
    const local=loadLocalDraft();
    fetchBuilderSteps('gp-ia').then(remote=>{
      if(!active) return;
      const base=remote||local||loadSteps();
      if(remote){
        clearLocalDraft();
        setLocalDraftExists(false);
      }else{
        setLocalDraftExists(Boolean(local));
      }
      setSteps(base);
      setSavedDraft(base);
      setLoading(false);
    });
    return()=>{active=false;};
  },[]);

  useEffect(()=>{window.localStorage.setItem(FLOW_WIDTH_KEY,String(Math.round(flowWidth)));},[flowWidth]);
  useEffect(()=>{window.localStorage.setItem(PROPS_WIDTH_KEY,String(Math.round(propsWidth)));},[propsWidth]);

  const step=steps[sel];
  const hasUnsavedChanges=useMemo(()=>steps.length>0&&!sameSteps(steps,savedDraft),[steps,savedDraft]);
  const currentScreenSaved=useMemo(()=>{
    if(!step) return true;
    const saved=savedDraft.find(item=>item.id===step.id);
    return Boolean(saved&&JSON.stringify(saved)===JSON.stringify(step));
  },[step,savedDraft]);

  const update=(patch:Partial<Step>)=>{
    setSteps(prev=>prev.map((s,i)=>i===sel?{...s,...patch} as Step:s));
    setSavedMsg('');
    setPublishError('');
  };

  const updateOption=(optIdx:number,patch:Partial<Option>)=>{
    if(!step||step.kind!=='question') return;
    update({options:step.options.map((o,i)=>i===optIdx?{...o,...patch}:o)} as Partial<Step>);
  };
  const addOption=()=>{
    if(!step||step.kind!=='question') return;
    update({options:[...step.options,{label:'Nova opção',value:`opt-${Date.now()}`}]} as Partial<Step>);
  };
  const removeOption=(optIdx:number)=>{
    if(!step||step.kind!=='question'||step.options.length<=1) return;
    update({options:step.options.filter((_,i)=>i!==optIdx)} as Partial<Step>);
  };

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

  const startStepDrag=(s:Step,e:ReactDragEvent<HTMLSpanElement>)=>{
    if(!canReorderStep(s)){e.preventDefault();return;}
    setDraggedStepId(s.id);
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',s.id);
  };
  const dragOverStep=(s:Step,e:ReactDragEvent<HTMLDivElement>)=>{
    if(!draggedStepId||draggedStepId===s.id||s.kind==='intro'||s.kind==='branch') return;
    e.preventDefault();
    const rect=e.currentTarget.getBoundingClientRect();
    setDropTarget({id:s.id,position:s.kind==='result'||e.clientY<rect.top+rect.height/2?'before':'after'});
  };
  const dropStep=(s:Step,e:ReactDragEvent<HTMLDivElement>)=>{
    if(!draggedStepId||!dropTarget||dropTarget.id!==s.id) return;
    e.preventDefault();
    const fromIndex=steps.findIndex(item=>item.id===draggedStepId);
    if(fromIndex<0) return;
    const moving=steps[fromIndex];
    const selectedId=steps[sel]?.id;
    const without=steps.filter(item=>item.id!==draggedStepId);
    let insertAt=without.findIndex(item=>item.id===s.id);
    if(insertAt<0) return;
    if(s.kind!=='result'&&dropTarget.position==='after') insertAt+=1;
    const resultIndex=without.findIndex(item=>item.kind==='result');
    if(resultIndex>=0) insertAt=Math.min(insertAt,resultIndex);
    const next=[...without];
    next.splice(insertAt,0,moving);
    setSteps(next);
    const nextSelected=next.findIndex(item=>item.id===selectedId);
    setSel(nextSelected>=0?nextSelected:insertAt);
    setDraggedStepId(null);
    setDropTarget(null);
    setSavedMsg('Ordem alterada. Salve a edição ou publique para gravar no banco.');
  };

  const addScreen=(type:NewScreenType)=>{
    if(!step) return;
    const newStep=createNewStep(type);
    const resultIndex=steps.findIndex(s=>s.kind==='result');
    let insertAt=step.kind==='result'?sel:sel+1;
    if(resultIndex>=0) insertAt=Math.min(insertAt,resultIndex);
    const next=[...steps.slice(0,insertAt),newStep,...steps.slice(insertAt)];
    setSteps(next);
    setSel(insertAt);
    setAddOpen(false);
    setSavedMsg('Nova tela criada. Salve a edição ou publique para gravar no banco.');
  };

  const saveCurrentScreen=async()=>{
    if(!step||savingDraft) return;
    const savedById=new Map(savedDraft.map(item=>[item.id,item]));
    const nextDraft=steps.map(item=>item.id===step.id?item:(savedById.get(item.id)||item));
    setSavingDraft(true);
    setPublishError('');
    try{
      await saveDraftSteps('gp-ia',nextDraft);
      setSavedDraft(nextDraft);
      saveLocalDraft(nextDraft);
      setLocalDraftExists(true);
      setSavedMsg(`Tela ${sel+1} salva no banco como rascunho ✓`);
    }catch{
      saveLocalDraft(nextDraft);
      setLocalDraftExists(true);
      setPublishError('Não consegui salvar este rascunho no Supabase. Mantive uma cópia local para não perder a edição.');
    }finally{
      setSavingDraft(false);
      window.setTimeout(()=>setSavedMsg(''),3500);
    }
  };

  const publish=async()=>{
    if(!steps.length||publishing) return;
    setPublishing(true);
    setPublishError('');
    try{
      await publishSteps('gp-ia',steps);
      setSavedDraft(steps);
      saveSteps(steps);
      clearLocalDraft();
      setLocalDraftExists(false);
      setSavedMsg('Publicado no Supabase ✓ página pública atualizada');
    }catch{
      saveLocalDraft(steps);
      setLocalDraftExists(true);
      setPublishError('Não consegui publicar no Supabase. Mantive uma cópia local das alterações.');
    }finally{
      setPublishing(false);
      window.setTimeout(()=>setSavedMsg(''),4000);
    }
  };

  const confirmDelete=()=>{
    if(deleteIdx===null||confirmText!=='EXCLUIR') return;
    const next=steps.filter((_,i)=>i!==deleteIdx);
    setSteps(next);
    setSel(Math.max(0,Math.min(sel>deleteIdx?sel-1:sel,next.length-1)));
    setDeleteIdx(null);
    setConfirmText('');
    setSavedMsg('Tela removida. Salve a edição ou publique para gravar no banco.');
  };

  if(loading) return <p className="muted">Carregando rascunho do Supabase...</p>;
  if(!step) return <p className="muted">Não foi possível carregar o formulário.</p>;

  const intro=step.kind==='intro'?introData(step):null;
  const insight=step.kind==='insight'?insightSource(step):null;

  return <>
    <header className="page-head">
      <div><div className="crumb">Diagnósticos › GP com IA</div><h1>Editor do diagnóstico</h1></div>
      <div className="head-actions">
        {hasUnsavedChanges&&<span className="save-error" style={{alignSelf:'center',marginRight:8,padding:'6px 10px'}}>Alterações não salvas</span>}
        {!hasUnsavedChanges&&localDraftExists&&<span className="conn ok" style={{alignSelf:'center',marginRight:8}}>Rascunho salvo no banco ✓</span>}
        {savedMsg&&<span className="conn ok" style={{alignSelf:'center',marginRight:8}}>{savedMsg}</span>}
        {publishError&&<span className="save-error" style={{alignSelf:'center',marginRight:8,padding:'6px 10px'}}>{publishError}</span>}
        <a className="btn" href="/d/gp-ia" target="_blank" rel="noreferrer">Pré-visualizar</a>
        <button className="btn dark" onClick={publish} disabled={publishing}>{publishing?'Publicando...':'Publicar'}</button>
      </div>
    </header>

    <p className="muted" style={{margin:'-10px 0 18px'}}>Salvar edição grava o rascunho no Supabase sem alterar a página pública. <b>Publicar</b> grava todas as alterações atuais e atualiza a versão pública.</p>

    <div className="builder-grid" style={{gridTemplateColumns:`${flowWidth}px 12px minmax(300px,1fr) 12px ${propsWidth}px`}}>
      <section className="steps-panel">
        <div className="steps-title">Fluxo <span>{steps.length} telas</span></div>
        <div className="steps-list">
          {steps.map((s,i)=>{
            const reorderable=canReorderStep(s);
            const dropClass=dropTarget?.id===s.id?`builder-step-drop-${dropTarget.position}`:'';
            return <div key={s.id} className={`step-item ${i===sel?'active':''} ${draggedStepId===s.id?'builder-step-dragging':''} ${dropClass}`} onDragOver={e=>dragOverStep(s,e)} onDrop={e=>dropStep(s,e)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              <span className={`builder-step-handle ${reorderable?'':'locked'}`} draggable={reorderable} onDragStart={e=>startStepDrag(s,e)} onDragEnd={()=>{setDraggedStepId(null);setDropTarget(null);}} onClick={e=>e.stopPropagation()} title={reorderable?'Arraste para mudar a ordem':'Esta tela tem posição protegida'}><GripVertical size={16}/></span>
              <span onClick={()=>setSel(i)} style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                <span className="step-num">{i+1}</span>
                <div style={{minWidth:0}}><b>{labelFor(s)}</b><small>{s.kind}</small></div>
              </span>
              <button className="btn" title="Excluir esta tela" onClick={e=>{e.stopPropagation();setDeleteIdx(i);setConfirmText('');}} style={{padding:'6px 10px',color:'#a93434',borderColor:'#f0d4d4'}}><Trash2 size={16}/></button>
            </div>;
          })}
        </div>
        <div className="builder-add-screen-wrap">
          <button className="btn builder-add-screen" onClick={()=>setAddOpen(true)}><Plus size={16}/> Adicionar tela</button>
          <small>Arraste pelo ícone ⋮⋮ para reordenar. Salve como rascunho ou publique diretamente.</small>
        </div>
      </section>

      <div className="panel-resizer" role="separator" onPointerDown={e=>startResize('flow',e)}><span/></div>

      <section className="builder-canvas">
        <div className="canvas-phone">
          <div className="mini-progress"><span style={{width:`${Math.round(((sel+1)/steps.length)*100)}%`}}/></div>
          <div className="canvas-inner">
            {step.kind==='question'&&<><h2>{step.title}</h2>{step.subtitle&&<p style={{textAlign:'center',color:'#7a8b9c',marginTop:-8}}>{step.subtitle}</p>}{step.options.map(o=><div className="option-card" key={o.value}>{o.emoji?`${o.emoji} `:''}{o.label}</div>)}</>}
            {step.kind==='insight'&&<>{insight?.imageUrl&&<ImagePreview src={insight.imageUrl} alt="Imagem da tela de contexto"/>}<h2>{step.title}</h2><p style={{textAlign:'center',color:'#7a8b9c'}}>{step.body}</p>{step.stat&&<div className="option-card"><b>{step.stat}</b></div>}</>}
            {step.kind==='intro'&&intro&&<div className="builder-intro-preview"><div className="builder-certificate-image-wrap"><img src={intro.imageUrl||INTRO_FALLBACK_IMAGE} alt="Imagem da tela inicial"/></div><h2>{step.title}</h2><p className="builder-intro-question">{intro.text}</p><div className="builder-intro-choices"><div>Sim <span>→</span></div><div>Não <span>→</span></div></div></div>}
            {step.kind==='branch'&&<><h2>{Object.values(step.variants)[0]?.title}</h2><p style={{textAlign:'center',color:'#7a8b9c'}}>Varia conforme a resposta anterior</p></>}
            {(step.kind==='email'||step.kind==='name'||step.kind==='processing')&&<h2>{step.title}</h2>}
            {step.kind==='result'&&<p style={{textAlign:'center',color:'#7a8b9c'}}>Tela de resultado composta a partir das respostas.</p>}
          </div>
        </div>
      </section>

      <div className="panel-resizer" role="separator" onPointerDown={e=>startResize('props',e)}><span/></div>

      <aside className="props-panel">
        <h3>Propriedades</h3>

        {step.kind==='question'&&<>
          <label>Título</label><textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Subtítulo</label><textarea value={step.subtitle||''} onChange={e=>update({subtitle:e.target.value} as Partial<Step>)}/>
          <label>Tipo</label><select value={step.input} onChange={e=>update({input:e.target.value as 'single'|'multi'|'scale'} as Partial<Step>)}><option value="single">Escolha única</option><option value="multi">Múltipla escolha</option><option value="scale">Escala</option></select>
          <label>Opções</label>
          {step.options.map((o,i)=><div key={`${o.value}-${i}`} style={{display:'flex',gap:6,marginBottom:6}}><input style={{width:42}} value={o.emoji||''} placeholder="🙂" onChange={e=>updateOption(i,{emoji:e.target.value})}/><input style={{flex:1}} value={o.label} onChange={e=>updateOption(i,{label:e.target.value})}/><button className="btn" onClick={()=>removeOption(i)} title="Remover opção">✕</button></div>)}
          <button className="btn" onClick={addOption}>+ Adicionar opção</button>
        </>}

        {step.kind==='insight'&&insight&&<>
          <label>Categoria (eyebrow)</label><textarea value={step.eyebrow||''} onChange={e=>update({eyebrow:e.target.value} as Partial<Step>)}/>
          <label>Título</label><textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Texto</label><textarea value={step.body} onChange={e=>update({body:e.target.value} as Partial<Step>)}/>
          <label>Destaque (stat)</label><textarea value={step.stat||''} onChange={e=>update({stat:e.target.value} as Partial<Step>)}/>
          <label>URL da imagem</label><input type="url" value={insight.imageUrl} placeholder="https://.../imagem.webp" onChange={e=>update({source:composeMarked(insight.text,e.target.value,'QF_IMAGE')} as Partial<Step>)}/>
          <ImagePreview src={insight.imageUrl} alt="Prévia da imagem da tela de contexto"/>
          <label>Fonte</label><textarea value={insight.text} onChange={e=>update({source:composeMarked(e.target.value,insight.imageUrl,'QF_IMAGE')} as Partial<Step>)}/>
        </>}

        {step.kind==='intro'&&intro&&<>
          <label>Título</label><textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/>
          <label>Pergunta</label><textarea value={intro.text} onChange={e=>update({body:composeMarked(e.target.value,intro.imageUrl,'QF_INTRO_IMAGE')} as Partial<Step>)}/>
          <label>URL da imagem da Tela 1</label><input type="url" value={intro.imageUrl} placeholder="https://.../certificado.webp" onChange={e=>update({body:composeMarked(intro.text,e.target.value,'QF_INTRO_IMAGE')} as Partial<Step>)}/>
          <ImagePreview src={intro.imageUrl||INTRO_FALLBACK_IMAGE} alt="Prévia da imagem da Tela 1"/>
        </>}

        {step.kind==='branch'&&<>{Object.entries(step.variants).map(([key,v])=><div key={key} style={{marginBottom:14}}><label>Título ({key})</label><textarea value={v.title} onChange={e=>update({variants:{...step.variants,[key]:{...v,title:e.target.value}}} as Partial<Step>)}/><label>Texto ({key})</label><textarea value={v.body} onChange={e=>update({variants:{...step.variants,[key]:{...v,body:e.target.value}}} as Partial<Step>)}/></div>)}</>}

        {(step.kind==='email'||step.kind==='name'||step.kind==='processing')&&<><label>Título</label><textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/></>}
        {step.kind==='result'&&<p className="muted">A tela de resultado é composta a partir das respostas.</p>}

        {step.kind!=='result'&&<div style={{marginTop:20,paddingTop:16,borderTop:'1px solid #e3eaf0'}}>
          <button className="btn dark" disabled={savingDraft} onClick={saveCurrentScreen} style={{width:'100%',justifyContent:'center'}}>{savingDraft?'Salvando no banco...':`Salvar edição desta tela${currentScreenSaved?'':' *'}`}</button>
          <small style={{display:'block',marginTop:8,color:currentScreenSaved?'#72859a':'#a35f16',lineHeight:1.4}}>{currentScreenSaved?'Esta tela está igual ao rascunho salvo no Supabase.':'Esta tela tem alterações ainda não salvas no Supabase.'}</small>
        </div>}
      </aside>
    </div>

    <div className="builder-resize-hint">↔ Arraste as divisórias entre os painéis para ajustar os tamanhos.</div>

    {addOpen&&<div className="builder-add-overlay" onClick={()=>setAddOpen(false)}><div className="builder-add-modal" onClick={e=>e.stopPropagation()}><div className="builder-add-modal-head"><div><small>Nova tela</small><h3>O que você quer adicionar?</h3></div><button className="btn" onClick={()=>setAddOpen(false)}>✕</button></div><p className="muted">A nova tela será inserida depois de <b>{sel+1}. {labelFor(step)}</b>.</p><div className="builder-screen-types">{NEW_SCREEN_OPTIONS.map(item=><button key={item.type} className="builder-screen-type" onClick={()=>addScreen(item.type)}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.description}</small></div></button>)}</div></div></div>}

    {deleteIdx!==null&&<div style={{position:'fixed',inset:0,background:'rgba(15,30,50,.45)',display:'grid',placeItems:'center',zIndex:90}} onClick={()=>setDeleteIdx(null)}><div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:28,width:380,display:'flex',flexDirection:'column',gap:12}}><h3 style={{margin:0}}>Excluir esta tela?</h3><p className="muted" style={{margin:0}}>Digite <b>EXCLUIR</b> para confirmar.</p><input autoFocus value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="EXCLUIR" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/><div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button className="btn" onClick={()=>setDeleteIdx(null)}>Cancelar</button><button className="btn dark" disabled={confirmText!=='EXCLUIR'} onClick={confirmDelete}>Excluir tela</button></div></div></div>}
  </>;
}
