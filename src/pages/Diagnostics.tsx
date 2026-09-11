import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ExternalLink, FilePlus2, Pencil, Search, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createSurvey, fetchSurveySummaries, slugifySurveyName, SurveySummary } from '../lib/adminData';

function formatDate(value: string | null) {
  if (!value) return 'Sem leads ainda';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function Diagnostics() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchSurveySummaries()
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar os diagnósticos.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugifySurveyName(name));
  }, [name, slugTouched]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item => `${item.name} ${item.slug} ${item.status}`.toLowerCase().includes(term));
  }, [items, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const created = await createSurvey({ name, slug });
      setCreateOpen(false);
      setName('');
      setSlug('');
      setSlugTouched(false);
      navigate(`/builder/gp-ia?survey=${encodeURIComponent(created.slug)}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Não foi possível criar o diagnóstico.');
    } finally {
      setCreating(false);
    }
  };

  return <>
    <header className="page-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Diagnósticos</h1><p className="page-subtitle">Crie, acompanhe e gerencie todos os diagnósticos do workspace.</p></div>
      <button className="btn dark" onClick={() => setCreateOpen(true)}><FilePlus2 size={17}/> Novo diagnóstico</button>
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

    {createOpen && <div className="diagnostic-modal-backdrop" onMouseDown={() => setCreateOpen(false)}>
      <form className="diagnostic-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()}>
        <div className="diagnostic-modal-head"><div><small>NOVO DIAGNÓSTICO</small><h2>Comece com a estrutura pronta</h2></div><button type="button" className="icon-action" onClick={() => setCreateOpen(false)}><X size={18}/></button></div>
        <p>O novo diagnóstico nasce como rascunho usando a estrutura atual como modelo. Depois você pode editar perguntas, telas e pontuação no Builder.</p>
        <label>Nome do diagnóstico</label>
        <input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Diagnóstico de Liderança com IA" required/>
        <label>URL</label>
        <div className="diagnostic-slug-input"><span>forms.trentim.com/d/</span><input value={slug} onChange={event => { setSlugTouched(true); setSlug(slugifySurveyName(event.target.value)); }} placeholder="diagnostico-lideranca-ia" required/></div>
        {createError && <div className="save-error">{createError}</div>}
        <div className="diagnostic-modal-actions"><button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="btn dark" disabled={creating || !name.trim() || !slug.trim()}>{creating ? 'Criando...' : 'Criar e abrir Builder'}</button></div>
      </form>
    </div>}
  </>;
}
