import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { deleteSubmissions, fetchSubmissions, type Submission } from '../lib/adminData';

type ContactRow={
  key:string;
  name:string|null;
  email:string|null;
  source:string|null;
  created_at:string;
  submissionIds:string[];
};

function formatDate(value:string){
  return new Intl.DateTimeFormat('pt-BR',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  }).format(new Date(value));
}

function toContacts(rows:Submission[]):ContactRow[]{
  const map=new Map<string,ContactRow>();
  for(const row of rows){
    const normalizedEmail=(row.email||'').trim().toLowerCase();
    const key=normalizedEmail?`email:${normalizedEmail}`:`submission:${row.id}`;
    const current=map.get(key);
    if(!current){
      map.set(key,{key,name:row.name,email:row.email,source:row.source,created_at:row.created_at,submissionIds:[row.id]});
      continue;
    }
    current.submissionIds.push(row.id);
    if(!current.name&&row.name)current.name=row.name;
    if(new Date(row.created_at).getTime()>new Date(current.created_at).getTime()){
      current.created_at=row.created_at;
      current.source=row.source;
      if(row.name)current.name=row.name;
    }
  }
  return Array.from(map.values()).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
}

export default function Contacts(){
  const [submissions,setSubmissions]=useState<Submission[]>([]);
  const [search,setSearch]=useState('');
  const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [deleting,setDeleting]=useState(false);

  useEffect(()=>{
    let active=true;
    fetchSubmissions('gp-ia',2000)
      .then(snapshot=>{if(active)setSubmissions(snapshot.rows);})
      .catch(err=>{if(active)setError(err instanceof Error?err.message:'Não foi possível carregar os contatos.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const contacts=useMemo(()=>toContacts(submissions),[submissions]);
  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    if(!term)return contacts;
    return contacts.filter(row=>[row.name,row.email,row.source].some(value=>String(value||'').toLowerCase().includes(term)));
  },[contacts,search]);

  const visibleKeys=filtered.map(row=>row.key);
  const allVisibleSelected=visibleKeys.length>0&&visibleKeys.every(key=>selectedKeys.includes(key));
  const selectedCount=selectedKeys.length;

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
      <div><div className="crumb">Keisse › My workspace</div><h1>Contatos</h1><p>Leads únicos capturados pelos diagnósticos e salvos no Supabase.</p></div>
      <div className="contacts-total"><strong>{contacts.length}</strong><span>contato{contacts.length===1?'':'s'}</span></div>
    </header>

    {error&&<div className="contacts-error">{error}</div>}

    <section className="contacts-card">
      <div className="contacts-toolbar">
        <div className="contacts-search"><Search size={17}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou origem"/></div>
        {selectedCount>0&&<button className="contacts-delete-selected" onClick={removeSelected} disabled={deleting}><Trash2 size={16}/>{deleting?'Excluindo...':`Excluir selecionados (${selectedCount})`}</button>}
      </div>

      <div className="contacts-table-wrap">
        <table className="contacts-table">
          <thead><tr>
            <th className="contacts-check"><input type="checkbox" aria-label="Selecionar todos os contatos visíveis" checked={allVisibleSelected} onChange={toggleAll}/></th>
            <th>Nome</th><th>E-mail</th><th>Origem</th><th>Última resposta</th><th className="contacts-action">Ação</th>
          </tr></thead>
          <tbody>
            {filtered.map(row=>{
              const selected=selectedKeys.includes(row.key);
              return <tr key={row.key} className={selected?'selected':''}>
                <td className="contacts-check"><input type="checkbox" aria-label={`Selecionar ${row.name||row.email||'contato'}`} checked={selected} onChange={()=>toggleRow(row.key)}/></td>
                <td><strong>{row.name||'Sem nome'}</strong></td>
                <td>{row.email||'Sem e-mail'}</td>
                <td>{row.source||'direct'}</td>
                <td>{formatDate(row.created_at)}</td>
                <td className="contacts-action"><button className="contacts-row-delete" onClick={()=>removeOne(row)} disabled={deleting} title="Excluir contato"><Trash2 size={17}/></button></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!filtered.length&&<div className="contacts-empty">Nenhum contato encontrado.</div>}
      </div>
    </section>
  </>;
}
