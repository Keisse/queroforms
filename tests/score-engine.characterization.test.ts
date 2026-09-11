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

const singleStep: Step = {
  id: 'single-test',
  kind: 'question',
  title: 'Escolha de teste',
  input: 'single',
  dimension: 'teste',
  options: [
    { label: 'Nunca', value: '0', score: 0 },
    { label: 'As vezes', value: '1', score: 1 },
    { label: 'Frequentemente', value: '2', score: 2 },
    { label: 'Sempre', value: '3', score: 3 },
  ],
};

const multiStep: Step = {
  id: 'multi-test',
  kind: 'question',
  title: 'Multipla de teste',
  input: 'multi',
  dimension: 'perfil',
  options: [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c' },
    { label: 'D', value: 'd' },
    { label: 'Nenhuma', value: 'none' },
  ],
};

test('menor valor de uma escala pontuada normaliza para 0%', () => {
  const result = scoreResult([scaleStep], { 'scale-test': '1' });
  assert.equal(result.pct, 0);
  assert.equal(result.dimensions.teste, 0);
});

test('maior valor de uma escala pontuada normaliza para 100%', () => {
  const result = scoreResult([scaleStep], { 'scale-test': '5' });
  assert.equal(result.pct, 100);
  assert.equal(result.dimensions.teste, 100);
});

test('perguntas multi sem score explicito nao alteram maturidade', () => {
  assert.equal(scoreResult([multiStep], { 'multi-test': ['a'] }).pct, 0);
  assert.equal(scoreResult([multiStep], { 'multi-test': ['a', 'b', 'c', 'd'] }).pct, 0);
  assert.equal(scoreResult([multiStep], { 'multi-test': ['none'] }).pct, 0);
});

test('pergunta pontuada sem resposta continua no denominador como zero', () => {
  const result = scoreResult([scaleStep, singleStep], { 'scale-test': '5' });
  assert.equal(result.pct, 50);
});

test('duas perguntas no maximo produzem 100%', () => {
  const result = scoreResult([scaleStep, singleStep], { 'scale-test': '5', 'single-test': '3' });
  assert.equal(result.pct, 100);
  assert.equal(result.dimensions.teste, 100);
});

test('projecao salarial principal termina em 1.50x no terceiro ano', () => {
  assert.deepEqual(projectSalary(10_000).map(item => item.value), [10_000, 12_200, 13_200, 15_000]);
});

test('mesmas respostas produzem exatamente o mesmo resultado', () => {
  const steps = [scaleStep, singleStep, multiStep];
  const answers = { 'scale-test': '4', 'single-test': '2', 'multi-test': ['a', 'b'] };
  const expected = scoreResult(steps, answers);

  for (let i = 0; i < 100; i += 1) {
    assert.deepEqual(scoreResult(steps, answers), expected);
  }
});
