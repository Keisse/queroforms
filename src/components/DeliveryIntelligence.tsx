import { useMemo, useState } from 'react';
import type { Step } from '../data/gpIa';
import type { Submission } from '../lib/adminData';

const IDS = ['q29','ai-priority-activity','resource-preference','material-tool'] as const;
const TITLES: Record<string,string> = {
 q29:'Principais dificuldades', 'ai-priority-activity':'Prioridade imediata',
 'resource-preference':'Entregáveis mais desejados', 'material-tool':'Ferramentas e formatos preferidos'
};
type Props={rows:Submission[];versions:Record<number,Step[]>};
type Choice={id:string;label:string;count:number;pct:number};

export default function DeliveryIntelligence({rows,versions}:Props){
 const [campaign,setCampaign]=useState('all');
 const [version,setVersion]=useState('all');
 const campaigns=useMemo(()=>[...new Set(rows.map(r=>r.utm_campaign).filter((x):x is string=>Boolean(x)))].sort(),[rows]);
 const filtered=useMemo(()=>rows.filter(r=>(campaign==='all'||r.utm_campaign===campaign)&&(version==='all'||String(r.survey_version)===version)),[rows,campaign,version]);
 const groups=useMemo(()=>IDS.map(id=>{
  const counts=new Map<string,{label:string;count:number}>();
  let answered=0;
  for(const r of filtered){
   const step=(versions[r.survey_version]||[]).find(s=>s.kind==='question'&&s.id===id);
   const raw=r.answers?.[id];
   if(raw===undefined||raw===null||raw==='')continue;
   answered++;
   const vals=Array.isArray(raw)?raw:[raw];
   for(const v of vals){
    const value=String(v);
    const label=step?.kind==='question'?(step.options.find(o=>o.value===value)?.label||value):value;
    const key=label;
    const before=counts.get(key);
    counts.set(key,{label,count:(before?.count||0)+1});
   }
  }
  const choices:Choice[]=[...counts.values()].map(item=>({id:item.label,label:item.label,count:item.count,pct:answered?Math.round(item.count/answered*100):0})).sort((a,b)=>b.count-a.count);
  return {id,answered,choices};
 }),[filtered,versions]);
 const matrix=useMemo(()=>{
  const pairs=new Map<string,{pain:string;resource:string;count:number}>();
  for(const r of filtered){
   const steps=versions[r.survey_version]||[];
   const read=(id:string)=>{
    const value=r.answers?.[id];
    if(!value||Array.isArray(value))return '';
    const step=steps.find(s=>s.kind==='question'&&s.id===id);
    return step?.kind==='question'?(step.options.find(o=>o.value===value)?.label||value):value;
   };
   const pain=read('ai-priority-activity'), resource=read('resource-preference');
   if(!pain||!resource)continue;
   const key=JSON.stringify([pain,resource]);
   const existing=pairs.get(key);
   pairs.set(key,{pain,resource,count:(existing?.count||0)+1});
  }
  return [...pairs.values()].sort((a,b)=>b.count-a.count).slice(0,8);
 },[filtered,versions]);
 const download=()=>{
  const esc=(x:unknown)=>'"'+String(x??'').replace(/"/g,'""')+'"';
  const lines=[['Data','Versão','Campanha','Dificuldades','Prioridade','Entregável','Ferramenta'].map(esc).join(';')];
  for(const r of filtered){
   const steps=versions[r.survey_version]||[];
   const values=IDS.map(id=>{
    const step=steps.find(s=>s.kind==='question'&&s.id===id);
    const raw=r.answers?.[id];const vals=Array.isArray(raw)?raw:raw?[raw]:[];
    return vals.map(v=>step?.kind==='question'?(step.options.find(o=>o.value===v)?.label||v):v).join(' | ');
   });
   lines.push([r.created_at,r.survey_version,r.utm_campaign,...values].map(esc).join(';'));
  }
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='inteligencia-entregaveis.csv';a.click();URL.revokeObjectURL(url);
 };
 return <section className="question-analytics-section">
  <div className="question-analytics-title"><div><small>Pesquisa de demanda</small><h2>Inteligência de Entregáveis</h2><p>Preferências declaradas dos respondentes. Não são previsões de compra.</p></div><button className="btn" onClick={download} disabled={!filtered.length}>Exportar CSV</button></div>
  <div className="responses-toolbar">
   <select aria-label="Filtrar campanha" value={campaign} onChange={e=>setCampaign(e.target.value)}><option value="all">Todas as campanhas</option>{campaigns.map(c=><option key={c} value={c}>{c}</option>)}</select>
   <select aria-label="Filtrar versão" value={version} onChange={e=>setVersion(e.target.value)}><option value="all">Todas as versões</option>{[...new Set(rows.map(r=>r.survey_version))].sort((a,b)=>b-a).map(v=><option key={v} value={String(v)}>Versão {v}</option>)}</select>
   <span className="response-count">{filtered.length} respondentes</span>
  </div>
  <div className="question-analytics-grid">{groups.map(g=><article className="question-analysis-card" key={g.id}>
   <div className="question-analysis-head"><div><small>{g.answered} respostas</small><h3>{TITLES[g.id]}</h3></div></div>
   {!g.answered?<div className="question-no-data">Ainda não há respostas para esta pesquisa.</div>:<div className="question-bars">{g.choices.map(c=><div className="question-bar-row" key={c.id}><div className="question-bar-meta"><span>{c.label}</span><b>{c.count} · {c.pct}%</b></div><div className="question-bar-track"><i style={{width:c.pct+'%'}}/></div></div>)}{g.id==='q29'&&<small className="chart-note">Múltipla escolha: os percentuais podem somar mais de 100%.</small>}</div>}
  </article>)}</div>
  <section className="analysis-card"><div className="analysis-card-head"><div><small>Cruzamento</small><h2>Prioridade × Entregável desejado</h2></div></div>
  {matrix.length?<div className="question-bars">{matrix.map((item,i)=><div className="question-bar-row" key={i}><div className="question-bar-meta"><span>{item.pain} → {item.resource}</span><b>{item.count} pessoa(s)</b></div></div>)}</div>:<div className="question-no-data">O cruzamento ficará disponível quando chegarem respostas às duas perguntas.</div>}
  </section>
 </section>;
