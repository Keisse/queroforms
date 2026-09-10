export {};

const INTRO_IMAGE_MARKER = /\s*\[\[QF_INTRO_IMAGE:([^\]]+)\]\]\s*/;
const FALLBACK_IMAGE = '/certificado-final.svg';
const STYLE_ID = 'qf-intro-image-editor-styles';

function parseIntroBody(raw:string){
  const match = raw.match(INTRO_IMAGE_MARKER);
  return {
    body: raw.replace(INTRO_IMAGE_MARKER,'').trim(),
    imageUrl: match?.[1]?.trim() || '',
  };
}

function composeIntroBody(body:string,imageUrl:string){
  const clean = body.replace(INTRO_IMAGE_MARKER,'').trim();
  const url = imageUrl.trim();
  return url ? `${clean}${clean?'\n':''}[[QF_INTRO_IMAGE:${url}]]` : clean;
}

function isValidImageUrl(value:string){
  if(!value.trim()) return true;
  try{
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  }catch{
    return value.trim().startsWith('/');
  }
}

function setReactFieldValue(field:HTMLTextAreaElement,value:string){
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
  descriptor?.set?.call(field,value);
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
}

function ensureStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .certificate-image-wrap,.builder-certificate-image-wrap{background:none!important;background-image:none!important;overflow:hidden!important}
    .certificate-image,.builder-certificate-image-wrap img{position:static!important;inset:auto!important;display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;opacity:1!important;pointer-events:auto!important}
    .qf-intro-image-editor{margin:0 0 14px;padding:12px;border:1px solid #d7e2eb;border-radius:14px;background:#f8fbfe}
    .qf-intro-image-editor label{display:block;font-size:13px;font-weight:700;margin:0 0 7px}
    .qf-intro-image-editor input,.qf-intro-image-editor textarea{width:100%;box-sizing:border-box;border:1px solid #cfdce7;border-radius:10px;background:#fff;color:#17324d;font:inherit;padding:10px 11px}
    .qf-intro-image-editor textarea{min-height:72px;resize:vertical;margin-bottom:12px}
    .qf-intro-image-editor input:focus,.qf-intro-image-editor textarea:focus{outline:2px solid rgba(20,121,208,.15);border-color:#78aeda}
    .qf-intro-image-preview{width:100%;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:#eaf4fd;margin:10px 0;display:grid;place-items:center;color:#7b8ea0;font-size:12px;text-align:center}
    .qf-intro-image-preview img{width:100%;height:100%;display:block;object-fit:cover}
    .qf-intro-image-help{display:block;color:#7b8ea0;font-size:11px;line-height:1.45;margin-top:8px}
    .qf-intro-image-status{display:block;min-height:16px;margin-top:7px;color:#1479d0;font-size:11px;font-weight:700}
    .qf-intro-image-status.error{color:#b93838}
  `;
  document.head.appendChild(style);
}

function selectedStepIsIntro(){
  const active = document.querySelector<HTMLElement>('.step-item.active');
  return active?.querySelector('small')?.textContent?.trim() === 'intro';
}

function findQuestionField(){
  const panel = document.querySelector<HTMLElement>('.props-panel');
  if(!panel) return null;
  const labels = Array.from(panel.querySelectorAll<HTMLLabelElement>('label'));
  const label = labels.find(item=>item.textContent?.trim()==='Pergunta' && !item.closest('.qf-intro-image-editor'));
  const field = label?.nextElementSibling;
  if(!label || !(field instanceof HTMLTextAreaElement)) return null;
  return {panel,label,field};
}

function renderPreview(container:HTMLElement,url:string){
  const finalUrl = url.trim() || FALLBACK_IMAGE;
  if(container.dataset.url === finalUrl && container.querySelector('img')) return;
  container.dataset.url = finalUrl;
  container.innerHTML='';
  const img = document.createElement('img');
  img.src = finalUrl;
  img.alt = 'Prévia da imagem da tela inicial';
  img.onerror = ()=>{ container.innerHTML='<span>Não foi possível carregar esta imagem.</span>'; };
  container.appendChild(img);
}

function updateBuilderCanvas(rawBody:string){
  const parsed = parseIntroBody(rawBody);
  const wrap = document.querySelector<HTMLElement>('.builder-certificate-image-wrap');
  const img = wrap?.querySelector<HTMLImageElement>('img');
  if(img){
    const nextSrc = parsed.imageUrl || FALLBACK_IMAGE;
    if(img.getAttribute('src') !== nextSrc) img.src = nextSrc;
  }
  const question = document.querySelector<HTMLElement>('.builder-intro-question');
  if(question && question.textContent !== parsed.body) question.textContent = parsed.body;
}

function cleanupBuilderEditor(){
  document.querySelector('.qf-intro-image-editor')?.remove();
  document.querySelectorAll<HTMLElement>('[data-qf-intro-native-hidden="true"]').forEach(el=>{
    el.style.display='';
    delete el.dataset.qfIntroNativeHidden;
  });
}

function ensureBuilderEditor(){
  if(!window.location.pathname.startsWith('/builder/')) return;
  if(!selectedStepIsIntro()){
    cleanupBuilderEditor();
    return;
  }

  const found = findQuestionField();
  if(!found) return;
  const {panel,label,field} = found;
  const parsed = parseIntroBody(field.value);

  label.style.display='none';
  field.style.display='none';
  label.dataset.qfIntroNativeHidden='true';
  field.dataset.qfIntroNativeHidden='true';

  let editor = panel.querySelector<HTMLElement>('.qf-intro-image-editor');
  if(!editor){
    editor = document.createElement('div');
    editor.className='qf-intro-image-editor';
    editor.innerHTML=`
      <label>Pergunta</label>
      <textarea class="qf-intro-question-proxy"></textarea>
      <label>URL da imagem da Tela 1</label>
      <input class="qf-intro-image-url" type="url" placeholder="https://trentim.com/wp-content/uploads/.../certificado.webp" />
      <div class="qf-intro-image-preview"></div>
      <small class="qf-intro-image-help">Cole a URL direta da imagem. Depois clique em <b>Salvar edição desta tela</b> para guardar no navegador e em <b>Publicar</b> para atualizar o formulário público.</small>
      <small class="qf-intro-image-status"></small>
    `;
    panel.insertBefore(editor,label);
  }

  const proxy = editor.querySelector<HTMLTextAreaElement>('.qf-intro-question-proxy');
  const urlInput = editor.querySelector<HTMLInputElement>('.qf-intro-image-url');
  const preview = editor.querySelector<HTMLElement>('.qf-intro-image-preview');
  const status = editor.querySelector<HTMLElement>('.qf-intro-image-status');

  if(proxy && document.activeElement!==proxy && proxy.value!==parsed.body) proxy.value=parsed.body;
  if(urlInput && document.activeElement!==urlInput && urlInput.value!==parsed.imageUrl) urlInput.value=parsed.imageUrl;
  if(preview) renderPreview(preview,parsed.imageUrl);

  const apply = ()=>{
    if(!proxy || !urlInput) return;
    const imageUrl = urlInput.value.trim();
    if(!isValidImageUrl(imageUrl)){
      if(status){status.textContent='Use uma URL completa iniciando com http:// ou https://';status.classList.add('error');}
      return;
    }
    if(status){status.textContent='Alteração pronta para salvar nesta tela.';status.classList.remove('error');}
    const next = composeIntroBody(proxy.value,imageUrl);
    if(field.value!==next) setReactFieldValue(field,next);
    if(preview) renderPreview(preview,imageUrl);
    updateBuilderCanvas(next);
  };

  if(proxy && proxy.dataset.qfBound!=='true'){
    proxy.dataset.qfBound='true';
    proxy.addEventListener('input',apply);
  }
  if(urlInput && urlInput.dataset.qfBound!=='true'){
    urlInput.dataset.qfBound='true';
    urlInput.addEventListener('input',apply);
    urlInput.addEventListener('change',apply);
  }

  updateBuilderCanvas(field.value);
}

function applyPublicIntroImage(){
  if(!window.location.pathname.startsWith('/d/')) return;
  const card = document.querySelector<HTMLElement>('.intro-certificate-screen');
  const question = card?.querySelector<HTMLElement>('.intro-question');
  const img = card?.querySelector<HTMLImageElement>('.certificate-image');
  if(!card || !question || !img) return;

  const domText = question.textContent || '';
  let parsed:{body:string;imageUrl:string};
  if(INTRO_IMAGE_MARKER.test(domText)){
    parsed = parseIntroBody(domText);
    card.dataset.qfIntroCleanBody=parsed.body;
    card.dataset.qfIntroImageUrl=parsed.imageUrl;
  }else if(card.dataset.qfIntroCleanBody===domText){
    parsed={body:domText,imageUrl:card.dataset.qfIntroImageUrl||''};
  }else{
    parsed={body:domText,imageUrl:''};
    card.dataset.qfIntroCleanBody=domText;
    card.dataset.qfIntroImageUrl='';
  }

  if(question.textContent!==parsed.body) question.textContent=parsed.body;
  const nextSrc=parsed.imageUrl||FALLBACK_IMAGE;
  if(img.getAttribute('src')!==nextSrc) img.src=nextSrc;
}

function scheduleBuilderRefresh(){
  window.setTimeout(()=>requestAnimationFrame(ensureBuilderEditor),0);
  window.setTimeout(()=>requestAnimationFrame(ensureBuilderEditor),120);
}

function startBuilder(){
  ensureStyles();
  let attempts = 0;
  const timer = window.setInterval(()=>{
    attempts += 1;
    ensureBuilderEditor();
    if(document.querySelector('.props-panel') || attempts >= 24) window.clearInterval(timer);
  },200);

  document.addEventListener('click',event=>{
    if(event.target instanceof Element && event.target.closest('.step-item')) scheduleBuilderRefresh();
  },true);
}

function startPublic(){
  ensureStyles();
  applyPublicIntroImage();
  let attempts = 0;
  const timer = window.setInterval(()=>{
    attempts += 1;
    applyPublicIntroImage();
    const stage = document.querySelector('.quiz-stage');
    if(stage){
      window.clearInterval(timer);
      const observer = new MutationObserver(()=>requestAnimationFrame(applyPublicIntroImage));
      observer.observe(stage,{childList:true,subtree:true});
    }else if(attempts >= 24){
      window.clearInterval(timer);
    }
  },200);
}

function start(){
  if(window.location.pathname.startsWith('/builder/')) startBuilder();
  else if(window.location.pathname.startsWith('/d/')) startPublic();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
