import { useEffect, useMemo, useState } from 'react';
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

  useEffect(()=>{
    if(step?.kind!=='processing') return;
    const timer=window.setTimeout(()=>next(),2200);
    return ()=>window.clearTimeout(timer);
  },[step?.kind]);

  const select=(s:Extract<Step,{kind:'question'}>, value:string)=>{
    if(s.input==='multi'){
      const cur=Array.isArray(answers[s.id])?answers[s.id] as string[]:[];
      setAnswers({...answers,[s.id]:cur.includes(value)?cur.filter(v=>v!==value):[...cur,value]});
    } else {
      setAnswers({...answers,[s.id]:value});
      setTimeout(next,180);
    }
  };

  const chooseCloud=(value:'sim'|'nao')=>{
    setAnswers(current=>({...current,'cloud-use':value}));
    setTimeout(next,160);
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
      setSaveError('Não conseguimos salvar seu diagnóstico agora. Tente novamente em alguns instantes.');
    } finally{setSaving(false)}
  };

  return <div className="quiz-wrap">
    <div className="quiz-top"><button onClick={back} disabled={idx===0}><ArrowLeft/></button><div className="quiz-logo">QueroForms</div><div className="counter">{step.kind==='intro'?'':`${idx+1}/${gpIaSteps.length}`}</div></div>
    <div className="quiz-progress"><span style={{width:`${progress}%`}}/></div>
    <div className="quiz-stage">
      {step.kind==='intro' && <div className="intro-card intro-certificate-screen">
        <div className="certificate-image-wrap">
          <img className="certificate-image" src="/certificado-inline.svg" alt="Certificado Gestão de Projetos com IA - Formação Mestre GP" />
        </div>
        <h1>Se torne um mestre do <span>cloud certificado.</span></h1>
        <p className="intro-question">Você já usa o cloud?</p>
        <div className="intro-choice-row">
          <button className="primary intro-choice" onClick={()=>chooseCloud('sim')}>Sim <span>→</span></button>
          <button className="primary intro-choice" onClick={()=>chooseCloud('nao')}>Não <span>→</span></button>
        </div>
      </div>}
      {step.kind==='question' && <div className="question-view"><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className={step.input==='scale'?'scale-row':'answer-stack'}>{step.options.map(o=>{const val=answers[step.id];const selected=Array.isArray(val)?val.includes(o.value):val===o.value;return <button className={`answer ${selected?'selected':''}`} key={o.value} onClick={()=>select(step,o.value)}><span>{o.emoji}</span><span className="answer-label">{o.label}</span>{step.input==='multi'&&<i>{selected?<Check size={18}/>:''}</i>}</button>})}</div>{step.input==='multi'&&<button className="primary big" onClick={next}>Continuar</button>}</div>}
      {step.kind==='insight' && <div className="insight-view"><div className="insight-visual"><Sparkles size={54}/></div><small>{step.eyebrow}</small><h1>{step.title}</h1><p>{step.body}</p><div className="stat-box">{step.stat}</div>{step.source&&<div className="source-note">Fonte: {step.source}</div>}<button className="primary big" onClick={next}>Continuar</button></div>}
      {step.kind==='processing' && <div className="processing-view"><h1>{step.title}</h1><div className="process-lines"><p><span>Mapeando seu uso de IA</span><b>100%</b></p><div><i style={{width:'100%'}}/></div><p><span>Analisando sua maturidade</span><b>86%</b></p><div><i style={{width:'86%'}}/></div><p><span>Identificando seu próximo salto</span><b>72%</b></p><div><i style={{width:'72%'}}/></div></div><LoaderCircle className="spin"/><p className="muted center">Estamos cruzando suas respostas com os principais sinais de maturidade em IA aplicada à gestão de projetos.</p></div>}
      {step.kind==='email' && <div className="field-view"><h1>{step.title}</h1><input autoFocus type="email" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary big" disabled={!email.includes('@')} onClick={next}>Continuar</button><small>Ao continuar, você concorda em receber seu diagnóstico e conteúdos relacionados.</small></div>}
      {step.kind==='name' && <div className="field-view"><h1>{step.title}</h1><input autoFocus placeholder="Seu primeiro nome" value={name} onChange={e=>setName(e.target.value)}/><button className="primary big" disabled={!name || saving} onClick={saveLead}>{saving?'Salvando...':'Liberar meu diagnóstico'}</button>{saveError&&<div className="save-error">{saveError}</div>}<small>{supabaseEnabled?'Supabase configurado para receber os dados deste diagnóstico.':'Modo demonstração.'}</small></div>}
      {step.kind==='result' && <Result name={name} pct={result.pct} level={result.level} dimensions={result.dimensions}/>} 
    </div>
  </div>
}

