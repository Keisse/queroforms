import { useEffect, useMemo, useState, type ChangeEvent as ReactChangeEvent, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Option, Step } from '../data/gpIa';
import { loadSteps, saveSteps } from '../lib/stepsStore';
import { fetchBuilderSnapshot, publishSteps } from '../lib/surveyConfig';
import { isProtectedStructuralStep, validateSurveyStructure } from '../lib/surveyValidator';
import { supabase } from '../lib/supabase';

function draftSlug(slug:string){ return slug.replace(/[^a-z0-9_-]/gi,'_'); }
function localDraftKey(slug:string){ return slug==='gp-ia' ? 'qf_gp_ia_builder_screen_draft_v4' : `qf_${draftSlug(slug)}_builder_screen_draft_v4`; }
function legacyLocalDraftKey(slug:string){ return slug==='gp-ia' ? 'qf_gp_ia_builder_screen_draft_v3' : `qf_${draftSlug(slug)}_builder_screen_draft_v3`; }
const FLOW_WIDTH_KEY = 'queroforms-builder-flow-width';
const PROPS_WIDTH_KEY = 'queroforms-builder-props-width';
const INTRO_IMAGE_RE = /\s*\[\[QF_INTRO_IMAGE:([^\]]+)\]\]\s*/;
const CONTEXT_IMAGE_RE = /\s*\[\[QF_IMAGE:([^\]]+)\]\]\s*/;
const CONTEXT_HIDE_IMAGE_RE = /\s*\[\[QF_HIDE_IMAGE\]\]\s*/;
const INTRO_FALLBACK_IMAGE = 'https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png';

type NewScreenType = 'single'|'multi'|'scale'|'insight'|'email'|'name'|'processing';
type DropPosition = 'before'|'after';
type LocalDraft = {steps:Step[];baseVersion:number;savedAt:string;revision:number};

