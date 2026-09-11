import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('builder oferece controle para ocultar imagem sem apagar a configuracao', async()=>{
  const builder=await readFile(new URL('../src/pages/BuilderStable.tsx',import.meta.url),'utf8');
  assert.match(builder,/Ocultar imagem nesta tela/);
  assert.match(builder,/composeInsightSource/);
  assert.match(builder,/QF_HIDE_IMAGE/);
});

test('pagina publica respeita a visibilidade da imagem de contexto', async()=>{
  const publicQuiz=await readFile(new URL('../src/pages/PublicQuiz.tsx',import.meta.url),'utf8');
  assert.match(publicQuiz,/parseContextMarked/);
  assert.match(publicQuiz,/!insight\.hideImage&&<InsightVisual/);
});
