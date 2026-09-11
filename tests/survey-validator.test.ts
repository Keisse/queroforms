import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSurveyStructure, isProtectedStructuralStep } from '../src/lib/surveyValidator.ts';
import type { Step } from '../src/data/gpIa.ts';

const scoredOptions = [
  { label: 'Nunca', value: '0', score: 0 },
  { label: 'Sempre', value: '1', score: 1 },
];

function validSurvey(): Step[] {
  return [
    { id: 'intro', kind: 'intro', title: 'Abertura', body: 'Pergunta', cta: 'Começar' },
    { id: 'branch', kind: 'branch', variants: { sim: { title: 'Sim', body: 'Sim' }, nao: { title: 'Não', body: 'Não' } } },
    { id: 'q-planejamento', kind: 'question', title: 'Planejamento', input: 'single', dimension: 'planejamento', options: scoredOptions },
    { id: 'q-riscos', kind: 'question', title: 'Riscos', input: 'single', dimension: 'riscos', options: scoredOptions },
    { id: 'q-decisao', kind: 'question', title: 'Decisão', input: 'single', dimension: 'decisao', options: scoredOptions },
    { id: 'q-comunicacao', kind: 'question', title: 'Comunicação', input: 'single', dimension: 'comunicacao', options: scoredOptions },
    { id: 'q-automacao', kind: 'question', title: 'Automação', input: 'single', dimension: 'automacao', options: scoredOptions },
    { id: 'q-confianca', kind: 'question', title: 'Confiança', input: 'single', dimension: 'confianca', options: scoredOptions },
    { id: 'email', kind: 'email', title: 'E-mail' },
    { id: 'name', kind: 'name', title: 'Nome' },
    { id: 'processing', kind: 'processing', title: 'Processando' },
    { id: 'insight-pre-result-guide', kind: 'insight', eyebrow: 'Contexto', title: 'Preparação', body: 'Prepare-se para o resultado.' },
    { id: 'result', kind: 'result' },
  ];
}

test('formulario estruturalmente valido passa', () => {
  const result = validateSurveyStructure(validSurvey());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('publicacao sem resultado e rejeitada', () => {
  const steps = validSurvey().filter(step => step.kind !== 'result');
  const result = validateSurveyStructure(steps);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /result/);
});

test('resultado fora da ultima posicao e rejeitado', () => {
  const steps = validSurvey();
  const result = steps.pop()!;
  steps.splice(2, 0, result);
  const validation = validateSurveyStructure(steps);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(' '), /última tela/);
});

test('ids e valores de opcao duplicados sao rejeitados', () => {
  const steps = validSurvey();
  const qIndex = steps.findIndex(step => step.id === 'q-planejamento');
  steps[qIndex] = { id: 'q-planejamento', kind: 'question', title: 'Pergunta', input: 'single', dimension: 'planejamento', options: [{ label: 'A', value: 'x', score: 0 }, { label: 'B', value: 'x', score: 1 }] };
  steps.splice(qIndex + 1, 0, { id: 'q-planejamento', kind: 'insight', title: 'Contexto', body: 'Texto' });
  const result = validateSurveyStructure(steps);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /duplicado/i);
});

test('opcao sem rotulo e rejeitada', () => {
  const steps = validSurvey();
  const qIndex = steps.findIndex(step => step.id === 'q-planejamento');
  steps[qIndex] = { id: 'q-planejamento', kind: 'question', title: 'Pergunta', input: 'single', dimension: 'planejamento', options: [{ label: '', value: 'a', score: 0 }, { label: 'B', value: 'b', score: 1 }] };
  const result = validateSurveyStructure(steps);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /sem rótulo/);
});

test('dimensao de resultado sem pergunta pontuavel bloqueia publicacao', () => {
  const steps = validSurvey().filter(step => step.id !== 'q-riscos');
  const result = validateSurveyStructure(steps);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /dimensão riscos/);
});

test('tela de preparacao do resultado e obrigatoria e protegida', () => {
  const steps = validSurvey();
  const preResult = steps.find(step => step.id === 'insight-pre-result-guide')!;
  assert.equal(isProtectedStructuralStep(preResult), true);

  const withoutPreResult = steps.filter(step => step.id !== 'insight-pre-result-guide');
  const validation = validateSurveyStructure(withoutPreResult);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(' '), /preparação do resultado/);
});

test('telas estruturais sao protegidas', () => {
  for (const step of validSurvey()) {
    if (['intro', 'branch', 'email', 'name', 'processing', 'result'].includes(step.kind)) {
      assert.equal(isProtectedStructuralStep(step), true);
    }
  }
});
