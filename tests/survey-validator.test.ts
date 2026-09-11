import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSurveyStructure, isProtectedStructuralStep } from '../src/lib/surveyValidator.ts';
import type { Step } from '../src/data/gpIa.ts';

function validSurvey(): Step[] {
  return [
    { id: 'intro', kind: 'intro', title: 'Abertura', body: 'Pergunta', cta: 'Começar' },
    { id: 'branch', kind: 'branch', variants: { sim: { title: 'Sim', body: 'Sim' }, nao: { title: 'Não', body: 'Não' } } },
    { id: 'q1', kind: 'question', title: 'Pergunta', input: 'single', options: [{ label: 'A', value: 'a', score: 0 }, { label: 'B', value: 'b', score: 1 }] },
    { id: 'email', kind: 'email', title: 'E-mail' },
    { id: 'name', kind: 'name', title: 'Nome' },
    { id: 'processing', kind: 'processing', title: 'Processando' },
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
  steps[2] = { id: 'q1', kind: 'question', title: 'Pergunta', input: 'single', options: [{ label: 'A', value: 'x' }, { label: 'B', value: 'x' }] };
  steps.splice(3, 0, { id: 'q1', kind: 'insight', title: 'Contexto', body: 'Texto' });
  const result = validateSurveyStructure(steps);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /duplicado/i);
});

test('telas estruturais sao protegidas', () => {
  for (const step of validSurvey()) {
    if (['intro', 'branch', 'email', 'name', 'processing', 'result'].includes(step.kind)) {
      assert.equal(isProtectedStructuralStep(step), true);
    }
  }
});
