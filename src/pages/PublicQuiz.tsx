import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { projectSalary, salaryMidpoints, scoreResult, Step } from '../data/gpIa';
import { getSurveyPresentation } from '../data/surveyPresentation';
import InsightVisual from '../components/InsightVisual';
import ResultSalesSections, { ResultBookOffer } from '../components/ResultSalesSections';
import { toggleMultiAnswer } from '../lib/answerRules';
import { fetchPublishedSurvey } from '../lib/surveyConfig';
import { supabaseEnabled } from '../lib/supabase';
import { personalizeText } from '../lib/textVariables';
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
const CONTEXT_HIDE_IMAGE_RE = /\s*\[\[QF_HIDE_IMAGE\]\]\s*/;
const INTRO_FALLBACK_IMAGE = 'https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png';

function parseMarked(raw:string,re:RegExp){
  const match=raw.match(re);
  return {text:raw.replace(re,'').trim(),imageUrl:match?.[1]?.trim()||''};
}
function parseContextMarked(raw:string){
  const marked=parseMarked(raw,CONTEXT_IMAGE_RE);
  const hideImage=CONTEXT_HIDE_IMAGE_RE.test(raw);
  return {text:marked.text.replace(CONTEXT_HIDE_IMAGE_RE,'').trim(),imageUrl:marked.imageUrl,hideImage};
}

function introHeading(title: string){
  const marker='cloud certificado.';
  const pos=title.toLowerCase().indexOf(marker);
  if(pos<0) return title;
  return <>{title.slice(0,pos)}<span>{title.slice(pos)}</span></>;
}

