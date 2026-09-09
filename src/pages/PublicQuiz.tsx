import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Check, Sparkles, Users } from 'lucide-react';
import { levelCopy, projectSalary, salaryMidpoints, scoreResult, Step } from '../data/gpIa';
import { loadSteps } from '../lib/stepsStore';
import { fetchPublishedSteps } from '../lib/surveyConfig';
import { supabase, supabaseEnabled } from '../lib/supabase';

function stepsFromSurveyRecord(record: unknown): Step[] | null {
  const config = (record as { config?: Record<string, unknown> } | null)?.config;
  const steps = config?.steps;
  return Array.isArray(steps) && steps.length ? (steps as Step[]) : null;
}

function introHeading(title: string){
  const marker='cloud certificado.';
  const pos=title.toLowerCase().indexOf(marker);
  if(pos<0) return title;
  return <>{title.slice(0,pos)}<span>{title.slice(pos)}</span></>;
}

export default function PublicQuiz(){
  const [steps,setSteps]=useState<Step[]|null>(null);
  const [idx,setIdx]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string|string[]>>({});
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');

  useEffect(()=>{
    let active=true;

    const applyPublishedSteps=(next:Step[]|null, fallback=false)=>{
      if(!active) return;
      const resolved=next ?? (fallback ? loadSteps() : null);
      if(!resolved?.length) return;
      setSteps(resolved);
      setIdx(current=>Math.min(current,resolved.length-1));
    };

    const refresh=()=>{
      fetchPublishedSteps('gp-ia').then(remote=>applyPublishedSteps(remote,true));
    };

    refresh();

    const channel=supabase
      .channel('public-survey-gp-ia')
      .on(
        'postgres_changes',
        {event:'UPDATE',schema:'public',table:'surveys',filter:'slug=eq.gp-ia'},
        payload=>applyPublishedSteps(stepsFromSurveyRecord(payload.new))
      )
      .subscribe();

    const onFocus=()=>refresh();
    window.addEventListener('focus',onFocus);

    return ()=>{
      active=false;
      window.removeEventListener('focus',onFocus);
      void supabase.removeChannel(channel);
    };
  },[]);

  const result=useMemo(()=>steps?scoreResult(steps,answers):{pct:0,level:1,dimensions:{} as Record<string,number>},[steps,answers]);

  if(!steps) return <div className="quiz-wrap"><div className="quiz-stage" style={{textAlign:'center',paddingTop:100,color:'#7a8b9c'}}>Carregando diagnóstico...</div></div>;

  const step=steps[idx];
  const progress=Math.round(((idx+1)/steps.length)*100);
  const next=()=>setIdx(i=>Math.min(i+1,steps.length-1));
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

  const chooseCloud=(value:'sim'|'nao')=>{
    setAnswers(current=>({...current,'cloud-use':value}));
    next();
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
    <div className="quiz-top"><button onClick={back} disabled={idx===0}><ArrowLeft/></button><div className="quiz-logo">Diagnóstico de Maturidade</div><div className="counter">{step.kind==='intro'?'':`${idx+1}/${steps.length}`}</div></div>
    <div className="quiz-progress"><span style={{width:`${progress}%`}}/></div>
    <div className="quiz-stage">
      {step.kind==='branch' && (()=>{
        const variant = step.variants[(answers['cloud-use'] as string) || 'sim'] || Object.values(step.variants)[0];
        return <div className="intro-card branch-view">
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
      {step.kind==='intro' && <div className="intro-card intro-certificate-screen">
        <div className="certificate-image-wrap">
          <img className="certificate-image" src="https://trentim.com/wp-content/uploads/2026/09/Imagem-do-Certificado.png" alt="Certificado Gestão de Projetos com IA - Formação Mestre GP" loading="eager" decoding="async" />
        </div>
        <h1>{introHeading(step.title)}</h1>
        <p className="intro-question">{step.body}</p>
        <div className="intro-choice-row">
          <button className="primary intro-choice" onClick={()=>chooseCloud('sim')}>Sim <span>→</span></button>
          <button className="primary intro-choice" onClick={()=>chooseCloud('nao')}>Não <span>→</span></button>
        </div>
      </div>}
      {step.kind==='question' && step.layout==='photo' && <div className="question-view"><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className="photo-choice-row">{step.options.map(o=>{const selected=answers[step.id]===o.value;return <button key={o.value} className={`photo-choice ${selected?'selected':''}`} onClick={()=>select(step,o.value)}><div className="photo-choice-art">{o.photo==='female'?<img src="/avatars/woman.webp" alt="Feminino"/>:<img src="/avatars/man.webp" alt="Masculino"/>}</div><span>{o.label}</span></button>})}</div></div>}
      {step.kind==='question' && step.layout!=='photo' && <div className="question-view"><h1>{step.title}</h1>{step.subtitle&&<p className="muted center">{step.subtitle}</p>}<div className={step.input==='scale'?'scale-row':'answer-stack'}>{step.options.map(o=>{const val=answers[step.id];const selected=Array.isArray(val)?val.includes(o.value):val===o.value;return <button className={`answer ${selected?'selected':''}`} key={o.value} onClick={()=>select(step,o.value)}><span>{o.emoji}</span><span className="answer-label">{o.label}</span>{step.input==='multi'&&<i>{selected?<Check size={18}/>:''}</i>}</button>})}</div>{step.input==='multi'&&<button className="primary big" onClick={next}>Continuar</button>}</div>}
      {step.kind==='insight' && <div className="insight-view"><div className="insight-visual">{step.visual==='chart'?<BarChart3 size={54}/>:step.visual==='people'?<Users size={54}/>:<Sparkles size={54}/>}</div><small>{step.eyebrow}</small><h1>{step.title}</h1><p>{step.body}</p>
        {step.chart && <div className="insight-chart">{step.chart.map(bar=><div className="insight-bar-row" key={bar.label}><div className="insight-bar-meta"><span>{bar.label}</span><b>{bar.suffix}</b></div><div className="insight-bar-track"><i className={bar.highlight?'highlight':''} style={{width:`${bar.value}%`}}/></div></div>)}</div>}
        {step.icons && <div className="insight-icons">{step.icons.map(item=><div className="insight-icon-row" key={item.text}><span>{item.emoji}</span><p>{item.text}</p></div>)}</div>}
        {step.stat && <div className="stat-box">{step.stat}</div>}
        {step.source&&<div className="source-note">Fonte: {step.source}</div>}
        <button className="primary big" onClick={next}>Continuar</button></div>}
      {step.kind==='processing' && <div className="processing-view"><h1>{step.title}</h1><div className="process-lines"><p><span>Mapeando seu uso de IA</span><b>100%</b></p><div><i style={{width:'100%'}}/></div><p><span>Analisando sua maturidade</span><b>86%</b></p><div><i style={{width:'86%'}}/></div><p><span>Identificando seu próximo salto</span><b>72%</b></p><div><i style={{width:'72%'}}/></div></div><p className="muted center">Cruzamos suas respostas com os principais sinais de maturidade em IA aplicada à gestão de projetos.</p><button className="primary big" onClick={next}>Ver resultado</button></div>}
      {step.kind==='email' && <div className="field-view"><h1>{step.title}</h1><input autoFocus type="email" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary big" disabled={!email.includes('@')} onClick={next}>Continuar</button><small>Ao continuar, você concorda em receber seu diagnóstico e conteúdos relacionados.</small></div>}
      {step.kind==='name' && <div className="field-view"><h1>{step.title}</h1><input autoFocus placeholder="Seu primeiro nome" value={name} onChange={e=>setName(e.target.value)}/><button className="primary big" disabled={!name || saving} onClick={saveLead}>{saving?'Salvando...':'Liberar meu diagnóstico'}</button>{saveError&&<div className="save-error">{saveError}</div>}<small>{supabaseEnabled?'Supabase configurado para receber os dados deste diagnóstico.':'Modo demonstração.'}</small></div>}
      {step.kind==='result' && <Result name={name} pct={result.pct} level={result.level} dimensions={result.dimensions} salaryRange={answers['salary-range'] as string|undefined}/>} 
    </div>
  </div>
}

function Result({name,pct,level,dimensions,salaryRange}:{name:string,pct:number,level:number,dimensions:Record<string,number>,salaryRange?:string}){
  const copy=levelCopy[level as 1|2|3|4];
  const chartData = [
    ['Planejamento', dimensions.planejamento ?? 0],
    ['Riscos', dimensions.riscos ?? 0],
    ['Decisão', dimensions.decisao ?? 0],
    ['Comunicação', dimensions.comunicacao ?? 0],
    ['Automação', dimensions.automacao ?? 0],
    ['Confiança', dimensions.confianca ?? 0],
  ] as const;
  const baseline = salaryRange ? salaryMidpoints[salaryRange] : undefined;
  const projection = baseline ? projectSalary(baseline) : null;
  const fmt = (n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});

  return <div className="result-view">
    <div className="result-kicker">Seu perfil de maturidade</div>
    <h1>{name?`${name}, `:''}você está no nível <span>{copy.name}</span></h1>
    <div className="score-card"><div className="gauge"><i style={{left:`calc(${pct}% - 10px)`}}/></div><div className="gauge-labels"><span>Explorador</span><span>Usuário</span><span>Aumentado</span><span>Orientado por IA</span></div><b className="score-number">{pct}%</b></div>
    <div className="result-copy"><h2>{copy.headline}</h2><p>{copy.next}</p></div>

    <section className="dimension-card">
      <div className="section-heading"><small>Seu mapa de maturidade</small><h2>Onde sua IA já gera valor e onde ainda existe espaço para crescer</h2></div>
      <div className="dimension-bars">{chartData.map(([label,value])=><div className="dimension-row" key={label}><div className="dimension-meta"><span>{label}</span><b>{value}%</b></div><div className="dimension-track"><i style={{width:`${value}%`}}/></div></div>)}</div>
    </section>

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
  </div>
}
