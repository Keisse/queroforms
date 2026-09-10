export {};

const PRE_RESULT_STYLE_ID = 'qf-pre-result-guide-screen-styles';

function normalizePreResultText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isPreResultGuideView(view: HTMLElement) {
  const eyebrow = normalizePreResultText(view.querySelector('small')?.textContent || '');
  const title = normalizePreResultText(view.querySelector('h1')?.textContent || '');
  return eyebrow === '487+ pessoas aprenderam ia conosco' || title.includes('vamos tornar a ia simples juntos');
}

function ensurePreResultStyles() {
  if (document.getElementById(PRE_RESULT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRE_RESULT_STYLE_ID;
  style.textContent = `
    .insight-view.qf-pre-result-guide-view{text-align:left!important}
    .insight-view.qf-pre-result-guide-view>.insight-visual{
      position:relative!important;
      height:300px!important;
      padding:0!important;
      overflow:hidden!important;
      display:block!important;
      border-radius:28px!important;
      background:linear-gradient(145deg,#eef7ff 0%,#e7f2fc 100%)!important;
      border:1px solid #dceaf5;
    }
    .qf-pre-result-placeholder{position:absolute;inset:0;overflow:hidden}
    .qf-pre-result-placeholder:before{
      content:'';position:absolute;width:310px;height:310px;right:-65px;top:-85px;border-radius:50%;
      background:radial-gradient(circle,rgba(45,139,235,.16),rgba(45,139,235,0) 70%);
    }
    .qf-pre-result-placeholder:after{
      content:'';position:absolute;width:230px;height:230px;left:-72px;bottom:-95px;border-radius:50%;
      background:radial-gradient(circle,rgba(45,139,235,.11),rgba(45,139,235,0) 70%);
    }
    .qf-pre-result-research{
      position:absolute;left:34px;bottom:30px;z-index:2;max-width:430px;
      background:rgba(255,255,255,.92);border:1px solid rgba(31,111,195,.14);
      border-radius:18px;padding:16px 20px;box-shadow:0 12px 30px rgba(31,74,116,.08);
      color:#173a5d;
    }
    .qf-pre-result-research small{display:block!important;margin:0 0 4px!important;color:#1479d0!important;font-size:11px!important;font-weight:800!important;letter-spacing:.08em!important;text-transform:uppercase!important}
    .qf-pre-result-research b{font-size:20px;line-height:1.3;display:block}
    .qf-pre-result-percent{
      position:absolute;right:56px;top:48px;z-index:2;font-size:72px;line-height:1;font-weight:900;color:#1479d0;
      opacity:.16;letter-spacing:-.05em;
    }
    .insight-view.qf-pre-result-guide-view>small{
      display:inline-flex!important;align-items:center!important;width:auto!important;margin:18px 0 14px!important;
      padding:8px 12px!important;border-radius:10px!important;background:#eef6fd!important;color:#1479d0!important;
      font-size:13px!important;font-weight:800!important;letter-spacing:0!important;text-transform:none!important;
    }
    .insight-view.qf-pre-result-guide-view>small:before{content:'🎓';margin-right:7px}
    .insight-view.qf-pre-result-guide-view>h1{text-align:left!important;margin-left:0!important;margin-right:0!important;max-width:820px!important}
    .insight-view.qf-pre-result-guide-view>h1 .qf-pre-result-blue{color:#1479d0}
    .insight-view.qf-pre-result-guide-view>p{text-align:left!important;margin-left:0!important;margin-right:0!important;max-width:820px!important}
    .insight-view.qf-pre-result-guide-view>.primary.big{margin-top:26px!important}
    .qf-pre-result-builder-placeholder{
      width:100%;height:190px;border-radius:16px;background:linear-gradient(145deg,#eef7ff,#e7f2fc);
      border:1px solid #dceaf5;margin-bottom:16px;position:relative;overflow:hidden;
    }
    .qf-pre-result-builder-placeholder .qf-pre-result-research{left:18px;bottom:16px;max-width:78%;padding:10px 12px;border-radius:12px}
    .qf-pre-result-builder-placeholder .qf-pre-result-research b{font-size:13px}
    .qf-pre-result-builder-placeholder .qf-pre-result-percent{right:20px;top:18px;font-size:46px}
    @media(max-width:640px){
      .insight-view.qf-pre-result-guide-view>.insight-visual{height:235px!important;border-radius:22px!important}
      .qf-pre-result-research{left:18px;right:18px;bottom:18px;max-width:none;padding:13px 15px}
      .qf-pre-result-research b{font-size:16px}
      .qf-pre-result-percent{right:24px;top:28px;font-size:56px}
      .insight-view.qf-pre-result-guide-view>small{margin-top:16px!important}
    }
  `;
  document.head.appendChild(style);
}

function renderPreResultPlaceholder(visual: HTMLElement) {
  if (visual.querySelector('.qf-context-upload-image') || visual.querySelector('img')) return;
  if (visual.querySelector('.qf-pre-result-placeholder')) return;
  visual.innerHTML = `
    <div class="qf-pre-result-placeholder" aria-hidden="true">
      <div class="qf-pre-result-percent">50%</div>
      <div class="qf-pre-result-research">
        <small>Pesquisa aponta</small>
        <b>50% das pessoas se sentem nervosas em relação à IA.</b>
      </div>
    </div>
  `;
}

function applyPreResultPublicScreen() {
  if (!window.location.pathname.startsWith('/d/')) return;
  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    if (!isPreResultGuideView(view)) return;
    view.classList.add('qf-pre-result-guide-view');

    const visual = view.querySelector<HTMLElement>('.insight-visual');
    if (visual) renderPreResultPlaceholder(visual);

    const h1 = view.querySelector<HTMLHeadingElement>('h1');
    if (h1 && !h1.dataset.qfPreResultStyled) {
      h1.dataset.qfPreResultStyled = 'true';
      h1.innerHTML = 'Você não está sozinho. Vamos tornar a <span class="qf-pre-result-blue">IA simples juntos.</span>';
    }
  });
}