function Result({name,pct,level,dimensions}:{name:string,pct:number,level:number,dimensions:Record<string,number>}){
  const copy=levelCopy[level as 1|2|3|4];
  const chartData = [
    ['Planejamento', dimensions.planejamento ?? 0],
    ['Riscos', dimensions.riscos ?? 0],
    ['Decisão', dimensions.decisao ?? 0],
    ['Comunicação', dimensions.comunicacao ?? 0],
    ['Automação', dimensions.automacao ?? 0],
    ['Confiança', dimensions.confianca ?? 0],
  ] as const;

  return <div className="result-view">
    <div className="result-kicker">Seu perfil de maturidade</div>
    <h1>{name?`${name}, `:''}você está no nível <span>{copy.name}</span></h1>
    <div className="score-card"><div className="gauge"><i style={{left:`calc(${pct}% - 10px)`}}/></div><div className="gauge-labels"><span>Explorador</span><span>Usuário</span><span>Aumentado</span><span>Orientado por IA</span></div><b className="score-number">{pct}%</b></div>
    <div className="result-copy"><h2>{copy.headline}</h2><p>{copy.next}</p></div>

    <section className="dimension-card">
      <div className="section-heading"><small>Seu mapa de maturidade</small><h2>Onde sua IA já gera valor — e onde ainda existe espaço para crescer</h2></div>
      <div className="dimension-bars">{chartData.map(([label,value])=><div className="dimension-row" key={label}><div className="dimension-meta"><span>{label}</span><b>{value}%</b></div><div className="dimension-track"><i style={{width:`${value}%`}}/></div></div>)}</div>
    </section>

    <section className="pmi-card">
      <small>Insight do PMBOK® 8ª edição</small>
      <h2>Seu próximo salto não é usar mais ferramentas. É usar IA com mais contexto, governança e intenção.</h2>
      <p>O guia atual coloca a IA dentro da realidade do gerenciamento de projetos: análise de dados, previsão de riscos, apoio à decisão, planejamento e automação. Ao mesmo tempo, reforça que a qualidade das entradas e a supervisão humana continuam determinantes para o resultado.</p>
    </section>

    <div className="offer-card">
      <div className="ebook-cover-real"><img src="https://allevotech.com.br/wp-content/uploads/2026/06/Capa-760.webp" alt="Capa do livro Gestão de Projetos com Inteligência Artificial, de Mario Trentim" /></div>
      <div className="offer-copy"><small>Recomendado para o seu momento</small><h2>Gestão de Projetos com Inteligência Artificial</h2><p>O livro de Mario Trentim mostra como aplicar IA em planejamento, riscos, comunicação, análise e tomada de decisão para conduzir projetos com mais inteligência e foco em valor.</p><button className="primary big" disabled title="Aguardando o link do checkout">Desbloquear acesso</button><a className="secondary big" href="https://trentim.com/livro-gestao-de-projetos-com-ia-perpetuo/" target="_blank" rel="noreferrer">Saiba mais</a></div>
    </div>
  </div>
}
