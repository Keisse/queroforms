import { useMemo, useState } from 'react';
import { ArrowLeft, Check, LoaderCircle, Sparkles } from 'lucide-react';
import { gpIaSteps, levelCopy, scoreResult, Step } from '../data/gpIa';
import { supabase, supabaseEnabled } from '../lib/supabase';

export default function PublicQuiz(){
  const [idx,setIdx]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string|string[]>>({});
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const step=gpIaSteps[idx];
  const progress=Math.round(((idx+1)/gpIaSteps.length)*100);
  const result=useMemo(()=>scoreResult(answers),[answers]);
  const next=()=>setIdx(i=>Math.min(i+1,gpIaSteps.length-1));
  const back=()=>setIdx(i=>Math.max(i-1,0));
  const select=(s:Extract<Step,{kind:'question'}>, value:string)=>{
    if(s.input==='multi'){
      const cur=Array.isArray(answers[s.id])?answers[s.id] as string[]:[];
      setAnswers({...answers,[s.id]:cur.includes(value)?cur.filter(v=>v!==value):[...cur,value]});
    } else {
      setAnswers({...answers,[s.id]:value});
      setTimeout(next,180);
    }
  };
  const saveLead=async()=>{
    setSaving(true); setSaveError('');
    try{
      const qs = new URLSearchParams(window.location.search);
      const payload={
        survey_slug:'gp-ia', name, email, score:result.pct, level:result.level,
        dimension_scores:result.dimensions, answers,
        source:qs.get('source') || qs.get('utm_source') || 'direct',
        utm_source:qs.get('utm_source'), utm_medium:qs.get('utm_medium'),
        utm_campaign:qs.get('utm_campaign'), utm_content:qs.get('utm_content'),
        utm_term:qs.get('utm_term'), landing_url:window.location.href,
        referrer:document.referrer || null, user_agent:navigator.userAgent
      };
      const {error}=await supabase.from('submissions').insert(payload);
      if(error) throw error;
      next();
    } catch(err){
      console.error(err);
      setSaveError('Não conseguimos salvar seu diagnóstico agora. Verifique a configuração do Supabase e tente novamente.');
    } finally{setSaving(false)}
  };

  return <div className="quiz-wrap">
    <div className="quiz-top"><button onClick={back} disabled={idx===0}><ArrowLeft/></button><div className="quiz-logo">QueroForms</div><div className="counter">{idx+1}/{gpIaSteps.length}</div></div>
    <div className="quiz-progress"><span style={{width:`${progress}%`}}/></div>
    <div className="quiz-stage">
      {step.kind==='intro' && <div className="intro-card"><div className="hero-orbit"><span>Planejamento</span><span>Riscos</span><span>Decisões</span><span>Relatórios</span><div>IA</div></div><h1>{step.title}</h1><p>{step.body}</p><button className="primary big" onClick={next}>{step.cta}</button></div>}
      {step.kind==='question' && <div className="question-view"><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className={step.input==='scale'?'scale-row':'answer-stack'}>{step.options.map(o=>{const val=answers[step.id];const selected=Array.isArray(val)?val.includes(o.value):val===o.value;return <button className={`answer ${selected?'selected':''}`} key={o.value} onClick={()=>select(step,o.value)}><span>{o.emoji}</span><b>{o.label}</b>{step.input==='multi'&&<i>{selected?<Check size={18}/>:''}</i>}</button>})}</div>{step.input==='multi'&&<button className="primary big" onClick={next}>Continuar</button>}</div>}
      {step.kind==='insight' && <div className="insight-view"><div className="insight-visual"><Sparkles size={54}/></div><small>{step.eyebrow}</small><h1>{step.title}</h1><p>{step.body}</p><div className="stat-box">{step.stat}</div><button className="primary big" onClick={next}>Continuar</button></div>}
      {step.kind==='processing' && <div className="processing-view"><h1>{step.title}</h1><div className="process-lines"><p><span>Mapeando seu uso de IA</span><b>100%</b></p><div><i style={{width:'100%'}}/></div><p><span>Analisando maturidade</span><b>86%</b></p><div><i style={{width:'86%'}}/></div><p><span>Identificando seu próximo salto</span><b>72%</b></p><div><i style={{width:'72%'}}/></div></div><LoaderCircle className="spin"/><button className="primary big" onClick={next}>Ver resultado</button></div>}
      {step.kind==='email' && <div className="field-view"><h1>{step.title}</h1><input autoFocus type="email" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary big" disabled={!email.includes('@')} onClick={next}>Continuar</button><small>Ao continuar, você concorda em receber seu diagnóstico e conteúdos relacionados.</small></div>}
      {step.kind==='name' && <div className="field-view"><h1>{step.title}</h1><input autoFocus placeholder="Seu primeiro nome" value={name} onChange={e=>setName(e.target.value)}/><button className="primary big" disabled={!name || saving} onClick={saveLead}>{saving?'Salvando...':'Liberar meu diagnóstico'}</button>{saveError&&<div className="save-error">{saveError}</div>}<small>{supabaseEnabled?'Supabase configurado para receber os dados deste diagnóstico.':'Modo demonstração.'}</small></div>}
      {step.kind==='result' && <Result name={name} pct={result.pct} level={result.level}/>} 
    </div>
  </div>
}

function Result({name,pct,level}:{name:string,pct:number,level:number}){
  const copy=levelCopy[level as 1|2|3|4];
  return <div className="result-view"><div className="result-kicker">Seu perfil de maturidade</div><h1>{name?`${name}, `:''}você está no nível <span>{copy.name}</span></h1><div className="score-card"><div className="gauge"><i style={{left:`calc(${pct}% - 10px)`}}/></div><div className="gauge-labels"><span>Explorador</span><span>Usuário</span><span>Aumentado</span><span>AI-First</span></div><b className="score-number">{pct}%</b></div><div className="result-copy"><h2>{copy.headline}</h2><p>{copy.next}</p></div><div className="offer-card"><div className="ebook-cover"><span>GUIA PRÁTICO</span><strong>Gestão de Projetos com IA</strong><small>Do prompt à decisão</small></div><div><small>Recomendado para o seu momento</small><h2>Transforme seu próximo projeto em um laboratório de GP com IA.</h2><p>Um eBook prático para aplicar IA em planejamento, riscos, comunicação, análise e tomada de decisão.</p><button className="primary big">Quero o eBook GP com IA</button><button className="secondary big">Ver página completa do eBook</button></div></div></div>
}
