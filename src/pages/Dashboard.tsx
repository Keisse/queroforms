import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, Gauge, Plus, Users } from 'lucide-react';
import { fetchSubmissions, Submission } from '../lib/adminData';

const levelNames: Record<number, string> = {
  1: 'Explorador',
  2: 'Usuário',
  3: 'Aumentado',
  4: 'Orientado por IA',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export default function Dashboard(){
  const [rows,setRows]=useState<Submission[]>([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    fetchSubmissions('gp-ia',2000)
      .then(snapshot=>{if(!active)return;setRows(snapshot.rows);setTotal(snapshot.totalCount);})
      .catch(err=>{if(!active)return;setError(err instanceof Error?err.message:'Falha ao carregar o dashboard.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const averageScore=useMemo(()=>{
    const scores=rows.map(r=>r.score).filter((v):v is number=>typeof v==='number');
    return scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
  },[rows]);

  const last7Days=useMemo(()=>{
    const cutoff=Date.now()-7*24*60*60*1000;
    return rows.filter(r=>new Date(r.created_at).getTime()>=cutoff).length;
  },[rows]);

  const topLevel=useMemo(()=>{
    const counts=new Map<number,number>();
    rows.forEach(r=>{if(r.level)counts.set(r.level,(counts.get(r.level)||0)+1);});
    const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
    return winner?levelNames[winner[0]]:'—';
  },[rows]);

  return <>
    <header className="page-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Dashboard</h1><p className="page-subtitle">Visão executiva do Diagnóstico de Maturidade em IA para Gestão de Projetos.</p></div>
      <Link className="btn dark" to="/builder/gp-ia"><Plus size={17}/> Abrir Builder</Link>
    </header>

    {loading&&<div className="analytics-loading">Carregando indicadores...</div>}
    {error&&<div className="analytics-error"><b>Não foi possível carregar os indicadores.</b><span>{error}</span></div>}

    {!loading&&!error&&<>
      <section className="metric-grid dashboard-metrics">
        <article className="metric-card"><div className="metric-icon"><Users size={19}/></div><span>Respostas concluídas</span><strong>{total}</strong><small>Total gravado no Supabase</small></article>
        <article className="metric-card"><div className="metric-icon"><Gauge size={19}/></div><span>Score médio</span><strong>{averageScore}%</strong><small>Maturidade média dos respondentes</small></article>
        <article className="metric-card"><div className="metric-icon"><ClipboardList size={19}/></div><span>Últimos 7 dias</span><strong>{last7Days}</strong><small>Novas respostas no período</small></article>
        <article className="metric-card"><div className="metric-icon"><BarChart3 size={19}/></div><span>Nível mais frequente</span><strong className="metric-text-value">{topLevel}</strong><small>Entre as respostas carregadas</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="analysis-card">
          <div className="analysis-card-head"><div><small>Diagnóstico ativo</small><h2>Maturidade em IA para Gestão de Projetos</h2></div><span className="status live">● Publicado</span></div>
          <div className="dashboard-actions">
            <Link className="btn dark" to="/builder/gp-ia">Editar no Builder</Link>
            <Link className="btn" to="/analytics">Ver análises</Link>
            <a className="btn" href="/d/gp-ia" target="_blank" rel="noreferrer">Abrir diagnóstico público</a>
          </div>
        </article>

        <article className="analysis-card recent-card">
          <div className="analysis-card-head"><div><small>Atividade recente</small><h2>Últimas respostas</h2></div><Link className="text-button" to="/analytics?tab=responses">Ver todas</Link></div>
          <div className="dashboard-recent-list">
            {rows.slice(0,5).map(row=><Link to="/analytics?tab=responses" key={row.id} className="dashboard-recent-item"><span><b>{row.name||'Sem nome'}</b><small>{row.email||'Sem e-mail'}</small></span><span><b>{row.score??'—'}%</b><small>{levelNames[row.level||0]||'—'}</small></span><span><small>{formatDate(row.created_at)}</small></span></Link>)}
            {!rows.length&&<div className="table-empty">Nenhuma resposta ainda.</div>}
          </div>
        </article>
      </section>
    </>}
  </>
}
