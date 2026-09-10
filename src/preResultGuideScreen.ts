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
      height:260px!important;
      padding:0!important;
      overflow:hidden!important;
      display:block!important;
      border-radius:28px!important;
      background:#073c4b!important;
      border:1px solid #073c4b;
    }
    .qf-pre-result-placeholder{
      position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);
      align-items:stretch;background:#073c4b;color:#fff;padding:34px 30px;
    }
    .qf-pre-result-stat{
      min-width:0;padding:0 24px;display:flex;flex-direction:column;justify-content:flex-start;
    }
    .qf-pre-result-stat:first-child{padding-left:0}
    .qf-pre-result-stat:last-child{padding-right:0}
    .qf-pre-result-stat+.qf-pre-result-stat{border-left:2px solid rgba(255,255,255,.82)}
    .qf-pre-result-stat-number{
      display:block;font-size:48px;line-height:1;font-weight:500;letter-spacing:-.035em;
      color:#0085ad;margin-bottom:16px;
    }
    .qf-pre-result-stat-copy{
      display:block;font-size:20px;line-height:1.23;font-weight:750;color:#fff;
    }
    .qf-pre-result-stat-copy sup{font-size:10px;vertical-align:super;margin-left:1px}
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
      width:100%;height:190px;border-radius:16px;background:#073c4b;
      border:1px solid #073c4b;margin-bottom:16px;position:relative;overflow:hidden;
    }
    .qf-pre-result-builder-placeholder .qf-pre-result-placeholder{padding:20px 18px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat{padding:0 12px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat:first-child{padding-left:0}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat:last-child{padding-right:0}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-number{font-size:31px;margin-bottom:9px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-copy{font-size:12px;line-height:1.2}
    @media(max-width:760px){
      .insight-view.qf-pre-result-guide-view>.insight-visual{height:360px!important;border-radius:22px!important}
      .qf-pre-result-placeholder{grid-template-columns:1fr;padding:20px 22px}
      .qf-pre-result-stat{padding:14px 0;display:grid;grid-template-columns:92px 1fr;align-items:center;gap:10px}
      .qf-pre-result-stat:first-child{padding-top:0}
      .qf-pre-result-stat:last-child{padding-bottom:0}
      .qf-pre-result-stat+.qf-pre-result-stat{border-left:0;border-top:1px solid rgba(255,255,255,.6)}
      .qf-pre-result-stat-number{font-size:38px;margin:0}
      .qf-pre-result-stat-copy{font-size:15px;line-height:1.25}
      .insight-view.qf-pre-result-guide-view>small{margin-top:16px!important}
    }
  `;
  document.head.appendChild(style);
}

const PRE_RESULT_STATS_HTML = `
  <div class="qf-pre-result-placeholder" aria-label="Dados sobre inteligência artificial e gestão de projetos">
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-number">80%</span>
      <span class="qf-pre-result-stat-copy">das tarefas de gestão de projetos serão executadas por IA até 2030<sup>1</sup></span>
    </div>
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-number">86%</span>
      <span class="qf-pre-result-stat-copy">das empresas classificam IA e big data como competências prioritárias para sua força de trabalho<sup>2</sup></span>
    </div>
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-number">Apenas 1%</span>
      <span class="qf-pre-result-stat-copy">das organizações acreditam ter alcançado maturidade em GenAI, segundo pesquisa do PMI</span>
    </div>
  </div>
`;

function renderPreResultPlaceholder(visual: HTMLElement) {
  if (visual.querySelector('.qf-context-upload-image') || visual.querySelector('img')) return;
  if (visual.querySelector('.qf-pre-result-placeholder')) return;
  visual.innerHTML = PRE_RESULT_STATS_HTML;
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
  placeholder.innerHTML = PRE_RESULT_STATS_HTML;
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
