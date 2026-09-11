import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, FileQuestion, Plus, Users } from 'lucide-react';
import { fetchRecentSubmissions, fetchSurveySummaries, Submission, SurveySummary } from '../lib/adminData';

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
  const [surveys,setSurveys]=useState<SurveySummary[]>([]);
  const [recent,setRecent]=useState<Submission[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    Promise.all([fetchSurveySummaries(),fetchRecentSubmissions(6)])
      .then(([surveyRows,recentRows])=>{if(!active)return;setSurveys(surveyRows);setRecent(recentRows);})
      .catch(err=>{if(!active)return;setError(err instanceof Error?err.message:'Falha ao carregar o dashboard.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const totalLeads=useMemo(()=>surveys.reduce((sum,item)=>sum+item.leads,0),[surveys]);
  const activeSurveys=useMemo(()=>surveys.filter(item=>item.status==='published').length,[surveys]);
  const last7Days=useMemo(()=>surveys.reduce((sum,item)=>sum+item.leadsLast7Days,0),[surveys]);
  const topSurvey=useMemo(()=>[...surveys].sort((a,b)=>b.leads-a.leads)[0], [surveys]);
  const surveyNameBySlug=useMemo(()=>new Map(surveys.map(item=>[item.slug,item.name])),[surveys]);

  return <>
    <header className="page-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Dashboard</h1><p className="page-subtitle">Visão geral dos diagnósticos e dos leads capturados.</p></div>
      <Link className="btn dark" to="/diagnostics"><Plus size={17}/> Novo diagnóstico</Link>
    </header>

    {loading&&<div className="analytics-loading">Carregando indicadores...</div>}
    {error&&<div className="analytics-error"><b>Não foi possível carregar os indicadores.</b><span>{error}</span></div>}

    {!loading&&!error&&<>
      <section className="metric-grid dashboard-metrics">
        <article className="metric-card"><div className="metric-icon"><Users size={19}/></div><span>Leads totais</span><strong>{totalLeads}</strong><small>Somando todos os diagnósticos</small></article>
        <article className="metric-card"><div className="metric-icon"><Activity size={19}/></div><span>Diagnósticos ativos</span><strong>{activeSurveys}</strong><small>Publicados e disponíveis para captação</small></article>
        <article className="metric-card"><div className="metric-icon"><BarChart3 size={19}/></div><span>Leads nos últimos 7 dias</span><strong>{last7Days}</strong><small>Novas respostas no período</small></article>
        <article className="metric-card"><div className="metric-icon"><FileQuestion size={19}/></div><span>Diagnóstico com mais leads</span><strong className="metric-text-value">{topSurvey?.name||'—'}</strong><small>{topSurvey?`${topSurvey.leads} lead${topSurvey.leads===1?'':'s'}`:'Nenhum diagnóstico criado'}</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="analysis-card">
          <div className="analysis-card-head"><div><small>Performance por diagnóstico</small><h2>Diagnósticos do workspace</h2></div><Link className="text-button" to="/diagnostics">Ver todos</Link></div>
          <div className="dashboard-diagnostic-list">
            {surveys.slice(0,6).map(item=><Link to={`/builder/gp-ia?survey=${encodeURIComponent(item.slug)}`} key={item.id} className="dashboard-diagnostic-item">
              <span><strong>{item.name}</strong><small>{item.status==='published'?'● Ativo':'Rascunho'} · /d/{item.slug}</small></span>
              <span><b>{item.leads}</b><small>leads</small></span>
              <span><b>+{item.leadsLast7Days}</b><small>7 dias</small></span>
              <span>→</span>
            </Link>)}
            {!surveys.length&&<div className="dashboard-empty">Nenhum diagnóstico criado.</div>}
          </div>
        </article>

        <article className="analysis-card recent-card">
          <div className="analysis-card-head"><div><small>Atividade recente</small><h2>Últimos leads</h2></div><Link className="text-button" to="/analytics?tab=responses">Ver análises</Link></div>
          <div className="dashboard-recent-list">
            {recent.map(row=><Link to={`/analytics?survey=${encodeURIComponent(row.survey_slug)}&tab=responses`} key={row.id} className="dashboard-recent-item"><span><b>{row.name||'Sem nome'}</b><small>{row.email||'Sem e-mail'}</small></span><span><b>{row.score??'—'}%</b><small>{levelNames[row.level||0]||'—'}</small></span><span><small>{surveyNameBySlug.get(row.survey_slug)||row.survey_slug}</small><small>{formatDate(row.created_at)}</small></span></Link>)}
            {!recent.length&&<div className="table-empty">Nenhum lead ainda.</div>}
          </div>
        </article>
      </section>
    </>}
  </>
}
