import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ExternalLink, Pencil, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSurveySummaries, SurveySummary } from '../lib/adminData';

function formatDate(value: string | null) {
  if (!value) return 'Sem leads ainda';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function Diagnostics() {
  const [items, setItems] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchSurveySummaries()
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar os diagnósticos.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item => `${item.name} ${item.slug} ${item.status}`.toLowerCase().includes(term));
  }, [items, search]);

  return <>
    <header className="page-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Diagnósticos</h1><p className="page-subtitle">Crie, acompanhe e gerencie todos os diagnósticos do workspace.</p></div>
    </header>

    <section className="diagnostics-summary-row">
      <article><span><Activity size={18}/></span><div><small>Diagnósticos ativos</small><strong>{items.filter(item => item.status === 'published').length}</strong></div></article>
      <article><span><Users size={18}/></span><div><small>Leads totais</small><strong>{items.reduce((sum, item) => sum + item.leads, 0)}</strong></div></article>
      <article><span><BarChart3 size={18}/></span><div><small>Leads nos últimos 7 dias</small><strong>{items.reduce((sum, item) => sum + item.leadsLast7Days, 0)}</strong></div></article>
    </section>

    <section className="diagnostics-list-panel">
      <div className="diagnostics-list-head">
        <div><h2>Todos os diagnósticos</h2><small>{items.length} diagnóstico{items.length === 1 ? '' : 's'} no workspace</small></div>
        <div className="diagnostics-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar diagnóstico"/></div>
      </div>

      {loading && <div className="analytics-loading">Carregando diagnósticos...</div>}
      {error && <div className="analytics-error"><b>Não foi possível carregar os diagnósticos.</b><span>{error}</span></div>}
      {!loading && !error && <div className="diagnostics-table">
        <div className="diagnostics-table-row diagnostics-table-head"><span>Diagnóstico</span><span>Status</span><span>Leads</span><span>7 dias</span><span>Último lead</span><span>Ações</span></div>
        {filtered.map(item => <div className="diagnostics-table-row" key={item.id}>
          <span className="diagnostics-name"><b>{item.name}</b><small>/d/{item.slug} · versão {item.published_version}</small></span>
          <span><em className={`diagnostic-status ${item.status}`}>{item.status === 'published' ? '● Ativo' : item.status === 'draft' ? 'Rascunho' : 'Arquivado'}</em></span>
          <span className="diagnostics-number">{item.leads}</span>
          <span className="diagnostics-number">+{item.leadsLast7Days}</span>
          <span><small>{formatDate(item.lastLeadAt)}</small></span>
          <span className="diagnostics-actions">
            <Link className="icon-action" title="Editar" to={`/builder/gp-ia?survey=${encodeURIComponent(item.slug)}`}><Pencil size={16}/></Link>
            <Link className="icon-action" title="Análises" to={`/analytics?survey=${encodeURIComponent(item.slug)}`}><BarChart3 size={16}/></Link>
            {item.status === 'published' && <a className="icon-action" title="Abrir diagnóstico público" href={`/d/${item.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a>}
          </span>
        </div>)}
        {!filtered.length && <div className="table-empty">Nenhum diagnóstico encontrado.</div>}
      </div>}
    </section>

  </>;
}
