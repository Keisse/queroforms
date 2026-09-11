import test from 'node:test';
import assert from 'node:assert/strict';
import { projectSalary, scoreResult, type Step } from '../src/data/gpIa.ts';

const scaleStep: Step = {
  id: 'scale-test',
  kind: 'question',
  title: 'Escala de teste',
  input: 'scale',
  dimension: 'teste',
  options: [
    { label: 'Nada', value: '1', score: 1 },
    { label: 'Pouco', value: '2', score: 2 },
    { label: 'Medio', value: '3', score: 3 },
    { label: 'Bastante', value: '4', score: 4 },
    { label: 'Muito', value: '5', score: 5 },
  ],
};

const multiStep: Step = {
  id: 'multi-test',
  kind: 'question',
  title: 'Multipla de teste',
  input: 'multi',
  dimension: 'teste',
  options: [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c' },
    { label: 'D', value: 'd' },
    { label: 'E', value: 'e' },
  ],
};

test('caracterizacao: menor valor da escala 1..5 gera 20%', () => {
  const result = scoreResult([scaleStep], { 'scale-test': '1' });
  assert.equal(result.pct, 20);
  assert.equal(result.dimensions.teste, 20);
});

test('caracterizacao: multi pontua pela quantidade selecionada', () => {
  assert.equal(scoreResult([multiStep], { 'multi-test': ['a'] }).pct, 25);
  assert.equal(scoreResult([multiStep], { 'multi-test': ['a', 'b', 'c', 'd'] }).pct, 100);
  assert.equal(scoreResult([multiStep], { 'multi-test': ['a', 'b', 'c', 'd', 'e'] }).pct, 100);
});

test('caracterizacao: projecao salarial principal termina em 1.50x no terceiro ano', () => {
  assert.deepEqual(projectSalary(10_000).map(item => item.value), [10_000, 12_200, 13_200, 15_000]);
});

test('caracterizacao: mesmas respostas produzem o mesmo resultado', () => {
  const steps = [scaleStep, multiStep];
  const answers = { 'scale-test': '4', 'multi-test': ['a', 'b'] };
  assert.deepEqual(scoreResult(steps, answers), scoreResult(steps, answers));
});
