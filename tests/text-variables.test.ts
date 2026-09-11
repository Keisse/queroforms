import test from 'node:test';
import assert from 'node:assert/strict';
import { hasNameVariable, personalizeText } from '../src/lib/textVariables.ts';

test('substitui {{nome}} pelo primeiro nome digitado',()=>{
  assert.equal(personalizeText('{{nome}}, vamos continuar?','Keisse'),'Keisse, vamos continuar?');
});

test('aceita espacos e caixa diferente na tag de nome',()=>{
  assert.equal(personalizeText('Olá, {{ NOME }}!','Keisse'),'Olá, Keisse!');
});

test('remove a tag quando ainda nao existe nome',()=>{
  assert.equal(personalizeText('Olá {{nome}}, tudo bem?',''),'Olá , tudo bem?');
});

test('detecta uso da variavel de nome',()=>{
  assert.equal(hasNameVariable('Pergunta para {{nome}}'),true);
  assert.equal(hasNameVariable('Pergunta comum'),false);
});