function currentSurveySlug(){
  const match=window.location.pathname.match(/^\/d\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : 'gp-ia';
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
  const surveySlug=currentSurveySlug();
  const presentation=getSurveyPresentation(surveySlug);
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

    fetchPublishedSurvey(surveySlug).then(remote=>{
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
        if(saved.surveyVersion===remote.version){
          if(saved.steps?.length){
            resolvedSteps=saved.steps;
            resolvedVersion=saved.surveyVersion;
          }
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
  },[surveySlug]);

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
  const text=(value:string|undefined|null)=>personalizeText(value,name);
  const intro=step.kind==='intro'?parseMarked(step.body,INTRO_IMAGE_RE):null;
  const insight=step.kind==='insight'?parseContextMarked(step.source||''):null;
  const isDiagnosticQuestion=(s:Step)=>s.kind==='question'&&s.id!=='salary-range';
  const questionCount=steps.filter(isDiagnosticQuestion).length;
  const questionNumber=steps.slice(0,idx+1).filter(isDiagnosticQuestion).length;
  const progress=steps.length>1?Math.round((idx/(steps.length-1))*100):100;
  const questionCounter=step.kind==='question'&&step.id!=='salary-range'?`${questionNumber}/${questionCount}`:'';
  const pmoLikertQuestions=surveySlug==='pmo-vmo'
    ? steps.filter((s):s is Extract<Step,{kind:'question'}>=>s.kind==='question'&&s.input==='scale'&&/^pmo-q[1-6]$/.test(s.id))
    : [];
  const pmoLikertIds=new Set(pmoLikertQuestions.map(q=>q.id));
  const isPmoLikertScreen=step.kind==='question'&&pmoLikertIds.has(step.id);
  const pmoLikertFirstIndex=pmoLikertQuestions.length?steps.findIndex(s=>s.id===pmoLikertQuestions[0].id):-1;
  const pmoLikertLastIndex=pmoLikertQuestions.length?steps.findIndex(s=>s.id===pmoLikertQuestions[pmoLikertQuestions.length-1].id):-1;
  const pmoLikertComplete=pmoLikertQuestions.length>0&&pmoLikertQuestions.every(q=>typeof answers[q.id]==='string');
  const visibleQuestionCounter=isPmoLikertScreen?`1–${pmoLikertQuestions.length}/${questionCount}`:questionCounter;

  const navigate=(delta:1|-1)=>{
    if(navigationLocked.current) return;
    navigationLocked.current=true;
    setIdx(i=>Math.max(0,Math.min(i+delta,steps.length-1)));
    window.setTimeout(()=>{navigationLocked.current=false;},260);
  };
  const next=()=>navigate(1);
  const back=()=>navigate(-1);
  const goTo=(target:number)=>{
    if(navigationLocked.current) return;
    navigationLocked.current=true;
    setIdx(Math.max(0,Math.min(target,steps.length-1)));
    window.setTimeout(()=>{navigationLocked.current=false;},260);
  };
  const selectPmoLikert=(s:Extract<Step,{kind:'question'}>,value:string)=>{
    setAnswers(current=>({...current,[s.id]:value}));
  };
  const finishPmoLikert=()=>{
    if(pmoLikertComplete&&pmoLikertLastIndex>=0) goTo(pmoLikertLastIndex+1);
  };

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

  const chooseBranch=(value:'sim'|'nao')=>{
    setAnswers(current=>({...current,[presentation.branchAnswerKey]:value}));
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
      survey_slug:surveySlug,
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
    <div className="quiz-top"><button onClick={()=>isPmoLikertScreen&&pmoLikertFirstIndex>0?goTo(pmoLikertFirstIndex-1):back()} disabled={idx===0}><ArrowLeft/></button><div className="quiz-logo">{previewMode?'Prévia do rascunho':presentation.quizLabel}</div><div className="counter">{visibleQuestionCounter}</div></div>
    <div className="quiz-progress"><span style={{width:`${progress}%`}}/></div>
    <div className="quiz-stage">
      {step.kind==='branch' && (()=>{
        const variant = step.variants[(answers[presentation.branchAnswerKey] as string) || 'sim'] || Object.values(step.variants)[0];
        return <div className="intro-card branch-view" data-step-id={step.id}>
          <div className="cloud-orbit">
            <span className="cloud-ring cloud-ring-out"/>
            <span className="cloud-ring cloud-ring-in"/>
            <div className="cloud-orbit-center"><Sparkles size={26}/></div>
            {surveySlug==='gp-ia'?<>
              <span className="cloud-pill p1">🗺️ Planejamento</span>
              <span className="cloud-pill p2">🛡️ Riscos</span>
              <span className="cloud-pill p3">📊 Dados</span>
              <span className="cloud-pill p4">🎯 Decisões</span>
              <span className="cloud-pill p5">💬 Comunicação</span>
              <span className="cloud-pill p6">⚙️ Automação</span>
              <span className="cloud-pill p7">📅 Cronograma</span>
            </>:<>
              <span className="cloud-pill p1">🎯 Estratégia</span>
              <span className="cloud-pill p2">🏢 Arquitetura</span>
              <span className="cloud-pill p4">🤝 Influência</span>
              <span className="cloud-pill p6">💎 Valor</span>
            </>}
          </div>
          <h1>{text(variant.title)}</h1>
          <p>{text(variant.body)}</p>
          <button className="primary big" onClick={next}>Continuar</button>
        </div>;
      })()}
      {step.kind==='intro' && intro && <div className="intro-card intro-certificate-screen" data-step-id={step.id}>
        <div className="certificate-image-wrap">
          <img className="certificate-image" src={intro.imageUrl||INTRO_FALLBACK_IMAGE} alt={surveySlug==='pmo-vmo'?'Capa do livro Estratégia em Ação':'Certificado Gestão de Projetos com IA - Formação Mestre GP'} loading="eager" decoding="async" />
        </div>
        <h1>{introHeading(text(step.title))}</h1>
        <p className="intro-question">{text(intro.text)}</p>
        <div className="intro-choice-row">
          <button className="primary intro-choice" onClick={()=>chooseBranch('sim')}>Sim <span>→</span></button>
          <button className="primary intro-choice" onClick={()=>chooseBranch('nao')}>Não <span>→</span></button>
        </div>
      </div>}
      {isPmoLikertScreen && <div className="question-view qf-pmo-likert-group" data-step-id="pmo-likert-group">
        <h1>Como você avalia sua maturidade em PMO?</h1>
        <p className="muted center">Marque o quanto cada afirmação representa sua atuação hoje.</p>
        <div className="qf-pmo-likert-legend" aria-label="Escala Likert"><span><b>1</b> = Discordo totalmente</span><span><b>5</b> = Concordo totalmente</span></div>
        <div className="qf-pmo-likert-scroll">
          <div className="qf-pmo-likert-matrix">
            <div className="qf-pmo-likert-header">
              <span/>
              {pmoLikertQuestions[0]?.options.map(o=><span key={o.value}>{text(o.label)}</span>)}
            </div>
            {pmoLikertQuestions.map((q,qIndex)=><div className="qf-pmo-likert-row" key={q.id}>
              <div className="qf-pmo-likert-statement"><b>{qIndex+1}.</b> {text(q.title)}</div>
              {q.options.map(o=>{
                const selected=answers[q.id]===o.value;
                return <button type="button" className={`qf-pmo-likert-choice ${selected?'selected':''}`} aria-label={`${text(q.title)} — ${text(o.label)}`} aria-pressed={selected} key={o.value} onClick={()=>selectPmoLikert(q,o.value)}><span>{o.value}</span></button>;
              })}
            </div>)}
          </div>
        </div>
        <button className="primary big" disabled={!pmoLikertComplete} onClick={finishPmoLikert}>Continuar</button>
      </div>}
      {step.kind==='question' && !isPmoLikertScreen && step.layout==='photo' && <div className="question-view" data-step-id={step.id}><h1>{text(step.title)}</h1>{step.subtitle&&<p className="muted center">{text(step.subtitle)}</p>}<div className="photo-choice-row">{step.options.map(o=>{const selected=answers[step.id]===o.value;return <button key={o.value} className={`photo-choice ${selected?'selected':''}`} onClick={()=>select(step,o.value)}><div className="photo-choice-art">{o.photo==='female'?<img src="/avatars/woman.webp" alt="Feminino"/>:<img src="/avatars/man.webp" alt="Masculino"/>}</div><span>{text(o.label)}</span></button>})}</div></div>}
      {step.kind==='question' && !isPmoLikertScreen && step.layout!=='photo' && <div className="question-view" data-step-id={step.id}><h1>{text(step.title)}</h1>{step.subtitle&&<p className="muted center">{text(step.subtitle)}</p>}<div className={step.input==='scale'?'scale-row':'answer-stack'}>{step.options.map(o=>{const val=answers[step.id];const selected=Array.isArray(val)?val.includes(o.value):val===o.value;return <button className={`answer ${selected?'selected':''}`} key={o.value} onClick={()=>select(step,o.value)}><span>{o.emoji}</span><span className="answer-label">{text(o.label)}</span>{step.input==='multi'&&<i>{selected?<Check size={18}/>:''}</i>}</button>})}</div>{step.input==='multi'&&<button className="primary big" disabled={!Array.isArray(answers[step.id])||!(answers[step.id] as string[]).length} onClick={next}>Continuar</button>}</div>}
      {step.kind==='insight' && insight && surveySlug==='pmo-vmo' && step.id==='insight-pre-result-guide' && <div className="insight-view qf-pmo-impact-context" data-step-id={step.id}>
        <h1>{text(step.title)}</h1>
        {step.icons && <ul className="qf-pmo-impact-list">{step.icons.map(item=><li key={item.text}><strong>{text(item.emoji)}:</strong> <span>{text(item.text)}</span></li>)}</ul>}
        {insight.text&&<div className="source-note">Fonte: {text(insight.text)}</div>}
        <button className="primary big" onClick={next}>Continuar</button>
      </div>}
      {step.kind==='insight' && insight && !(surveySlug==='pmo-vmo' && step.id==='insight-pre-result-guide') && <div className={`insight-view ${step.id==='insight-pre-result-guide'?'qf-pre-result-guide-view':''}`} data-step-id={step.id}>{!insight.hideImage&&<InsightVisual step={step} imageUrl={insight.imageUrl}/>}<small>{text(step.eyebrow)}</small><h1>{text(step.title)}</h1><p>{text(step.body)}</p>
        {step.chart && <div className="insight-chart">{step.chart.map(bar=><div className="insight-bar-row" key={bar.label}><div className="insight-bar-meta"><span>{text(bar.label)}</span><b>{text(bar.suffix)}</b></div><div className="insight-bar-track"><i className={bar.highlight?'highlight':''} style={{width:`${bar.value}%`}}/></div></div>)}</div>}
        {step.icons && <div className="insight-icons">{step.icons.map(item=><div className="insight-icon-row" key={item.text}><span>{item.emoji}</span><p>{text(item.text)}</p></div>)}</div>}
        {step.stat && <div className="stat-box">{text(step.stat)}</div>}
        {insight.text&&<div className="source-note">Fonte: {text(insight.text)}</div>}
        <button className="primary big" onClick={next}>Continuar</button></div>}
      {step.kind==='processing' && <div className="processing-view" data-step-id={step.id}><h1>{text(step.title)}</h1><div className="process-lines"><p><span>{presentation.processing.labels[0]}</span><b>100%</b></p><div><i style={{width:'100%'}}/></div><p><span>{presentation.processing.labels[1]}</span><b>86%</b></p><div><i style={{width:'86%'}}/></div><p><span>{presentation.processing.labels[2]}</span><b>72%</b></p><div><i style={{width:'72%'}}/></div></div><p className="muted center">{presentation.processing.subtitle}</p><button className="primary big" disabled={saving} onClick={saveLead}>{saving?'Salvando...':'Ver resultado'}</button></div>}
      {step.kind==='email' && <div className="field-view" data-step-id={step.id}><h1>{text(step.title)}</h1><input autoFocus type="email" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary big" disabled={!isValidEmail(email)} onClick={next}>Continuar</button><small>Ao continuar, você concorda em receber seu diagnóstico e conteúdos relacionados.</small></div>}
      {step.kind==='name' && <div className="field-view" data-step-id={step.id}><h1>{text(step.title)}</h1><input autoFocus placeholder="Seu primeiro nome" value={name} onChange={e=>setName(e.target.value)}/><button className="primary big" disabled={!name.trim()} onClick={next}>Continuar</button><small>Usaremos seu primeiro nome para personalizar as próximas telas.</small></div>}
      {step.kind==='result' && <Result surveySlug={surveySlug} name={name.trim()} pct={result.pct} level={result.level} dimensions={result.dimensions} salaryRange={answers['salary-range'] as string|undefined} onRestart={restart}/>} 
    </div>
  </div>
}

function Result({surveySlug,name,pct,level,dimensions,salaryRange,onRestart}:{surveySlug:string;name:string;pct:number;level:number;dimensions:Record<string,number>;salaryRange?:string;onRestart:()=>void}){
  const presentation=getSurveyPresentation(surveySlug);
  const copy=presentation.levels[level as 1|2|3|4];
  const chartData=presentation.dimensions
    .filter(([,key])=>Object.prototype.hasOwnProperty.call(dimensions,key))
    .map(([label,key])=>[label,dimensions[key]] as const);
  const baseline = presentation.showSalaryProjection && salaryRange ? salaryMidpoints[salaryRange] : undefined;
  const projection = baseline ? projectSalary(baseline) : null;
  const fmt = (n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});

  return <div className="result-view" data-step-id="result">
    <div className="result-kicker">{presentation.resultKicker}</div>
    <h1>{name?`${name}, `:''}você está no nível <span>{copy.name}</span></h1>
    <div className="score-card"><div className="gauge"><i style={{left:`calc(${pct}% - 10px)`}}/></div><div className="gauge-labels">{presentation.gaugeLabels.map(label=><span key={label}>{label}</span>)}</div><b className="score-number">{pct}%</b></div>
    <div className="result-copy"><h2>{copy.headline}</h2><p>{copy.next}</p></div>

    {chartData.length>0&&<section className="dimension-card">
      <div className="section-heading"><small>Seu mapa de maturidade</small><h2>{surveySlug==='pmo-vmo'?'As competências que já sustentam sua atuação e onde está o próximo salto':surveySlug==='tire-projeto-do-papel'?'Onde você já consegue fazer acontecer e onde ainda existe espaço para evoluir':'Onde sua IA já gera valor e onde ainda existe espaço para crescer'}</h2></div>
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
      <small>{presentation.insightCard.eyebrow}</small>
      <h2>{presentation.insightCard.title}</h2>
      <p>{presentation.insightCard.body}</p>
      {presentation.insightCard.source&&<div className="source-note">Fonte: {presentation.insightCard.source}</div>}
    </section>

    <ResultBookOffer surveySlug={surveySlug}/>
    <ResultSalesSections surveySlug={surveySlug}/>

    <button className="secondary big" type="button" onClick={onRestart}>Refazer diagnóstico</button>
  </div>
}
