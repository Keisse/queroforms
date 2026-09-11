import { useMemo } from 'react';
import { Step } from '../data/gpIa';
import { Submission } from '../lib/adminData';

type QuestionStep = Extract<Step, { kind: 'question' }>;
type InputType = QuestionStep['input'];

type QuestionDefinition = {
  id: string;
  title: string;
  subtitle?: string;
  input: InputType;
  options: { label: string; value: string }[];
};

type OptionStat = {
  value: string;
  label: string;
  count: number;
  percentage: number;
};

const specialQuestions: Record<string, QuestionDefinition> = {
  'cloud-use': {
    id: 'cloud-use',
    title: 'Você já utiliza cloud no seu trabalho?',
    input: 'single',
    options: [
      { label: 'Sim', value: 'sim' },
      { label: 'Não', value: 'nao' },
    ],
  },
};

function isAnswered(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).length > 0;
}

function buildDefinitions(versions: Record<number, Step[]>, rows: Submission[]) {
  const versionNumbers = Object.keys(versions).map(Number).sort((a, b) => a - b);
  const latestVersion = versionNumbers[versionNumbers.length - 1];
  const byId = new Map<string, QuestionDefinition>();
  const historicalOrder: string[] = [];

  for (const version of versionNumbers) {
    for (const step of versions[version] || []) {
      if (step.kind !== 'question') continue;
      if (!historicalOrder.includes(step.id)) historicalOrder.push(step.id);
      byId.set(step.id, {
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        input: step.input,
        options: step.options.map(option => ({ label: option.label, value: option.value })),
      });
    }
  }

  const latestOrder = latestVersion === undefined ? [] : (versions[latestVersion] || [])
    .filter((step): step is QuestionStep => step.kind === 'question')
    .map(step => step.id);

  const answerIds = new Set<string>();
  for (const row of rows) Object.keys(row.answers || {}).forEach(id => answerIds.add(id));

  for (const id of answerIds) {
    if (byId.has(id)) continue;
    const special = specialQuestions[id];
    if (special) byId.set(id, special);
    else {
      const sample = rows.find(row => isAnswered(row.answers?.[id]))?.answers?.[id];
      byId.set(id, {
        id,
        title: id,
        input: Array.isArray(sample) ? 'multi' : 'single',
        options: [],
      });
    }
  }

  const ordered = [...latestOrder];
  historicalOrder.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });
  answerIds.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });

  return ordered.map(id => byId.get(id)).filter((item): item is QuestionDefinition => Boolean(item));
}

function buildHistoricalLabels(versions: Record<number, Step[]>) {
  const labels = new Map<string, Map<string, string>>();
  for (const steps of Object.values(versions)) {
    for (const step of steps) {
      if (step.kind !== 'question') continue;
      if (!labels.has(step.id)) labels.set(step.id, new Map());
      const map = labels.get(step.id)!;
      step.options.forEach(option => map.set(option.value, option.label));
    }
  }
  return labels;
}

function fallbackValueLabel(value: string) {
  if (value === 'yes') return 'Sim';
  if (value === 'no') return 'Não';
  return value;
}

function aggregateQuestion(question: QuestionDefinition, rows: Submission[], historicalLabels: Map<string, Map<string, string>>) {
  const counts = new Map<string, number>();
  let answered = 0;

  for (const row of rows) {
    const raw = row.answers?.[question.id];
    if (!isAnswered(raw)) continue;
    answered += 1;
    const values = Array.isArray(raw) ? raw : [raw];
    values.forEach(value => counts.set(String(value), (counts.get(String(value)) || 0) + 1));
  }

  const optionOrder = question.options.map(option => option.value);
  const extraValues = [...counts.keys()].filter(value => !optionOrder.includes(value));
  const values = [...optionOrder, ...extraValues];
  const labelMap = historicalLabels.get(question.id);

  const stats: OptionStat[] = values
    .map(value => {
      const currentLabel = question.options.find(option => option.value === value)?.label;
      const specialLabel = specialQuestions[question.id]?.options.find(option => option.value === value)?.label;
      const count = counts.get(value) || 0;
      return {
        value,
        label: currentLabel || labelMap?.get(value) || specialLabel || fallbackValueLabel(value),
        count,
        percentage: answered ? Math.round((count / answered) * 100) : 0,
      };
    })
    .filter(item => item.count > 0 || optionOrder.includes(item.value));

  const top = [...stats].sort((a, b) => b.count - a.count)[0];
  return { answered, stats, top };
}

