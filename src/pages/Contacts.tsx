import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Search, Trash2, X } from 'lucide-react';
import { deleteSubmissions, fetchAllSubmissions, fetchSurveySummaries, type Submission, type SurveySummary } from '../lib/adminData';

type ContactRow={
  key:string;
  name:string|null;
  email:string|null;
  source:string|null;
  created_at:string;
  submissionIds:string[];
  surveySlugs:string[];
  surveyNames:string[];
  submissions:Submission[];
};

function formatDate(value:string){
  return new Intl.DateTimeFormat('pt-BR',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  }).format(new Date(value));
}

function csvEscape(value:unknown){
  return `"${String(value??'').replace(/"/g,'""')}"`;
}

function toContacts(rows:Submission[],surveyNames:Map<string,string>):ContactRow[]{
  const map=new Map<string,ContactRow>();
  for(const row of rows){
    const normalizedEmail=(row.email||'').trim().toLowerCase();
    const key=normalizedEmail?`email:${normalizedEmail}`:`submission:${row.id}`;
    const surveyName=surveyNames.get(row.survey_slug)||row.survey_slug;
    const current=map.get(key);
    if(!current){
      map.set(key,{
        key,name:row.name,email:row.email,source:row.source,created_at:row.created_at,
        submissionIds:[row.id],surveySlugs:[row.survey_slug],surveyNames:[surveyName],submissions:[row]
      });
      continue;
    }
    current.submissionIds.push(row.id);
    current.submissions.push(row);
    if(!current.surveySlugs.includes(row.survey_slug))current.surveySlugs.push(row.survey_slug);
    if(!current.surveyNames.includes(surveyName))current.surveyNames.push(surveyName);
    if(!current.name&&row.name)current.name=row.name;
    if(new Date(row.created_at).getTime()>new Date(current.created_at).getTime()){
      current.created_at=row.created_at;
      current.source=row.source;
      if(row.name)current.name=row.name;
    }
  }
  return Array.from(map.values()).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
}

