import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizPixelTracker, META_PIXEL_ID, type QuizPixelView } from '../src/lib/metaPixel.ts';

function browser(path='/d/gp-ia', search='') {
  const scripts: {id:string;src:string}[]=[];
  const storage=new Map<string,string>();
  const host={
    location:{pathname:path,search},
    document:{
      getElementById:(id:string)=>scripts.find(script=>script.id===id),
      createElement:()=>({id:'',src:'',async:false}),
      head:{appendChild:(script:{id:string;src:string})=>scripts.push(script)},
    },
    sessionStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)},
    fbq:undefined as undefined|{queue:unknown[][]},
  };
  const track=createQuizPixelTracker(host as unknown as Window);
  return {host,track,scripts,events:()=>host.fbq?.queue??[]};
}
const view:QuizPixelView={surveySlug:'gp-ia',stepId:'q1',stepKind:'question',stepIndex:2,attemptId:'attempt-1',preview:false};
const slugs=['gp-ia','pmo-vmo','tire-projeto-do-papel','gestao-agil-sem-bagunca','prompt-gp'];

for(const slug of slugs) test(`${slug}: PageView nas telas e Lead somente no resultado`,()=>{
  const b=browser(`/d/${slug==='prompt-gp'?'promptgp':slug}`);
  b.track({...view,surveySlug:slug});
  b.track({...view,surveySlug:slug}); // React effect replay / rerender.
  b.track({...view,surveySlug:slug,stepId:'processing',stepKind:'processing',stepIndex:3});
  assert.equal(b.events().filter(e=>e[2]==='Lead').length,0);
  const result={...view,surveySlug:slug,stepId:'result',stepKind:'result',stepIndex:4};
  b.track(result);
  b.track(result);
  b.track({...view,surveySlug:slug}); // Return to questions and result.
  b.track(result);
  assert.equal(b.events().filter(e=>e[0]==='init').length,1);
  assert.equal(b.events().filter(e=>e[2]==='PageView').length,5);
  assert.equal(b.events().filter(e=>e[2]==='Lead').length,1);
  assert.equal(b.scripts.length,1);
  assert.equal(b.events()[0][1],META_PIXEL_ID);
  assert.equal((b.events()[1][3] as {survey_slug:string}).survey_slug,slug);
  const resumed=createQuizPixelTracker(b.host as unknown as Window);
  resumed(result); // Reload/restored result: another page view, same conversion.
  assert.equal(b.events().filter(e=>e[2]==='Lead').length,1);
  resumed({...result,attemptId:'attempt-2'});
  assert.equal(b.events().filter(e=>e[2]==='Lead').length,2);
});

test('admin e todas as previas ficam fora dos publicos',()=>{
  for(const [path,search,preview] of [['/builder/gp-ia','',false],['/d/gp-ia','?preview=draft',false],['/d/gp-ia','',true]] as const){
    const b=browser(path,search);
    b.track({...view,preview});
    assert.equal(b.events().length,0);
    assert.equal(b.scripts.length,0);
  }
});

test('armazenamento indisponivel mantem a protecao de Lead na mesma tentativa',()=>{
  const b=browser();
  b.host.sessionStorage.getItem=()=>{throw new Error('blocked');};
  b.host.sessionStorage.setItem=()=>{throw new Error('blocked');};
  const result={...view,stepId:'result',stepKind:'result',stepIndex:4};
  assert.doesNotThrow(()=>b.track(result));
  b.track(view);
  b.track(result);
  assert.equal(b.events().filter(e=>e[2]==='Lead').length,1);
});

test('falha no carregamento do pixel nao interrompe o diagnostico',()=>{
  const b=browser();
  b.host.document.head.appendChild=()=>{throw new Error('blocked');};
  assert.doesNotThrow(()=>b.track(view));
});