function getBuilderFieldValue(labelText: string) {
  const panel = document.querySelector<HTMLElement>('.props-panel');
  if (!panel) return '';
  const labels = Array.from(panel.querySelectorAll<HTMLLabelElement>('label'));
  const label = labels.find(item => item.textContent?.trim() === labelText && !item.closest('.qf-context-image-editor'));
  const field = label?.nextElementSibling;
  return field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement ? field.value : '';
}

function applyPreResultBuilderPlaceholder() {
  if (!window.location.pathname.startsWith('/builder/')) return;
  const canvas = document.querySelector<HTMLElement>('.canvas-inner');
  if (!canvas) return;

  const eyebrow = normalizePreResultText(getBuilderFieldValue('Categoria (eyebrow)'));
  const title = normalizePreResultText(getBuilderFieldValue('Título'));
  const target = eyebrow === '487+ pessoas aprenderam ia conosco' || title.includes('vamos tornar a ia simples juntos');
  const existing = canvas.querySelector<HTMLElement>('.qf-pre-result-builder-placeholder');

  if (!target || canvas.querySelector('.qf-builder-context-image-preview')) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'qf-pre-result-builder-placeholder';
  placeholder.innerHTML = `
    <div class="qf-pre-result-percent">50%</div>
    <div class="qf-pre-result-research">
      <small>Pesquisa aponta</small>
      <b>50% das pessoas se sentem nervosas em relação à IA.</b>
    </div>
  `;
  canvas.prepend(placeholder);
}

function applyPreResultGuideScreen() {
  applyPreResultPublicScreen();
  applyPreResultBuilderPlaceholder();
}

function startPreResultGuideScreen() {
  ensurePreResultStyles();
  applyPreResultGuideScreen();
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPreResultGuideScreen();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPreResultGuideScreen, { once: true });
} else {
  startPreResultGuideScreen();
}
