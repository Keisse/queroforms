import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Search, Trash2, Users, X } from 'lucide-react';
import QuestionAnalytics from '../components/QuestionAnalytics';
import { Step } from '../data/gpIa';
import { deleteSubmission, fetchSubmissions, fetchSurveyVersionSteps, Submission } from '../lib/adminData';

const levelNames: Record<number, string> = {
  1: 'Explorador',
  2: 'Usuário',
  3: 'Aumentado',
  4: 'Orientado por IA',
};

const dimensionNames: Record<string, string> = {
  planejamento: 'Planejamento',
  riscos: 'Riscos',
  decisao: 'Decisão',
  comunicacao: 'Comunicação',
  automacao: 'Automação',
  confianca: 'Confiança',
};

type AnalyticsProps = {
  embedded?: boolean;
  view?: 'overview' | 'responses';
  onOpenResponses?: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function answerLabel(step: Extract<Step, { kind: 'question' }> | undefined, value: string | string[]) {
  const values = Array.isArray(value) ? value : [value];
  const labels = values.map(item => step?.options.find(option => option.value === item)?.label || item);
  return labels.join(', ');
}

function answerRows(submission: Submission, steps: Step[]) {
  const answers = submission.answers || {};
  const questionSteps = steps.filter((step): step is Extract<Step, { kind: 'question' }> => step.kind === 'question');
  const stepById = new Map(questionSteps.map(step => [step.id, step]));
  const orderedIds = questionSteps.map(step => step.id).filter(id => Object.prototype.hasOwnProperty.call(answers, id));
  const remainingIds = Object.keys(answers).filter(id => !orderedIds.includes(id));

  return [...orderedIds, ...remainingIds].map(id => {
    const question = stepById.get(id);
    const raw = answers[id];
    const fallbackTitle = id === 'cloud-use' ? 'Você já utiliza cloud?' : id;
    return {
      id,
      question: question?.title || fallbackTitle,
      answer: answerLabel(question, raw),
    };
  });
}

function exportCsv(rows: Submission[], versions: Record<number, Step[]>) {
  const questionIds: string[] = [];
  const questionLabels: Record<string, string> = {};

  for (const submission of rows) {
    const steps = versions[submission.survey_version] || [];
    for (const item of answerRows(submission, steps)) {
      if (!questionIds.includes(item.id)) questionIds.push(item.id);
      if (!questionLabels[item.id]) questionLabels[item.id] = item.question;
    }
  }

  const header = [
    'Data', 'Nome', 'E-mail', 'Score', 'Nível', 'Versão', 'Origem', 'UTM Source', 'UTM Medium', 'UTM Campaign',
    ...questionIds.map(id => questionLabels[id] || id),
  ];

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(submission => {
    const mapped = new Map(answerRows(submission, versions[submission.survey_version] || []).map(item => [item.id, item.answer]));
    return [
      formatDate(submission.created_at),
      submission.name || '',
      submission.email || '',
      submission.score ?? '',
      levelNames[submission.level || 0] || submission.level || '',
      submission.survey_version,
      submission.source || '',
      submission.utm_source || '',
      submission.utm_medium || '',
      submission.utm_campaign || '',
      ...questionIds.map(id => mapped.get(id) || ''),
    ].map(escape).join(',');
  });

  const csv = `\uFEFF${[header.map(escape).join(','), ...lines].join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `respostas-gp-ia-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Analytics({ embedded = false, view, onOpenResponses }: AnalyticsProps = {}) {
  const [tab, setTab] = useState<'overview' | 'responses'>(() =>
    new URLSearchParams(window.location.search).get('tab') === 'responses' ? 'responses' : 'overview',
  );
  const [rows, setRows] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [versions, setVersions] = useState<Record<number, Step[]>>({});
  const [selected, setSelected] = useState<Submission | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const currentTab = view || tab;

  useEffect(() => {
    let active = true;
    Promise.all([fetchSubmissions('gp-ia', 2000), fetchSurveyVersionSteps('gp-ia')])
      .then(([snapshot, versionSteps]) => {
        if (!active) return;
        setRows(snapshot.rows);
        setTotalCount(snapshot.totalCount);
        setTruncated(snapshot.truncated);
        setVersions(versionSteps);
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as análises.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      const matchesSearch = !term || [row.name, row.email, row.source].some(value => String(value || '').toLowerCase().includes(term));
      const matchesLevel = levelFilter === 'all' || String(row.level) === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [rows, search, levelFilter]);

  const averageScore = useMemo(() => {
    const scores = rows.map(row => row.score).filter((value): value is number => typeof value === 'number');
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  }, [rows]);

  const last7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return rows.filter(row => new Date(row.created_at).getTime() >= cutoff).length;
  }, [rows]);

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    rows.forEach(row => { if (row.level && counts[row.level] !== undefined) counts[row.level] += 1; });
    return counts;
  }, [rows]);

  const dimensionAverages = useMemo(() => {
    return Object.keys(dimensionNames).map(key => {
      const values = rows
        .map(row => row.dimension_scores?.[key])
        .filter((value): value is number => typeof value === 'number');
      const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      return { key, label: dimensionNames[key], average };
    });
  }, [rows]);

  const changeTab = (next: 'overview' | 'responses') => {
    if (view) return;
    setTab(next);
    const url = next === 'responses' ? '/analytics?tab=responses' : '/analytics';
    window.history.replaceState(null, '', url);
  };

  const openResponses = () => {
    if (onOpenResponses) onOpenResponses();
    else changeTab('responses');
  };

  const removePerson = async (submission: Submission) => {
    const label = submission.name || submission.email || 'este lead';
    const confirmed = window.confirm(`Excluir ${label}?\n\nEsta ação remove definitivamente a pessoa e todas as respostas dela do Supabase. Não é possível desfazer.`);
    if (!confirmed) return;

    setDeletingId(submission.id);
    setDeleteError('');
    try {
      await deleteSubmission(submission.id);
      setRows(current => current.filter(row => row.id !== submission.id));
      setTotalCount(current => Math.max(0, current - 1));
      setSelected(current => current?.id === submission.id ? null : current);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível excluir esta pessoa do Supabase.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="analytics-loading">Carregando dados do diagnóstico...</div>;
  if (error) return <div className="analytics-error"><b>Não foi possível carregar os dados.</b><span>{error}</span></div>;

  return <>
    {!embedded && <header className="page-head analytics-head">
      <div><div className="crumb">Keisse › My workspace</div><h1>Análises</h1><p>Resultados e respostas do Diagnóstico de Maturidade em IA para Gestão de Projetos.</p></div>
      <button className="btn" onClick={() => exportCsv(filtered, versions)} disabled={!filtered.length}><Download size={17}/> Exportar CSV</button>
    </header>}

    {!embedded && !view && <div className="analytics-tabs">
      <button className={currentTab === 'overview' ? 'active' : ''} onClick={() => changeTab('overview')}><BarChart3 size={17}/> Visão geral</button>
      <button className={currentTab === 'responses' ? 'active' : ''} onClick={() => changeTab('responses')}><Users size={17}/> Respostas individuais</button>
    </div>}

    {embedded && <div className="analytics-embedded-toolbar"><span>{totalCount} resposta{totalCount === 1 ? '' : 's'} concluída{totalCount === 1 ? '' : 's'}</span><button className="btn" onClick={() => exportCsv(filtered, versions)} disabled={!filtered.length}><Download size={16}/> Exportar CSV</button></div>}

    {deleteError && <div className="analytics-error" style={{marginBottom:16}}><b>Não foi possível excluir o lead.</b><span>{deleteError}</span></div>}
    {truncated && <div className="analytics-notice">Existem {totalCount} respostas. Esta versão do painel carrega as 2.000 mais recentes para análise detalhada.</div>}

    {currentTab === 'overview' && <div className="analytics-overview">
      <section className="metric-grid">
        <article className="metric-card"><span>Respostas concluídas</span><strong>{totalCount}</strong><small>Submissões gravadas no Supabase</small></article>
        <article className="metric-card"><span>Score médio</span><strong>{averageScore}%</strong><small>Média de maturidade das respostas carregadas</small></article>
        <article className="metric-card"><span>Últimos 7 dias</span><strong>{last7Days}</strong><small>Novas respostas no período</small></article>
        <article className="metric-card"><span>Taxa de conclusão</span><strong>—</strong><small>Será habilitada quando rastrearmos também os inícios/abandono</small></article>
      </section>

      <section className="analysis-grid-2">
        <article className="analysis-card">
          <div className="analysis-card-head"><div><small>Distribuição</small><h2>Níveis de maturidade</h2></div></div>
          <div className="level-distribution">
            {[1, 2, 3, 4].map(level => {
              const count = levelCounts[level] || 0;
              const pct = rows.length ? Math.round((count / rows.length) * 100) : 0;
              return <div className="level-dist-row" key={level}><div><span>{levelNames[level]}</span><b>{count} · {pct}%</b></div><div className="level-dist-track"><i style={{ width: `${pct}%` }}/></div></div>;
            })}
          </div>
        </article>

        <article className="analysis-card">
          <div className="analysis-card-head"><div><small>Diagnóstico</small><h2>Média por dimensão</h2></div></div>
          <div className="dimension-summary">
            {dimensionAverages.map(item => <div className="dimension-summary-row" key={item.key}><div><span>{item.label}</span><b>{item.average}%</b></div><div><i style={{ width: `${item.average}%` }}/></div></div>)}
          </div>
        </article>
      </section>

      <QuestionAnalytics rows={rows} versions={versions}/>

      <section className="analysis-card recent-card">
        <div className="analysis-card-head"><div><small>Atividade recente</small><h2>Últimas respostas</h2></div><button className="text-button" onClick={openResponses}>Ver todas</button></div>
        <div className="response-table compact">
          <div className="response-table-row response-table-head"><span>Lead</span><span>Score</span><span>Nível</span><span>Origem</span><span>Data</span></div>
          {rows.slice(0, 5).map(row => <button className="response-table-row" key={row.id} onClick={() => setSelected(row)}><span><b>{row.name || 'Sem nome'}</b><small>{row.email || 'Sem e-mail'}</small></span><span>{row.score ?? '—'}%</span><span>{levelNames[row.level || 0] || '—'}</span><span>{row.source || 'direct'}</span><span>{formatDate(row.created_at)}</span></button>)}
          {!rows.length && <div className="table-empty">Nenhuma resposta ainda.</div>}
        </div>
      </section>
    </div>}

    {currentTab === 'responses' && <section className="analysis-card responses-card">
      <div className="responses-toolbar">
        <div className="search-box"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou origem"/></div>
        <select value={levelFilter} onChange={event => setLevelFilter(event.target.value)}>
          <option value="all">Todos os níveis</option>
          <option value="1">Explorador</option>
          <option value="2">Usuário</option>
          <option value="3">Aumentado</option>
          <option value="4">Orientado por IA</option>
        </select>
        <span className="response-count">{filtered.length} resposta{filtered.length === 1 ? '' : 's'}</span>
      </div>
      <div className="response-table">
        <div className="response-table-row response-table-head"><span>Lead</span><span>Score</span><span>Nível</span><span>Versão</span><span>Origem</span><span>Data</span></div>
        {filtered.map(row => <button className="response-table-row" key={row.id} onClick={() => setSelected(row)}><span><b>{row.name || 'Sem nome'}</b><small>{row.email || 'Sem e-mail'}</small></span><span>{row.score ?? '—'}%</span><span>{levelNames[row.level || 0] || '—'}</span><span>v{row.survey_version}</span><span>{row.source || 'direct'}</span><span>{formatDate(row.created_at)}</span></button>)}
        {!filtered.length && <div className="table-empty">Nenhuma resposta encontrada com esses filtros.</div>}
      </div>
    </section>}

    {selected && <div className="response-drawer-backdrop" onMouseDown={() => setSelected(null)}>
      <aside className="response-drawer" onMouseDown={event => event.stopPropagation()}>
        <div className="drawer-head"><div><small>Resposta individual · versão {selected.survey_version}</small><h2>{selected.name || 'Sem nome'}</h2><p>{selected.email || 'Sem e-mail'}</p></div><button onClick={() => setSelected(null)} aria-label="Fechar"><X size={20}/></button></div>
        <div className="drawer-kpis"><div><span>Score</span><b>{selected.score ?? '—'}%</b></div><div><span>Nível</span><b>{levelNames[selected.level || 0] || '—'}</b></div><div><span>Origem</span><b>{selected.source || 'direct'}</b></div></div>
        <div className="drawer-meta"><span>Respondido em {formatDate(selected.created_at)}</span>{selected.utm_campaign && <span>Campanha: {selected.utm_campaign}</span>}</div>
        <button
          className="btn"
          onClick={() => void removePerson(selected)}
          disabled={deletingId === selected.id}
          style={{width:'100%',justifyContent:'center',margin:'16px 0',color:'#a93434',borderColor:'#efcaca',background:'#fff7f7'}}
        >
          <Trash2 size={17}/> {deletingId === selected.id ? 'Excluindo do Supabase...' : 'Excluir pessoa e respostas'}
        </button>
        <small style={{display:'block',margin:'-8px 0 18px',color:'#8a6b6b',lineHeight:1.4}}>A exclusão é definitiva e remove esta submissão diretamente do Supabase.</small>
        <div className="individual-answers">
          {answerRows(selected, versions[selected.survey_version] || []).map((item, index) => <article key={`${item.id}-${index}`}><small>Pergunta {index + 1}</small><h3>{item.question}</h3><p>{item.answer}</p></article>)}
        </div>
      </aside>
    </div>}
  </>;
}