const NEW_SCREEN_OPTIONS:{type:NewScreenType;icon:string;title:string;description:string}[] = [
  {type:'single',icon:'◉',title:'Pergunta — escolha única',description:'Uma resposta entre várias opções.'},
  {type:'multi',icon:'☑',title:'Pergunta — múltipla escolha',description:'Permite selecionar mais de uma opção.'},
  {type:'scale',icon:'↔',title:'Pergunta — escala',description:'Escala de intensidade com pontuação explícita.'},
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

function readCurrentDraftRaw(surveySlug:string):Partial<LocalDraft>|null{
  try{
    const raw=window.localStorage.getItem(localDraftKey(surveySlug));
    return raw?JSON.parse(raw) as Partial<LocalDraft>:null;
  }catch{return null;}
}

function currentLocalRevision(surveySlug:string){
  const draft=readCurrentDraftRaw(surveySlug);
  return Number(draft?.revision)||0;
}

function readLocalDraft(surveySlug:string):LocalDraft|null{
  try{
    const parsed=readCurrentDraftRaw(surveySlug);
    if(parsed&&Array.isArray(parsed.steps)&&parsed.steps.length){
      return {
        steps:parsed.steps as Step[],
        baseVersion:Number(parsed.baseVersion)||0,
        savedAt:String(parsed.savedAt||''),
        revision:Number(parsed.revision)||0,
      };
    }
    const legacyRaw=window.localStorage.getItem(legacyLocalDraftKey(surveySlug));
    if(!legacyRaw) return null;
    const legacy=JSON.parse(legacyRaw);
    return Array.isArray(legacy)&&legacy.length ? {steps:legacy as Step[],baseVersion:0,savedAt:'',revision:0} : null;
  }catch{return null;}
}
function saveLocalDraft(surveySlug:string,steps:Step[],baseVersion:number,expectedRevision?:number){
  const currentRevision=currentLocalRevision(surveySlug);
  if(expectedRevision!==undefined&&currentRevision!==expectedRevision){
    throw new Error('LOCAL_DRAFT_CONFLICT');
  }
  const revision=currentRevision+1;
  const draft:LocalDraft={steps,baseVersion,savedAt:new Date().toISOString(),revision};
  window.localStorage.setItem(localDraftKey(surveySlug),JSON.stringify(draft));
  window.localStorage.removeItem(legacyLocalDraftKey(surveySlug));
  return revision;
}
function clearLocalDraft(surveySlug:string,expectedRevision?:number){
  if(expectedRevision!==undefined&&currentLocalRevision(surveySlug)!==expectedRevision) return false;
  window.localStorage.removeItem(localDraftKey(surveySlug));
  window.localStorage.removeItem(legacyLocalDraftKey(surveySlug));
  return true;
}
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
function insightSource(step:Extract<Step,{kind:'insight'}>){
  const source=step.source||'';
  const marked=parseMarked(source,CONTEXT_IMAGE_RE);
  const hideImage=CONTEXT_HIDE_IMAGE_RE.test(source);
  return {text:marked.text.replace(CONTEXT_HIDE_IMAGE_RE,'').trim(),imageUrl:marked.imageUrl,hideImage};
}
function composeInsightSource(text:string,imageUrl:string,hideImage:boolean){
  const marked=composeMarked(text,imageUrl,'QF_IMAGE');
  return hideImage ? `${marked}${marked?'\n':''}[[QF_HIDE_IMAGE]]` : marked;
}

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
function canReorderStep(s:Step){return !isProtectedStructuralStep(s);}
function canDuplicateStep(s:Step){return !isProtectedStructuralStep(s);}

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

function cloneEditableStep(step:Step):Step{
  const stamp=`${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const clone=JSON.parse(JSON.stringify(step)) as Step;
  clone.id=`${step.kind}-${stamp}`;
  return clone;
}

function ImagePreview({src,alt}:{src:string;alt:string}){
  if(!src) return <div style={{height:170,border:'1px dashed #c9d8e5',borderRadius:14,display:'grid',placeItems:'center',color:'#8092a3',marginBottom:14}}>Nenhuma imagem configurada</div>;
  return <div style={{height:190,borderRadius:16,overflow:'hidden',background:'#eef7ff',marginBottom:16}}><img src={src} alt={alt} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></div>;
}

export default function BuilderStable({surveySlug='gp-ia'}:{surveySlug?:string}){
  const [steps,setSteps]=useState<Step[]>([]);
  const [savedDraft,setSavedDraft]=useState<Step[]>([]);
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(0);
  const [savedMsg,setSavedMsg]=useState('');
  const [publishError,setPublishError]=useState('');
  const [publishing,setPublishing]=useState(false);
  const [localDraftExists,setLocalDraftExists]=useState(false);
  const [localRevision,setLocalRevision]=useState(0);
  const [localDraftConflict,setLocalDraftConflict]=useState(false);
  const [baseVersion,setBaseVersion]=useState(1);
  const [versionConflict,setVersionConflict]=useState(false);
  const [flowWidth,setFlowWidth]=useState(()=>readPanelWidth(FLOW_WIDTH_KEY,260));
  const [propsWidth,setPropsWidth]=useState(()=>readPanelWidth(PROPS_WIDTH_KEY,380));
  const [addOpen,setAddOpen]=useState(false);
  const [draggedStepId,setDraggedStepId]=useState<string|null>(null);
  const [dropTarget,setDropTarget]=useState<{id:string;position:DropPosition}|null>(null);
  const [deleteIdx,setDeleteIdx]=useState<number|null>(null);
  const [confirmText,setConfirmText]=useState('');
  const [imageUploading,setImageUploading]=useState(false);
  const [imageUploadError,setImageUploadError]=useState('');

  useEffect(()=>{
    let active=true;
    const local=readLocalDraft(surveySlug);
    fetchBuilderSnapshot(surveySlug).then(remote=>{
      if(!active) return;
      setLocalRevision(local?.revision||0);
      if(!remote){
        const fallback=local?.steps||loadSteps();
        setSteps(fallback);
        setSavedDraft(fallback);
        setLocalDraftExists(Boolean(local));
        setBaseVersion(local?.baseVersion||1);
        setPublishError('Não foi possível confirmar a versão publicada no Supabase. A publicação ficará bloqueada até a conexão voltar.');
        setVersionConflict(true);
        setLoading(false);
        return;
      }

      if(local){
        const legacyMatchesRemote=local.baseVersion===0&&sameSteps(local.steps,remote.steps);
        const compatible=local.baseVersion===remote.version||legacyMatchesRemote;
        if(compatible){
          const normalizedVersion=remote.version;
          setSteps(local.steps);
          setSavedDraft(local.steps);
          setLocalDraftExists(true);
          setBaseVersion(normalizedVersion);
          if(local.baseVersion!==normalizedVersion){
            try{
              const revision=saveLocalDraft(surveySlug,local.steps,normalizedVersion,local.revision);
              setLocalRevision(revision);
            }catch{
              setLocalDraftConflict(true);
              setPublishError('Outra aba alterou este rascunho durante o carregamento. Recarregue o Builder para usar a versão local mais recente.');
            }
          }
        }else{
          setSteps(local.steps);
          setSavedDraft(local.steps);
          setLocalDraftExists(true);
          setBaseVersion(local.baseVersion);
          setVersionConflict(true);
          setPublishError(`Este navegador possui um rascunho baseado na versão ${local.baseVersion||'antiga'}, mas o Supabase já está na versão ${remote.version}. Nada será sobrescrito automaticamente.`);
        }
      }else{
        setSteps(remote.steps);
        setSavedDraft(remote.steps);
        setBaseVersion(remote.version);
      }
      setLoading(false);
    });
    return()=>{active=false;};
  },[surveySlug]);

  useEffect(()=>{window.localStorage.setItem(FLOW_WIDTH_KEY,String(Math.round(flowWidth)));},[flowWidth]);
  useEffect(()=>{window.localStorage.setItem(PROPS_WIDTH_KEY,String(Math.round(propsWidth)));},[propsWidth]);

  const step=steps[sel];
  const hasUnsavedChanges=useMemo(()=>steps.length>0&&!sameSteps(steps,savedDraft),[steps,savedDraft]);
  const currentScreenSaved=useMemo(()=>{
    if(!step) return true;
    const saved=savedDraft.find(item=>item.id===step.id);
    return Boolean(saved&&JSON.stringify(saved)===JSON.stringify(step));
  },[step,savedDraft]);

  useEffect(()=>{
    if(!hasUnsavedChanges) return;
    const handler=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue='';
    };
    window.addEventListener('beforeunload',handler);
    return()=>window.removeEventListener('beforeunload',handler);
  },[hasUnsavedChanges]);

  useEffect(()=>{
    const handler=(event:StorageEvent)=>{
      if(event.key!==localDraftKey(surveySlug)) return;
      if(currentLocalRevision(surveySlug)===localRevision) return;
      setLocalDraftConflict(true);
      setPublishError('Outra aba alterou o rascunho deste diagnóstico. Para evitar sobrescrita, salvar e publicar foram bloqueados nesta aba.');
    };
    window.addEventListener('storage',handler);
    return()=>window.removeEventListener('storage',handler);
  },[localRevision,surveySlug]);

  const warnUnsavedScreen=()=>{
    setSavedMsg('');
    setPublishError('Salve a edição desta tela antes de mudar de tela ou alterar a estrutura do diagnóstico.');
  };

  const requestSelect=(index:number)=>{
    if(index===sel) return;
    if(imageUploading){setPublishError('Aguarde o envio da imagem antes de mudar de tela.');return;}
    if(!currentScreenSaved){warnUnsavedScreen();return;}
    if(!versionConflict&&!localDraftConflict) setPublishError('');
    setSel(index);
  };

  const update=(patch:Partial<Step>)=>{
    setSteps(prev=>prev.map((s,i)=>i===sel?{...s,...patch} as Step:s));
    setSavedMsg('');
    if(!versionConflict&&!localDraftConflict) setPublishError('');
  };

  const updateOption=(optIdx:number,patch:Partial<Option>)=>{
    if(!step||step.kind!=='question') return;
    update({options:step.options.map((o,i)=>i===optIdx?{...o,...patch}:o)} as Partial<Step>);
  };
  const addOption=()=>{
    if(!step||step.kind!=='question') return;
    const existingScores=step.options.map(option=>option.score).filter((score):score is number=>typeof score==='number'&&Number.isFinite(score));
    const nextScore=step.input==='scale'||existingScores.length ? (existingScores.length?Math.max(...existingScores)+1:step.options.length+1) : undefined;
    update({options:[...step.options,{label:'Nova opção',value:`opt-${Date.now()}`,score:nextScore}]} as Partial<Step>);
  };
  const removeOption=(optIdx:number)=>{
    if(!step||step.kind!=='question'||step.options.length<=2) return;
    update({options:step.options.filter((_,i)=>i!==optIdx)} as Partial<Step>);
  };
  const toggleScoring=()=>{
    if(!step||step.kind!=='question'||step.input!=='single') return;
    const hasScores=step.options.some(option=>typeof option.score==='number');
    update({options:step.options.map((option,index)=>hasScores?{...option,score:undefined}:{...option,score:index})} as Partial<Step>);
  };
  const changeQuestionType=(input:'single'|'multi'|'scale')=>{
    if(!step||step.kind!=='question') return;
    if(input==='scale'){
      update({input,options:step.options.map((option,index)=>({...option,score:typeof option.score==='number'?option.score:index+1}))} as Partial<Step>);
      return;
    }
    update({input} as Partial<Step>);
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
      window.removeEventListener('pointercancel',onUp);
    };
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp,{once:true});
    window.addEventListener('pointercancel',onUp,{once:true});
  };

  const startStepDrag=(s:Step,e:ReactDragEvent<HTMLSpanElement>)=>{
    if(!currentScreenSaved){
      e.preventDefault();
      warnUnsavedScreen();
      return;
    }
    if(localDraftConflict){e.preventDefault();return;}
    if(!canReorderStep(s)){e.preventDefault();return;}
    setDraggedStepId(s.id);
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',s.id);
  };
  const dragOverStep=(s:Step,e:ReactDragEvent<HTMLDivElement>)=>{
    if(!draggedStepId||draggedStepId===s.id||isProtectedStructuralStep(s)) return;
    e.preventDefault();
    const rect=e.currentTarget.getBoundingClientRect();
    setDropTarget({id:s.id,position:e.clientY<rect.top+rect.height/2?'before':'after'});
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
    if(dropTarget.position==='after') insertAt+=1;
    const resultIndex=without.findIndex(item=>item.kind==='result');
    if(resultIndex>=0) insertAt=Math.min(insertAt,resultIndex);
    const next=[...without];
    next.splice(insertAt,0,moving);
    setSteps(next);
    const nextSelected=next.findIndex(item=>item.id===selectedId);
    setSel(nextSelected>=0?nextSelected:insertAt);
    setDraggedStepId(null);
    setDropTarget(null);
    setSavedMsg('Ordem alterada. Clique em Salvar edição desta tela antes de publicar.');
  };

  const addScreen=(type:NewScreenType)=>{
    if(!step) return;
    if(localDraftConflict){setAddOpen(false);return;}
    if(!currentScreenSaved){setAddOpen(false);warnUnsavedScreen();return;}
    if((type==='email'||type==='name'||type==='processing')&&steps.some(item=>item.kind===type)){
      setAddOpen(false);
      setPublishError(`Já existe uma tela estrutural do tipo ${type}. Edite a existente em vez de criar outra.`);
      return;
    }
    const newStep=createNewStep(type);
    const resultIndex=steps.findIndex(s=>s.kind==='result');
    let insertAt=step.kind==='result'?sel:sel+1;
    if(resultIndex>=0) insertAt=Math.min(insertAt,resultIndex);
    const next=[...steps.slice(0,insertAt),newStep,...steps.slice(insertAt)];
    setSteps(next);
    setSel(insertAt);
    setAddOpen(false);
    setSavedMsg('Nova tela criada. Edite e clique em Salvar edição desta tela antes de publicar.');
  };

  const duplicateScreen=(source:Step,index:number)=>{
    if(localDraftConflict) return;
    if(!currentScreenSaved){warnUnsavedScreen();return;}
    if(!canDuplicateStep(source)){
      setPublishError('Esta tela é estrutural e não pode ser duplicada.');
      return;
    }
    const copy=cloneEditableStep(source);
    const resultIndex=steps.findIndex(item=>item.kind==='result');
    let insertAt=index+1;
    if(resultIndex>=0) insertAt=Math.min(insertAt,resultIndex);
    const next=[...steps.slice(0,insertAt),copy,...steps.slice(insertAt)];
    setSteps(next);
    setSel(insertAt);
    setSavedMsg('Cópia criada. Revise a nova tela e salve a edição antes de publicar.');
  };


  const uploadScreenImage=async(event:ReactChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file||!step||(step.kind!=='insight'&&step.kind!=='branch'&&step.kind!=='intro')) return;
    setImageUploadError('');
    const allowed=['image/png','image/jpeg','image/webp'];
    if(!allowed.includes(file.type)){
      setImageUploadError('Use uma imagem PNG, JPG ou WebP.');
      return;
    }
    if(file.size>5*1024*1024){
      setImageUploadError('A imagem deve ter no máximo 5 MB.');
      return;
    }
    setImageUploading(true);
    try{
      const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
      const safeStep=step.id.replace(/[^a-z0-9_-]/gi,'_');
      const path=`${surveySlug}/${safeStep}/${Date.now()}.${ext}`;
      const {error}=await supabase.storage.from('survey-assets').upload(path,file,{
        cacheControl:'3600',
        contentType:file.type,
        upsert:false,
      });
      if(error) throw error;
      const {data}=supabase.storage.from('survey-assets').getPublicUrl(path);
      if(!data.publicUrl) throw new Error('PUBLIC_URL_NOT_AVAILABLE');
      setSteps(prev=>prev.map((current,index)=>{
        if(index!==sel||current.id!==step.id) return current;
        if(current.kind==='insight') return {...current,source:composeInsightSource(insightSource(current).text,data.publicUrl,false)};
        if(current.kind==='intro') return {...current,body:composeMarked(introData(current).text,data.publicUrl,'QF_INTRO_IMAGE')};
        if(current.kind==='branch') return {...current,imageUrl:data.publicUrl};
        return current;
      }));
      setSavedMsg('Imagem enviada. Salve a edição desta tela para guardar a alteração.');
    }catch(err:unknown){
      const message=err instanceof Error?err.message:'';
      setImageUploadError(message||'Não foi possível enviar a imagem. Tente novamente.');
    }finally{
      setImageUploading(false);
    }
  };

  const saveCurrentScreen=()=>{
    if(!step||localDraftConflict) return;
    try{
      const revision=saveLocalDraft(surveySlug,steps,baseVersion,localRevision);
      setLocalRevision(revision);
      setSavedDraft(steps);
      setLocalDraftExists(true);
      if(!versionConflict) setPublishError('');
      setSavedMsg(`Tela ${sel+1} salva neste navegador ✓`);
      window.setTimeout(()=>setSavedMsg(''),3500);
    }catch{
      setLocalDraftConflict(true);
      setPublishError('Outra aba salvou uma versão diferente deste rascunho. Esta aba não sobrescreveu nada. Recarregue o Builder para continuar com segurança.');
    }
  };

  const discardCurrentScreen=()=>{
    if(!step) return;
    const savedIndex=savedDraft.findIndex(item=>item.id===step.id);
    if(savedIndex>=0){
      const savedStep=savedDraft[savedIndex];
      setSteps(current=>current.map(item=>item.id===step.id?savedStep:item));
      setSavedMsg('Alterações desta tela descartadas.');
      if(!versionConflict&&!localDraftConflict) setPublishError('');
      return;
    }
    const next=steps.filter(item=>item.id!==step.id);
    setSteps(next);
    setSel(Math.max(0,Math.min(sel-1,next.length-1)));
    setSavedMsg('Nova tela descartada.');
    if(!versionConflict&&!localDraftConflict) setPublishError('');
  };

  const reloadPublished=async()=>{
    const remote=await fetchBuilderSnapshot(surveySlug);
    if(!remote){
      setPublishError('Ainda não foi possível carregar a versão publicada do Supabase.');
      return;
    }
    clearLocalDraft(surveySlug,localRevision);
    setLocalRevision(currentLocalRevision(surveySlug));
    setSteps(remote.steps);
    setSavedDraft(remote.steps);
    setBaseVersion(remote.version);
    setVersionConflict(false);
    setLocalDraftConflict(false);
    setLocalDraftExists(false);
    setSel(0);
    setPublishError('');
    setSavedMsg(`Versão ${remote.version} carregada do Supabase ✓`);
  };

  const publish=async()=>{
    if(!steps.length||publishing) return;
    if(localDraftConflict||currentLocalRevision(surveySlug)!==localRevision){
      setLocalDraftConflict(true);
      setPublishError('Outra aba alterou o rascunho. Publicação bloqueada para evitar perda de trabalho. Recarregue o Builder.');
      return;
    }
    if(versionConflict){
      setPublishError('Publicação bloqueada para evitar sobrescrever uma versão mais recente. Recarregue a versão publicada primeiro.');
      return;
    }
    if(hasUnsavedChanges){
      setPublishError('Publicação bloqueada: clique em “Salvar edição desta tela” para guardar as alterações no rascunho deste navegador.');
      return;
    }
    const validation=validateSurveyStructure(savedDraft);
    if(!validation.valid){
      setPublishError(`Publicação bloqueada: ${validation.errors[0]}`);
      return;
    }
    setPublishing(true);
    setPublishError('');
    try{
      const published=await publishSteps(surveySlug,savedDraft,baseVersion);
      setBaseVersion(published.version);
      setSteps(savedDraft);
      saveSteps(savedDraft);
      clearLocalDraft(surveySlug,localRevision);
      setLocalRevision(0);
      setLocalDraftExists(false);
      setSavedMsg(`Versão ${published.version} publicada no Supabase ✓`);
    }catch(err:unknown){
      try{
        const revision=saveLocalDraft(surveySlug,savedDraft,baseVersion,localRevision);
        setLocalRevision(revision);
        setLocalDraf…3820 tokens truncated…(intro.text,e.target.value,'QF_INTRO_IMAGE')} as Partial<Step>)}/>
          <ImagePreview src={intro.imageUrl||INTRO_FALLBACK_IMAGE} alt="Prévia da imagem da Tela 1"/>
        </>}

        {step.kind==='branch'&&<>
          <label>Imagem desta tela (para as duas respostas)</label>
            <label className="btn" style={{display:'flex',alignItems:'center',justifyContent:'center',cursor:imageUploading?'wait':'pointer',marginBottom:8}}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadScreenImage} disabled={imageUploading} style={{display:'none'}}/>
              {imageUploading?'Enviando imagem...':'Enviar nova imagem'}
            </label>
            <small className="muted" style={{display:'block',marginBottom:10}}>PNG, JPG ou WebP, até 5 MB. Salve esta tela e publique para atualizar o público.</small>
            {imageUploadError&&<div className="save-error" style={{marginBottom:10,padding:'8px 10px'}}>{imageUploadError}</div>}
            <label>URL da imagem</label><input type="url" value={step.imageUrl||''} placeholder="https://.../imagem.webp" onChange={e=>update({imageUrl:e.target.value} as Partial<Step>)}/>
            <ImagePreview src={step.imageUrl||''} alt="Prévia da imagem condicional"/>
          {Object.entries(step.variants).map(([key,v])=><div key={key} style={{marginBottom:14}}><label>Título ({key})</label><textarea value={v.title} onChange={e=>update({variants:{...step.variants,[key]:{...v,title:e.target.value}}} as Partial<Step>)}/><label>Texto ({key})</label><textarea value={v.body} onChange={e=>update({variants:{...step.variants,[key]:{...v,body:e.target.value}}} as Partial<Step>)}/></div>)}
        </>}

        {(step.kind==='email'||step.kind==='name'||step.kind==='processing')&&<><label>Título</label><textarea value={step.title} onChange={e=>update({title:e.target.value} as Partial<Step>)}/></>}
        {step.kind==='result'&&<p className="muted">A tela de resultado é composta a partir das respostas.</p>}

        {step.kind!=='result'&&<div style={{marginTop:20,paddingTop:16,borderTop:'1px solid #e3eaf0'}}>
          <button className="btn dark" onClick={saveCurrentScreen} disabled={localDraftConflict} style={{width:'100%',justifyContent:'center'}}>{`Salvar edição desta tela${currentScreenSaved?'':' *'}`}</button>
          {!currentScreenSaved&&<button className="btn" onClick={discardCurrentScreen} style={{width:'100%',justifyContent:'center',marginTop:8}}>Descartar alterações desta tela</button>}
          <small style={{display:'block',marginTop:8,color:currentScreenSaved?'#72859a':'#a35f16',lineHeight:1.4}}>{currentScreenSaved?'Esta tela está guardada no rascunho deste navegador.':'Esta tela tem alterações que ainda não foram salvas no navegador. O Builder bloqueará a troca de tela até você salvar ou descartar.'}</small>
        </div>}
      </aside>
    </div>

    <div className="builder-resize-hint">↔ Arraste as divisórias entre os painéis para ajustar os tamanhos.</div>

    {addOpen&&<div className="builder-add-overlay" onClick={()=>setAddOpen(false)}><div className="builder-add-modal" onClick={e=>e.stopPropagation()}><div className="builder-add-modal-head"><div><small>Nova tela</small><h3>O que você quer adicionar?</h3></div><button className="btn" onClick={()=>setAddOpen(false)}>✕</button></div><p className="muted">A nova tela será inserida depois de <b>{sel+1}. {labelFor(step)}</b>.</p><div className="builder-screen-types">{NEW_SCREEN_OPTIONS.map(item=><button key={item.type} className="builder-screen-type" onClick={()=>addScreen(item.type)}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.description}</small></div></button>)}</div></div></div>}

    {deleteIdx!==null&&<div style={{position:'fixed',inset:0,background:'rgba(15,30,50,.45)',display:'grid',placeItems:'center',zIndex:90}} onClick={()=>setDeleteIdx(null)}><div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:28,width:'min(380px,calc(100vw - 28px))',display:'flex',flexDirection:'column',gap:12}}><h3 style={{margin:0}}>Excluir esta tela?</h3><p className="muted" style={{margin:0}}>Digite <b>EXCLUIR</b> para confirmar.</p><input autoFocus value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="EXCLUIR" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/><div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button className="btn" onClick={()=>setDeleteIdx(null)}>Cancelar</button><button className="btn dark" disabled={confirmText!=='EXCLUIR'} onClick={confirmDelete}>Excluir tela</button></div></div></div>}
  </>;
}