function HorizontalBars({ stats, multi }: { stats: OptionStat[]; multi: boolean }) {
  const maxCount = Math.max(1, ...stats.map(item => item.count));
  return <div className="question-bars">
    {stats.map(item => <div className="question-bar-row" key={item.value}>
      <div className="question-bar-meta"><span>{item.label}</span><b>{item.count} · {item.percentage}%</b></div>
      <div className="question-bar-track"><i style={{ width: `${Math.round((item.count / maxCount) * 100)}%` }}/></div>
    </div>)}
    {multi && <small className="chart-note">Em múltipla escolha, os percentuais podem somar mais de 100%.</small>}
  </div>;
}

function ScaleChart({ stats }: { stats: OptionStat[] }) {
  return <div className="scale-analysis-chart">
    {stats.map(item => <div className="scale-analysis-col" key={item.value}>
      <div className="scale-analysis-value">{item.percentage}%</div>
      <div className="scale-analysis-track"><i style={{ height: `${Math.max(4, item.percentage)}%` }}/></div>
      <b>{item.value}</b>
      <small>{item.count}</small>
    </div>)}
  </div>;
}

function SalaryChart({ stats }: { stats: OptionStat[] }) {
  const maxCount = Math.max(1, ...stats.map(item => item.count));
  return <div className="salary-analysis-chart">
    {stats.map(item => <div className="salary-analysis-col" key={item.value}>
      <div className="salary-analysis-value">{item.percentage}%</div>
      <div className="salary-analysis-track"><i style={{ height: `${Math.max(4, Math.round((item.count / maxCount) * 100))}%` }}/></div>
      <small title={item.label}>{item.label}</small>
      <b>{item.count}</b>
    </div>)}
  </div>;
}

export default function QuestionAnalytics({ rows, versions }: { rows: Submission[]; versions: Record<number, Step[]> }) {
  const definitions = useMemo(() => buildDefinitions(versions, rows), [versions, rows]);
  const historicalLabels = useMemo(() => buildHistoricalLabels(versions), [versions]);

  if (!definitions.length) return null;

  return <section className="question-analytics-section">
    <div className="question-analytics-title">
      <div><small>Análise detalhada</small><h2>Resultados por pergunta</h2><p>Cada pergunta recebe automaticamente a visualização mais adequada ao seu tipo de resposta.</p></div>
      <span>{definitions.length} perguntas</span>
    </div>

    <div className="question-analytics-grid">
      {definitions.map((question, index) => {
        const { answered, stats, top } = aggregateQuestion(question, rows, historicalLabels);
        const isSalary = question.id.toLowerCase().includes('salary') || question.title.toLowerCase().includes('salári');
        const typeLabel = question.input === 'scale' ? 'Escala' : question.input === 'multi' ? 'Múltipla escolha' : 'Escolha única';

        return <article className="question-analysis-card" key={question.id}>
          <div className="question-analysis-head">
            <div><small>Pergunta {index + 1} · {typeLabel}</small><h3>{question.title}</h3>{question.subtitle && <p>{question.subtitle}</p>}</div>
            <span>{answered} resp.</span>
          </div>

          {answered === 0 ? <div className="question-no-data">Ainda não há respostas para esta pergunta.</div> : <>
            <div className="question-analysis-summary">
              <span>Taxa de resposta <b>{rows.length ? Math.round((answered / rows.length) * 100) : 0}%</b></span>
              {top && <span>Mais escolhido <b>{top.label} · {top.percentage}%</b></span>}
            </div>
            {question.input === 'scale'
              ? <ScaleChart stats={stats}/>
              : isSalary
                ? <SalaryChart stats={stats}/>
                : <HorizontalBars stats={stats} multi={question.input === 'multi'}/>
            }
          </>}
        </article>;
      })}
    </div>
  </section>;
}
