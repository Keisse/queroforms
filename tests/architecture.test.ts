import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function sourceFiles(dir:string):string[]{
  return readdirSync(dir).flatMap(name=>{
    const full=join(dir,name);
    return statSync(full).isDirectory()?sourceFiles(full):/\.(ts|tsx)$/.test(name)?[full]:[];
  });
}

test('frontend nao reintroduz manipulacao imperativa do DOM do diagnostico',()=>{
  const forbidden=[
    {pattern:/MutationObserver/,label:'MutationObserver'},
    {pattern:/\.innerHTML\s*=/,label:'innerHTML'},
    {pattern:/querySelector\s*\(/,label:'querySelector'},
    {pattern:/dangerouslySetInnerHTML/,label:'dangerouslySetInnerHTML'},
  ];

  for(const file of sourceFiles('src')){
    const content=readFileSync(file,'utf8');
    for(const rule of forbidden){
      assert.equal(rule.pattern.test(content),false,`${file} reintroduziu ${rule.label}`);
    }
  }
});

test('hotfixes CSS removidos nao voltam a ser fonte de verdade',()=>{
  assert.equal(existsSync('src/styles/certificateHotfix.css'),false);
  assert.equal(existsSync('src/styles/builderHeaderCleanup.css'),false);
  assert.equal(existsSync('src/styles/aiCloud.css'),false);

  const main=readFileSync('src/main.tsx','utf8');
  assert.doesNotMatch(main,/certificateHotfix|builderHeaderCleanup|aiCloud/);
});

test('pagina publica usa renderer React declarado para os visuais de contexto',()=>{
  const publicQuiz=readFileSync('src/pages/PublicQuiz.tsx','utf8');
  const insightVisual=readFileSync('src/components/InsightVisual.tsx','utf8');
  assert.match(publicQuiz,/<InsightVisual step=\{step\}/);
  assert.match(insightVisual,/qf-context-upload-image/);
  assert.match(insightVisual,/insight-pre-result-guide/);
});


test('PMO agrupa as seis perguntas Likert em uma unica tela',()=>{
  const publicQuiz=readFileSync('src/pages/PublicQuiz.tsx','utf8');
  assert.match(publicQuiz,/qf-pmo-likert-group/);
  assert.match(publicQuiz,/\^pmo-q\[1-6\]\$/);
  assert.match(publicQuiz,/finishPmoLikert/);
});

test('progresso salvo antigo nao sobrepoe uma versao publicada nova',()=>{
  const publicQuiz=readFileSync('src/pages/PublicQuiz.tsx','utf8');
  assert.match(publicQuiz,/saved\.surveyVersion===remote\.version/);
});


test('PMO mobile mostra legenda Likert e botoes circulares',()=>{
  const publicQuiz=readFileSync('src/pages/PublicQuiz.tsx','utf8');
  const css=readFileSync('src/styles/quizResponsiveHardening.css','utf8');
  assert.match(publicQuiz,/1<\/b> = Discordo totalmente/);
  assert.match(publicQuiz,/5<\/b> = Concordo totalmente/);
  assert.match(css,/grid-template-columns:repeat\(5,36px\)/);
  assert.match(css,/border-radius:999px/);
  assert.match(css,/\.qf-pmo-likert-header\{\s*display:none/);
});
