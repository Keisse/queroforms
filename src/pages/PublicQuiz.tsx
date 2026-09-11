import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { levelCopy, projectSalary, salaryMidpoints, scoreResult, Step } from '../data/gpIa';
import InsightVisual from '../components/InsightVisual';
import { toggleMultiAnswer } from '../lib/answerRules';
import { fetchPublishedSurvey } from '../lib/surveyConfig';
import { supabaseEnabled } from '../lib/supabase';
import {
  clearQuizProgress,
  enqueueSubmission,
  flushSubmissionQueue,
  readBuilderDraftPreview,
  readQuizProgress,
  removePendingSubmission,
  saveQuizProgress,
  submitWithRetry,
  type SubmissionPayload,
} from '../lib/quizSession';

const INTRO_IMAGE_RE = /\s*\[\[QF_INTRO_IMAGE:([^\]]+)\]\]\s*/;
const CONTEXT_IMAGE_RE = /\s*\[\[QF_IMAGE:([^\]]+)\]\]\s*/;
const INTRO_FALLBACK_IMAGE = 'https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png';

function parseMarked(raw:string,re:RegExp){
  const match=raw.match(re);
  return {text:raw.replace(re,'').trim(),imageUrl:match?.[1]?.trim()||''};
}

function introHeading(title: string){
  const marker='cloud certificado.';
  const pos=title.toLowerCase().indexOf(marker);
  if(pos<0) return title;
  return <>{title.slice(0,pos)}<span>{title.slice(pos)}</span></>;
}

