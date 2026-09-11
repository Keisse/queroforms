import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { deleteSubmission, deleteSubmissions, fetchSubmissions, type Submission } from '../lib/adminData';

function formatDate(value:string){
  return new Intl.DateTimeFormat('pt-BR',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  }).format(new Date(value));
}

export default function Contacts(){
  const [rows,setRows]=useState<Submission[]>([]);
  const [search,setSearch]=useState('');
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [deleting,setDeleting]=useState(false);

  useEffect(()=>{
    let active=true;
    fetchSubmissions('gp-ia',2000)
      .then(snapshot=>{if(active)setRows(snapshot.rows);})
      .catch(err=>{if(active)setError(err instanceof Error?err.message:'Não foi possível carregar os contatos.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    if(!term)return rows;
    return rows.filter(row=>[row.name,row.email,row.source].some(value=>String(value||'').toLowerCase().includes(term)));
  },[rows,search]);

  const visibleIds=filtered.map(row=>row.id);
  const allVisibleSelected=visibleIds.length>0&&visibleIds.every(id=>selectedIds.includes(id));
  const selectedCount=selectedIds.length;

  const toggleRow=(id:string)=>{
    setSelectedIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  };

  const toggleAll=()=>{
    if(allVisibleSelected){
      setSelectedIds(current=>current.filter(id=>!visibleIds.includes(id)));
    }else{
      setSelectedIds(current=>Array.from(new Set([...current,...visibleIds])));
    }
  };

  const removeOne=async(row:Submission)=>{
    const label=row.name||row.email||'este contato';
    if(!window.confirm(`Excluir ${label}?\n\nEsta ação remove definitivamente este contato e suas respostas do Supabase.`))return;
    setDeleting(true);setError('');
    try{
      await deleteSubmission(row.id);
      setRows(current=>current.filter(item=>item.id!==row.id));
      setSelectedIds(current=>current.filter(id=>id!==row.id));
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível excluir o contato.');
    }finally{setDeleting(false);}
  };

  const removeSelected=async()=>{
    if(!selectedCount)return;
    if(!window.confirm(`Excluir ${selectedCount} contato${selectedCount===1?'':'s'} selecionado${selectedCount===1?'':'s'}?\n\nEsta ação é definitiva e também remove as respostas correspondentes do Supabase.`))return;
    setDeleting(true);setError('');
    try{
      await deleteSubmissions(selectedIds);
      const selectedSet=new Set(selectedIds);
      setRows(current=>current.filter(item=>!selectedSet.has(item.id)));
      setSelectedIds([]);
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível excluir os contatos selecionados.');
    }finally{setDeleting(false);}
  };

  if(loading)return <div className="contacts-loading">Carregando contatos...</div>;

  return <>
    <header className="page-head contacts-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Contatos</h1><p>Leads capturados pelos diagnósticos e salvos no Supabase.</p></div>
      <div className="contacts-total"><strong>{rows.length}</strong><span>contato{rows.length===1?'':'s'}</span></div>
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
            <th>Nome</th><th>E-mail</th><th>Origem</th><th>Data</th><th className="contacts-action">Ação</th>
          </tr></thead>
          <tbody>
            {filtered.map(row=>{
              const selected=selectedIds.includes(row.id);
              return <tr key={row.id} className={selected?'selected':''}>
                <td className="contacts-check"><input type="checkbox" aria-label={`Selecionar ${row.name||row.email||'contato'}`} checked={selected} onChange={()=>toggleRow(row.id)}/></td>
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
