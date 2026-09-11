import test from 'node:test';
import assert from 'node:assert/strict';
import { gpIaSteps, scoreResult } from '../src/data/gpIa.ts';
import { validateSurveyStructure } from '../src/lib/surveyValidator.ts';

function extremeAnswers(mode:'min'|'max'){
  const answers:Record<string,string>={};
  for(const step of gpIaSteps){
    if(step.kind!=='question'||step.input==='multi') continue;
    const scored=step.options.filter(option=>typeof option.score==='number');
    if(scored.length<2) continue;
    const sorted=[...scored].sort((a,b)=>(a.score as number)-(b.score as number));
    answers[step.id]=(mode==='min'?sorted[0]:sorted[sorted.length-1]).value;
  }
  return answers;
}

test('formulario padrao do codigo permanece estruturalmente publicavel',()=>{
  const validation=validateSurveyStructure(gpIaSteps);
  assert.equal(validation.valid,true,validation.errors.join('\n'));
});

test('todas as respostas minimas normalizam o score geral para zero',()=>{
  const result=scoreResult(gpIaSteps,extremeAnswers('min'));
  assert.equal(result.pct,0);
  assert.equal(result.level,1);
});

test('todas as respostas maximas normalizam o score geral para cem',()=>{
  const result=scoreResult(gpIaSteps,extremeAnswers('max'));
  assert.equal(result.pct,100);
  assert.equal(result.level,4);
});

test('mapa final possui todas as seis dimensoes obrigatorias',()=>{
  const result=scoreResult(gpIaSteps,extremeAnswers('max'));
  for(const dimension of ['planejamento','riscos','decisao','comunicacao','automacao','confianca']){
    assert.equal(result.dimensions[dimension],100,`dimensão ${dimension} não chegou a 100%`);
  }
});