function isValidEmail(value:string){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function createAttemptId(){
  if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function') return crypto.randomUUID();

  const bytes=new Uint8Array(16);
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function') crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i+=1) bytes[i]=Math.floor(Math.random()*256);

  bytes[6]=(bytes[6]&0x0f)|0x40;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export default function PublicQuiz(){
  const [steps,setSteps]=useState<Step[]|null>(null);
  const [surveyVersion,setSurveyVersion]=useState(1);
  const [loadError,setLoadError]=useState(false);
  const [previewMode,setPreviewMode]=useState(false);
  const [idx,setIdx]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string|string[]>>({});
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const navigationLocked=useRef(false);
  const saveStarted=useRef(false);
  const progressReady=useRef(false);
  const attemptId=useRef(createAttemptId());

  useEffect(()=>{
    let active=true;
    const wantsDraftPreview=new URLSearchParams(window.location.search).get('preview')==='draft';

    fetchPublishedSurvey('gp-ia').then(remote=>{
      if(!active) return;
      if(!remote?.steps.length){
        setLoadError(true);
        return;
      }

      const draftPreview=wantsDraftPreview?readBuilderDraftPreview(remote.version):null;
      const isDraftPreview=Boolean(draftPreview);
      const saved=!isDraftPreview?readQuizProgress():null;
      let resolvedSteps=draftPreview||remote.steps;
      let resolvedVersion=remote.version;

      if(saved){
        if(saved.steps?.length){
          resolvedSteps=saved.steps;
          resolvedVersion=saved.surveyVersion;
          setIdx(Math.min(saved.idx,resolvedSteps.length-1));
          setAnswers(saved.answers);
          setEmail(saved.email);
          setName(saved.name);
          attemptId.current=saved.attemptId;
        }else if(saved.surveyVersion===remote.version){
          setIdx(Math.min(saved.idx,resolvedSteps.length-1));
          setAnswers(saved.answers);
          setEmail(saved.email);
          setName(saved.name);
          attemptId.current=saved.attemptId;
        }else{
          clearQuizProgress();
        }
      }

      setSteps(resolvedSteps);
      setSurveyVersion(resolvedVersion);
      setPreviewMode(isDraftPreview);
      progressReady.current=true;
      setLoadError(false);
    });

    return()=>{active=false;};
  },[]);

  useEffect(()=>{
    if(!steps||previewMode||!progressReady.current) return;
    saveQuizProgress({
      surveyVersion,
      steps,
      idx,
      answers,
      email,
      name,
      attemptId:attemptId.current,
    });
  },[steps,previewMode,surveyVersion,idx,answers,email,name]);

  useEffect(()=>{
    const flush=()=>{void flushSubmissionQueue();};
    flush();
    window.addEventListener('online',flush);
    window.addEventListener('focus',flush);
    return()=>{
      window.removeEventListener('online',flush);
      window.removeEventListener('focus',flush);
    };
  },[]);

  const result=useMemo(()=>steps?scoreResult(steps,answers):{pct:0,level:1,dimensions:{} as Record<string,number>},[steps,answers]);

  if(loadError) return <div className="quiz-wrap"><div className="quiz-stage" style={{textAlign:'center',paddingTop:100,color:'#52667a'}}><h1 style={{fontSize:28}}>Não foi possível carregar o diagnóstico.</h1><p>Para evitar mostrar uma versão diferente da publicada, o formulário não usa conteúdo local quando o banco está indisponível.</p><button className="primary big" onClick={()=>window.location.reload()}>Tentar novamente</button></div></div>;
  if(!steps) return <div className="quiz-wrap"><div className="quiz-stage" style={{textAlign:'center',paddingTop:100,color:'#7a8b9c'}}>Carregando diagnóstico...</div></div>;

  const step=steps[idx];
  const intro=step.kind==='intro'?parseMarked(step.body,INTRO_IMAGE_RE):null;
  const insight=step.kind==='insight'?parseMarked(step.source||'',CONTEXT_IMAGE_RE):null;
  const questionCount=steps.filter(s=>s.kind==='question').length;
  const questionNumber=steps.slice(0,idx+1).filter(s=>s.kind==='question').length;
  const progress=questionCount?Math.round((questionNumber/questionCount)*100):0;
  const questionCounter=step.kind==='question'?`${questionNumber}/${questionCount}`:'';

  const navigate=(delta:1|-1)=>{
    if(navigationLocked.current) return;
    navigationLocked.current=true;
    setIdx(i=>Math.max(0,Math.min(i+delta,steps.length-1)));
    window.setTimeout(()=>{navigationLocked.current=false;},260);
  };
  const next=()=>navigate(1);
  const back=()=>navigate(-1);

  const select=(s:Extract<Step,{kind:'question'}>, value:string)=>{
    if(s.input==='multi'){
      setAnswers(current=>{
        const cur=Array.isArray(current[s.id])?current[s.id] as string[]:[];
        return {...current,[s.id]:toggleMultiAnswer(cur,value)};
      });
    } else {
      setAnswers(current=>({...current,[s.id]:value}));
      window.setTimeout(next,180);
    }
  };

  const chooseCloud=(value:'sim'|'nao')=>{
    setAnswers(current=>({...current,'cloud-use':value}));
    next();
  };

  const saveLead=()=>{
    if(saving) return;
    if(saveStarted.current){
      next();
      return;
    }

    if(previewMode){
      next();
      return;
    }

    saveStarted.current=true;
    setSaving(true);
    const qs = new URLSearchParams(window.location.search);
    const payload:SubmissionPayload={
      survey_slug:'gp-ia',
      survey_version:surveyVersion,
      attempt_id:attemptId.current,
      name:name.trim(),
      email:email.trim(),
      score:result.pct,
      level:result.level,
      dimension_scores:result.dimensions,
      answers,
      source:qs.get('source') || qs.get('utm_source') || 'direct',
      utm_source:qs.get('utm_source'), utm_medium:qs.get('utm_medium'),
      utm_campaign:qs.get('utm_campaign'), utm_content:qs.get('utm_content'),
      utm_term:qs.get('utm_term'), landing_url:window.location.href,
      referrer:document.referrer || null, user_agent:navigator.userAgent
    };

    enqueueSubmission(payload);
    next();

    if(!supabaseEnabled){
      setSaving(false);
      return;
    }

    void (async()=>{
      const saved=await submitWithRetry(payload);
      if(saved) removePendingSubmission(payload.attempt_id);
      setSaving(false);
    })();
  };

  const restart=()=>{
    clearQuizProgress();
    window.location.reload();
  };

  return <div className="quiz-wrap">
    <div className="quiz-top"><button onClick={back} disabled={idx===0}><ArrowLeft/></button><div className="quiz-logo">{previewMode?'Prévia do rascunho':'Diagnóstico de Maturidade'}</div><div className="counter">{questionCounter}</div></div>
    <div className="quiz-progress"><span style={{width:`${progress}%`}}/></div>
    <div className="quiz-stage">
      {step.kind==='branch' && (()=>{
        const variant = step.variants[(answers['cloud-use'] as string) || 'sim'] || Object.values(step.variants)[0];
        return <div className="intro-card branch-view" data-step-id={step.id}>
          <div className="cloud-orbit">
            <span className="cloud-ring cloud-ring-out"/>
            <span className="cloud-ring cloud-ring-in"/>
            <div className="cloud-orbit-center"><Sparkles size={26}/></div>
            <span className="cloud-pill p1">🗺️ Planejamento</span>
            <span className="cloud-pill p2">🛡️ Riscos</span>
            <span className="cloud-pill p3">📊 Dados</span>
            <span className="cloud-pill p4">🎯 Decisões</span>
            <span className="cloud-pill p5">💬 Comunicação</span>
            <span className="cloud-pill p6">⚙️ Automação</span>
            <span className="cloud-pill p7">📅 Cronograma</span>
          </div>
          <h1>{variant.title}</h1>
          <p>{variant.body}</p>
          <button className="primary big" onClick={next}>Continuar</button>
        </div>;
      })()}
      {step.kind==='intro' && intro && <div className="intro-card intro-certificate-screen" data-step-id={step.id}>
        <div className="certificate-image-wrap">
          <img className="certificate-image" src={intro.imageUrl||INTRO_FALLBACK_IMAGE} alt="Certificado Gestão de Projetos com IA - Formação Mestre GP" loading="eager" decoding="async" />
        </div>
        <h1>{introHeading(step.title)}</h1>
        <p className="intro-question">{intro.text}</p>
        <div className="intro-choice-row">
          <button className="primary intro-choice" onClick={()=>chooseCloud('sim')}>Sim <span>→</span></button>
          <button className="primary intro-choice" onClick={()=>chooseCloud('nao')}>Não <span>→</span></button>
        </div>
      </div>}
      {step.kind==='question' && step.layout==='photo' && <div className="question-view" data-step-id={step.id}><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className="photo-choice-row">{step.options.map(o=>{const selected=answers[step.id]===o.value;return <button key={o.value} className={`photo-choice ${selected?'selected':''}`} onClick={()=>select(step,o.value)}><div className="photo-choice-art">{o.photo==='female'?<img src="/avatars/woman.webp" alt="Feminino"/>:<img src="/avatars/man.webp" alt="Masculino"/>}</div><span>{o.label}</span></button>})}</div></div>}
      {step.kind==='question' && step.layout!=='photo' && <div className="question-view" data-step-id={step.id}><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className={step.input==='scale'?'scale-row':'answer-stack'}>{step.options.map(o=>{const val=answers[step.id];const selected=Array.isArray(val)?val.includes(o.value):val===o.value;return <button className={`answer ${selected?'selected':''}`} key={o.value} onClick={()=>select(step,o.value)}><span>{o.emoji}</span><span className="answer-label">{o.label}</span>{step.input==='multi'&&<i>{selected?<Check size={18}/>:''}</i>}</button>})}</div>{step.input==='multi'&&<button className="primary big" disabled={!Array.isArray(answers[step.id])||!(answers[step.id] as string[]).length} onClick={next}>Continuar</button>}</div>}
      {step.kind==='insight' && insight && <div className={`insight-view ${step.id==='insight-pre-result-guide'?'qf-pre-result-guide-view':''}`} data-step-id={step.id}><InsightVisual step={step} imageUrl={insight.imageUrl}/><small>{step.eyebrow}</small><h1>{step.title}</h1><p>{step.body}</p>
        {step.chart && <div className="insight-chart">{step.chart.map(bar=><div className="insight-bar-row" key={bar.label}><div className="insight-bar-meta"><span>{bar.label}</span><b>{bar.suffix}</b></div><div className="insight-bar-track"><i className={bar.highlight?'highlight':''} style={{width:`${bar.value}%`}}/></div></div>)}</div>}
        {step.icons && <div className="insight-icons">{step.icons.map(item=><div className="insight-icon-row" key={item.text}><span>{item.emoji}</span><p>{item.text}</p></div>)}</div>}
        {step.stat && <div className="stat-box">{step.stat}</div>}
        {insight.text&&<div className="source-note">Fonte: {insight.text}</div>}
        <button className="primary big" onClick={next}>Continuar</button></div>}
      {step.kind==='processing' && <div className="processing-view" data-step-id={step.id}><h1>{step.title}</h1><div className="process-lines"><p><span>Mapeando seu uso de IA</span><b>100%</b></p><div><i style={{width:'100%'}}/></div><p><span>Analisando sua maturidade</span><b>86%</b></p><div><i style={{width:'86%'}}/></div><p><span>Identificando seu próximo salto</span><b>72%</b></p><div><i style={{width:'72%'}}/></div></div><p className="muted center">Cruzamos suas respostas com os principais sinais de maturidade em IA aplicada à gestão de projetos.</p><button className="primary big" onClick={next}>Ver resultado</button></div>}
      {step.kind==='email' && <div className="field-view" data-step-id={step.id}><h1>{step.title}</h1><input autoFocus type="email" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary big" disabled={!isValidEmail(email)} onClick={next}>Continuar</button><small>Ao continuar, você concorda em receber seu diagnóstico e conteúdos relacionados.</small></div>}
      {step.kind==='name' && <div className="field-view" data-step-id={step.id}><h1>{step.title}</h1><input autoFocus placeholder="Seu primeiro nome" value={name} onChange={e=>setName(e.target.value)}/><button className="primary big" disabled={!name.trim() || saving} onClick={saveLead}>{saving?'Salvando...':'Liberar meu diagnóstico'}</button><small>{previewMode?'Modo de pré-visualização: nenhum lead será salvo.':supabaseEnabled?'Supabase configurado para receber os dados deste diagnóstico.':'Modo demonstração.'}</small></div>}
      {step.kind==='result' && <Result name={name.trim()} pct={result.pct} level={result.level} dimensions={result.dimensions} salaryRange={answers['salary-range'] as string|undefined} onRestart={restart}/>} 
    </div>
  </div>
}

function Result({name,pct,level,dimensions,salaryRange,onRestart}:{name:string;pct:number;level:number;dimensions:Record<string,number>;salaryRange?:string;onRestart:()=>void}){
  const copy=levelCopy[level as 1|2|3|4];
  const desiredDimensions = [
    ['Planejamento','planejamento'],
    ['Riscos','riscos'],
    ['Decisão','decisao'],
    ['Comunicação','comunicacao'],
    ['Automação','automacao'],
    ['Confiança','confianca'],
  ] as const;
  const chartData=desiredDimensions
    .filter(([,key])=>Object.prototype.hasOwnProperty.call(dimensions,key))
    .map(([label,key])=>[label,dimensions[key]] as const);
  const baseline = salaryRange ? salaryMidpoints[salaryRange] : undefined;
  const projection = baseline ? projectSalary(baseline) : null;
  const fmt = (n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});

  return <div className="result-view" data-step-id="result">
    <div className="result-kicker">Seu perfil de maturidade</div>
    <h1>{name?`${name}, `:''}você está no nível <span>{copy.name}</span></h1>
    <div className="score-card"><div className="gauge"><i style={{left:`calc(${pct}% - 10px)`}}/></div><div className="gauge-labels"><span>Explorador</span><span>Usuário</span><span>Aumentado</span><span>Orientado por IA</span></div><b className="score-number">{pct}%</b></div>
    <div className="result-copy"><h2>{copy.headline}</h2><p>{copy.next}</p></div>

    {chartData.length>0&&<section className="dimension-card">
      <div className="section-heading"><small>Seu mapa de maturidade</small><h2>Onde sua IA já gera valor e onde ainda existe espaço para crescer</h2></div>
      <div className="dimension-bars">{chartData.map(([label,value])=><div className="dimension-row" key={label}><div className="dimension-meta"><span>{label}</span><b>{value}%</b></div><div className="dimension-track"><i style={{width:`${value}%`}}/></div></div>)}</div>
    </section>}

    {projection && <section className="salary-card">
      <div className="section-heading"><small>Projeção de carreira</small><h2>Sua evolução salarial com certificações em IA nos próximos 3 anos</h2></div>
      <div className="salary-chart">
        {projection.map((p,i)=>{const max=projection[projection.length-1].value; const h=Math.round((p.value/max)*100);
          return <div className="salary-col" key={p.label}><span className="salary-value">{fmt(p.value)}</span><div className="salary-bar-wrap"><div className={`salary-bar ${i===projection.length-1?'top':''}`} style={{height:`${h}%`}}/></div><small>{p.label}</small></div>;
        })}
      </div>
      <p className="salary-note">Projeção educativa a partir da sua faixa salarial atual, combinando o prêmio médio de certificação PMP® (+22%), ciclos de reajuste anual e o diferencial de quem une Gestão de Projetos e IA. Baseada em médias de mercado, não é uma promessa individual; resultados variam por empresa, senioridade e região.</p>
      <div className="source-note">Fontes: PMI, Earning Power: Project Management Salary Survey; Mario H. Trentim, Board Member PMI Global</div>
    </section>}

    <section className="pmi-card">
      <small>Insight do PMBOK® 8ª edição</small>
      <h2>Seu próximo salto não é usar mais ferramentas. É usar IA com mais contexto, governança e intenção.</h2>
      <p>O guia atual coloca a IA dentro da realidade do gerenciamento de projetos: análise de dados, previsão de riscos, apoio à decisão, planejamento e automação. Ao mesmo tempo, reforça que a qualidade das entradas e a supervisão humana continuam determinantes para o resultado.</p>
    </section>

    <div className="offer-card">
      <div className="ebook-cover-real"><img src="https://allevotech.com.br/wp-content/uploads/2026/06/Capa-760.webp" alt="Capa do livro Gestão de Projetos com Inteligência Artificial, de Mario Trentim" /></div>
      <div className="offer-copy"><small>Recomendado para o seu momento</small><h2>Gestão de Projetos com Inteligência Artificial</h2><p>O livro de Mario Trentim mostra como aplicar IA em planejamento, riscos, comunicação, análise e tomada de decisão para conduzir projetos com mais inteligência e foco em valor.</p><a className="primary big" href="https://chk.eduzz.com/40QR6AJP9B" target="_blank" rel="noreferrer">Desbloquear acesso</a><a className="secondary big" href="https://trentim.com/livro-gestao-de-projetos-com-ia-perpetuo/" target="_blank" rel="noreferrer">Saiba mais</a></div>
    </div>

    <button className="secondary big" type="button" onClick={onRestart}>Refazer diagnóstico</button>
  </div>
}