function exportContactsCsv(rows:ContactRow[],fileLabel='contatos'){
  const header=['Nome','E-mail','Diagnósticos','Origem','Última resposta','Qtd. respostas'];
  const lines=rows.map(row=>[
    row.name||'',row.email||'',row.surveyNames.join(' | '),row.source||'direct',formatDate(row.created_at),row.submissionIds.length
  ].map(csvEscape).join(','));
  const csv=`\uFEFF${[header.map(csvEscape).join(','),...lines].join('\n')}`;
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=`${fileLabel}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Contacts(){
  const [submissions,setSubmissions]=useState<Submission[]>([]);
  const [surveys,setSurveys]=useState<SurveySummary[]>([]);
  const [search,setSearch]=useState('');
  const [diagnosticFilter,setDiagnosticFilter]=useState('all');
  const [sourceFilter,setSourceFilter]=useState('all');
  const [dateFilter,setDateFilter]=useState('all');
  const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [deleting,setDeleting]=useState(false);

  useEffect(()=>{
    let active=true;
    Promise.all([fetchAllSubmissions(5000),fetchSurveySummaries()])
      .then(([snapshot,surveyRows])=>{
        if(!active)return;
        setSubmissions(snapshot.rows);
        setSurveys(surveyRows);
      })
      .catch(err=>{if(active)setError(err instanceof Error?err.message:'Não foi possível carregar os contatos.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const surveyNameMap=useMemo(()=>new Map(surveys.map(survey=>[survey.slug,survey.name])),[surveys]);
  const contacts=useMemo(()=>toContacts(submissions,surveyNameMap),[submissions,surveyNameMap]);
  const sources=useMemo(()=>Array.from(new Set(submissions.map(row=>row.source||'direct'))).sort(),[submissions]);

  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    const now=Date.now();
    const cutoff=dateFilter==='7d'?now-7*24*60*60*1000:dateFilter==='30d'?now-30*24*60*60*1000:null;
    return contacts.filter(row=>{
      const matchesSearch=!term||[row.name,row.email,row.source,...row.surveyNames].some(value=>String(value||'').toLowerCase().includes(term));
      const matchesDiagnostic=diagnosticFilter==='all'||row.surveySlugs.includes(diagnosticFilter);
      const matchesSource=sourceFilter==='all'||(row.source||'direct')===sourceFilter;
      const matchesDate=cutoff===null||new Date(row.created_at).getTime()>=cutoff;
      return matchesSearch&&matchesDiagnostic&&matchesSource&&matchesDate;
    });
  },[contacts,search,diagnosticFilter,sourceFilter,dateFilter]);

  const visibleKeys=filtered.map(row=>row.key);
  const allVisibleSelected=visibleKeys.length>0&&visibleKeys.every(key=>selectedKeys.includes(key));
  const selectedCount=selectedKeys.length;
  const hasFilters=Boolean(search)||diagnosticFilter!=='all'||sourceFilter!=='all'||dateFilter!=='all';

  const toggleRow=(key:string)=>{
    setSelectedKeys(current=>current.includes(key)?current.filter(item=>item!==key):[...current,key]);
  };

  const toggleAll=()=>{
    if(allVisibleSelected){
      setSelectedKeys(current=>current.filter(key=>!visibleKeys.includes(key)));
    }else{
      setSelectedKeys(current=>Array.from(new Set([...current,...visibleKeys])));
    }
  };

  const clearFilters=()=>{
    setSearch('');setDiagnosticFilter('all');setSourceFilter('all');setDateFilter('all');
  };

  const removeOne=async(row:ContactRow)=>{
    const label=row.name||row.email||'este contato';
    if(!window.confirm(`Excluir ${label}?\n\nEsta ação remove definitivamente este contato e todas as respostas dele do Supabase.`))return;
    setDeleting(true);setError('');
    try{
      await deleteSubmissions(row.submissionIds);
      const removed=new Set(row.submissionIds);
      setSubmissions(current=>current.filter(item=>!removed.has(item.id)));
      setSelectedKeys(current=>current.filter(key=>key!==row.key));
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível excluir o contato.');
    }finally{setDeleting(false);}
  };

  const removeSelected=async()=>{
    if(!selectedCount)return;
    const selectedSet=new Set(selectedKeys);
    const submissionIds=contacts.filter(row=>selectedSet.has(row.key)).flatMap(row=>row.submissionIds);
    if(!window.confirm(`Excluir ${selectedCount} contato${selectedCount===1?'':'s'} selecionado${selectedCount===1?'':'s'}?\n\nEsta ação é definitiva e também remove todas as respostas correspondentes do Supabase.`))return;
    setDeleting(true);setError('');
    try{
      await deleteSubmissions(submissionIds);
      const removed=new Set(submissionIds);
      setSubmissions(current=>current.filter(item=>!removed.has(item.id)));
      setSelectedKeys([]);
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível excluir os contatos selecionados.');
    }finally{setDeleting(false);}
  };

  if(loading)return <div className="contacts-loading">Carregando contatos...</div>;

  return <>
    <header className="page-head contacts-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Contatos</h1><p>Leads únicos capturados por todos os diagnósticos e salvos no Supabase.</p></div>
      <div className="contacts-head-actions">
        <button className="btn" onClick={()=>exportContactsCsv(filtered,'contatos-filtrados')} disabled={!filtered.length}><Download size={17}/> Exportar CSV</button>
        <div className="contacts-total"><strong>{contacts.length}</strong><span>contato{contacts.length===1?'':'s'}</span></div>
      </div>
    </header>

    {error&&<div className="contacts-error">{error}</div>}

    <section className="contacts-card">
      <div className="contacts-toolbar contacts-toolbar-main">
        <div className="contacts-search"><Search size={17}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, origem ou diagnóstico"/></div>
        {selectedCount>0&&<button className="contacts-delete-selected" onClick={removeSelected} disabled={deleting}><Trash2 size={16}/>{deleting?'Excluindo...':`Excluir selecionados (${selectedCount})`}</button>}
      </div>

      <div className="contacts-filters">
        <div className="contacts-filter-label"><Filter size={16}/><span>Filtros</span></div>
        <select value={diagnosticFilter} onChange={event=>setDiagnosticFilter(event.target.value)}>
          <option value="all">Todos os diagnósticos</option>
          {surveys.map(survey=><option key={survey.slug} value={survey.slug}>{survey.name}</option>)}
        </select>
        <select value={sourceFilter} onChange={event=>setSourceFilter(event.target.value)}>
          <option value="all">Todas as origens</option>
          {sources.map(source=><option key={source} value={source}>{source}</option>)}
        </select>
        <select value={dateFilter} onChange={event=>setDateFilter(event.target.value)}>
          <option value="all">Todo o período</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </select>
        {hasFilters&&<button className="contacts-clear-filters" onClick={clearFilters}><X size={15}/> Limpar filtros</button>}
        <span className="contacts-filter-result">{filtered.length} contato{filtered.length===1?'':'s'} exibido{filtered.length===1?'':'s'}</span>
      </div>

      <div className="contacts-table-wrap">
        <table className="contacts-table">
          <thead><tr>
            <th className="contacts-check"><input type="checkbox" aria-label="Selecionar todos os contatos visíveis" checked={allVisibleSelected} onChange={toggleAll}/></th>
            <th>Nome</th><th>E-mail</th><th>Diagnóstico</th><th>Origem</th><th>Última resposta</th><th className="contacts-action">Ação</th>
          </tr></thead>
          <tbody>
            {filtered.map(row=>{
              const selected=selectedKeys.includes(row.key);
              return <tr key={row.key} className={selected?'selected':''}>
                <td className="contacts-check"><input type="checkbox" aria-label={`Selecionar ${row.name||row.email||'contato'}`} checked={selected} onChange={()=>toggleRow(row.key)}/></td>
                <td><strong>{row.name||'Sem nome'}</strong></td>
                <td>{row.email||'Sem e-mail'}</td>
                <td><div className="contacts-diagnostics">{row.surveyNames.map(name=><span key={name}>{name}</span>)}</div></td>
                <td>{row.source||'direct'}</td>
                <td>{formatDate(row.created_at)}</td>
                <td className="contacts-action"><button className="contacts-row-delete" onClick={()=>removeOne(row)} disabled={deleting} title="Excluir contato"><Trash2 size={17}/></button></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!filtered.length&&<div className="contacts-empty">Nenhum contato encontrado com os filtros atuais.</div>}
      </div>
    </section>
  </>;
}
