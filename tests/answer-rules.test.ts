import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleMultiAnswer } from '../src/lib/answerRules.ts';

test('selecionar nenhuma remove respostas incompatíveis', () => {
  assert.deepEqual(toggleMultiAnswer(['pmp','capm'], 'nenhuma'), ['nenhuma']);
});

test('selecionar resposta real remove nenhuma', () => {
  assert.deepEqual(toggleMultiAnswer(['nenhuma'], 'pmp'), ['pmp']);
  assert.deepEqual(toggleMultiAnswer(['none'], 'chatgpt'), ['chatgpt']);
});

test('clicar novamente na opção exclusiva desmarca', () => {
  assert.deepEqual(toggleMultiAnswer(['none'], 'none'), []);
});

test('respostas comuns continuam permitindo múltipla seleção', () => {
  assert.deepEqual(toggleMultiAnswer(['a'], 'b'), ['a','b']);
  assert.deepEqual(toggleMultiAnswer(['a','b'], 'a'), ['b']);
});
