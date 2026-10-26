import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw, Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WORKSHOP_SLUG, WORKSHOP_DASHBOARD_PATH, workshopCopy, publicPayloadIsSafe, activeQuestions, fourteenDays, optionPercent, type WorkshopAggregate, type AggregateQuestion } from '../lib/workshopDashboardModel';
import '../styles/workshopDashboard.css';
const nf=new Intl.NumberFormat('pt-BR');
function dateLabel(day:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`))}
function QuestionCard({question,total}:{question:AggregateQuestion;total:number}){
 const leading=[...question.options].sort((a,b)=>b.count-a.count)[0];
 return <article className="wd-question"><div className="wd-question-head"><div><small>{question.historical?'Pergunta anterior':`Pergunta ${question.position-2}`} · {question.input==='multi'?'Múltipla escolha':'Escolha única'}</small><h3>{workshopCopy(question.title)}</h3>{question.subtitle&&<p>{workshopCopy(question.subtitle)}</p>}</div><span className="wd-badge">{nf.format(question.answered)} resp.</span></div>
 <div className="wd-question-meta"><span>{optionPercent(question.answered,total)}% da base respondeu</span>{question.historical&&<span>Fora da versão atual</span>}</div>
 {leading&&leading.count>0&&<p className="wd-leading">Mais escolhido: <strong>{workshopCopy(leading.label)}</strong></p>}
 {question.answered===0&&<p className="wd-empty-inline">Ainda não há respostas para esta pergunta.</p>}
 <div className="wd-bars">{question.options.map(o=>{const pct=optionPercent(o.count,question.answered);return <div className="wd-bar" key={o.value}><div><span>{workshopCopy(o.label)}</span><b>{nf.format(o.count)} <small>· {pct}%</small></b></div><div className="wd-track" role="img" aria-label={`${o.label}: ${o.count} respostas, ${pct}%`}><i style={{width:`${Math.min(100,pct)}%`}}/></div></div>})}</div>
 {question.input==='multi'&&<small className="wd-footnote">Uma pessoa pode escolher mais de uma opção; a soma pode ultrapassar 100%.</small>}
 </article>
}
export default function WorkshopDashboard({embedded=false}:{embedded?:boolean}){
 const [data,setData]=useState<WorkshopAggregate|null>(null),[updated,setUpdated]=useState(''),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState(''),[history,setHistory]=useState(false);
 const request=useRef(0),mounted=useRef(true);
 const load=useCallback(async()=>{const id=++request.current;setRefreshing(true);try{const {data:row,error:failure}=await supabase.from('public_form_dashboards').select('payload,updated_at').eq('slug',WORKSHOP_SLUG).single();if(failure)throw failure;if(!publicPayloadIsSafe(row?.payload))throw new Error('Formato de dados indisponível.');if(mounted.current&&id===request.current){setData(row.payload);setUpdated(row.updated_at);setError('')}}catch{if(mounted.current&&id===request.current)setError('Não foi possível atualizar os resultados. Tente novamente.')}finally{if(mounted.current&&id===request.current){setLoading(false);setRefreshing(false)}}},[]);
 useEffect(()=>{mounted.current=true;void load();const timer=window.setInterval(()=>void load(),60000);return()=>{mounted.current=false;request.current++;window.clearInterval(timer)}},[load]);
 useEffect(()=>{if(!embedded)document.title='Perfil dos alunos do Workshop | Quero Forms'},[embedded]);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const days=useMemo(()=>data?fourteenDays(data.daily,today):[],[data,today]);
 const current=data?activeQuestions(data):[];
 const filtered=(data?.questions||[]).filter(q=>(history||!q.historical)&&workshopCopy(`${q.title} ${q.options.map(o=>o.label).join(' ')}`).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
 const top=(id:string)=>{const q=data?.questions.find(q=>q.id===id);const o=q?.options.reduce<(typeof q.options)[number]|undefined>((best,o)=>!best||o.count>best.count?o:best,undefined);return q&&o&&o.count>0?{label:o.label,pct:optionPercent(o.count,q.answered),answered:q.answered}:null};
 const insights=[['Objetivo de carreira','career-goal'],['Principal obstáculo','career-obstacle'],['Apoio mais desejado','career-delivery']].map(([label,id])=>({label,value:top(id)}));
 const maxDay=Math.max(1,...days.map(d=>d.count));
 return <div className={`workshop-dashboard${embedded?' wd-embedded':''}`}><div className="wd-container">
 {!embedded&&<header className="wd-brand"><a href={WORKSHOP_DASHBOARD_PATH}><span>Q</span>Quero Forms</a><div className="wd-public-tag">Dashboard público · Dados agregados</div></header>}
 <header className="wd-hero"><div><div className="wd-kicker">WORKSHOP · 21 DE NOVEMBRO DE 2026</div><h1>Perfil dos alunos</h1><p>Momento profissional, desafios e expectativas de quem preencheu a ficha do Workshop Gestor de projetos de alto valor com IA.</p></div><div className="wd-actions"><button onClick={()=>void load()} disabled={refreshing}><RefreshCw size={16} className={refreshing?'wd-spinning':''}/> {refreshing?'Atualizando…':'Atualizar'}</button>{embedded&&<a href={WORKSHOP_DASHBOARD_PATH} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Abrir dashboard público</a>}</div></header>
 <p className="wd-privacy">Somente quantidades e percentuais. Nomes, e-mails e respostas individuais ficam restritos ao Builder.</p>
 {error&&<div className="wd-error" role="alert">{error} {data&&'Os últimos resultados carregados continuam visíveis.'}</div>}
 {loading?<div className="wd-loading" role="status">Carregando resultados do formulário…</div>:!data?<div className="wd-loading">Resultados indisponíveis. <button onClick={()=>void load()}>Tentar novamente</button></div>:<>
 <section className="wd-metrics" aria-label="Indicadores do formulário"><article><Users size={20}/><span>Fichas enviadas</span><strong>{nf.format(data.total)}</strong><small>Todos os envios registrados</small></article><article><BarChart3 size={20}/><span>Últimos 7 dias</span><strong>{nf.format(days.slice(-7).reduce((n,d)=>n+d.count,0))}</strong><small>Horário de Brasília</small></article><article><span>Perguntas ativas</span><strong>{current.length}</strong><small>Na versão atual da ficha</small></article><article><span>Versão publicada</span><strong>v{data.version}</strong><small>Histórico de perguntas preservado</small></article></section>
 {data.total===0&&<div className="wd-empty">A ficha está pronta para receber respostas. Os gráficos serão preenchidos automaticamente após o primeiro envio.</div>}
 <section className="wd-insights" aria-label="Prioridades mais frequentes">{insights.map(item=><article key={item.label}><small>{item.label}</small><h2>{item.value?workshopCopy(item.value.label):'Aguardando respostas'}</h2><p>{item.value?`${item.value.pct}% entre ${item.value.answered} resposta${item.value.answered===1?'':'s'} à pergunta.`:'As escolhas dos alunos aparecerão aqui.'}</p></article>)}</section>
 <section className="wd-trend"><div><small>Volume de respostas</small><h2>Envios nos últimos 14 dias</h2></div><div className="wd-daily">{days.map(d=><div className="wd-day" key={d.day}><b>{d.count}</b><div className="wd-day-track"><i style={{height:`${d.count/maxDay*100}%`}}/></div><small>{dateLabel(d.day)}</small></div>)}</div><details><summary>Ver números por dia</summary><table><thead><tr><th>Data</th><th>Fichas enviadas</th></tr></thead><tbody>{days.map(d=><tr key={d.day}><td>{dateLabel(d.day)}</td><td>{d.count}</td></tr>)}</tbody></table></details></section>
 <section className="wd-results-head"><div><small>Análise das respostas</small><h2>Resultados por pergunta</h2><p>Os percentuais usam a base de pessoas que responderam cada pergunta.</p></div><div className="wd-filters"><label className="wd-search"><Search size={16}/><input aria-label="Buscar pergunta ou opção" placeholder="Buscar pergunta ou opção" value={search} onChange={e=>setSearch(e.target.value)}/></label>{data.questions.some(q=>q.historical)&&<label className="wd-history"><input type="checkbox" checked={history} onChange={e=>setHistory(e.target.checked)}/> Incluir perguntas anteriores</label>}</div></section>
 <div className="wd-question-grid">{filtered.map(q=><QuestionCard key={q.id} question={q} total={data.total}/>)}</div>{!filtered.length&&<div className="wd-empty">Nenhuma pergunta encontrada.</div>}
 <footer className="wd-footer"><span>Quero Forms · Atualização automática a cada minuto</span><span>Dados consolidados em {new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(updated))} · Brasília</span></footer>
 </>}
 </div></div>
}
