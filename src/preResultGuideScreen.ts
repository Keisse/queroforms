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
      padding:24px!important;
      overflow:hidden!important;
      display:block!important;
      border-radius:28px!important;
      background:linear-gradient(145deg,#eef7ff 0%,#e8f3fd 100%)!important;
      border:1px solid #dceaf5!important;
    }
    .qf-pre-result-placeholder{
      width:100%;height:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      gap:16px;align-items:stretch;
    }
    .qf-pre-result-stat{
      min-width:0;background:#fff;border:1px solid #d7e7f5;border-radius:20px;
      padding:22px 20px;display:flex;flex-direction:column;justify-content:flex-start;
      box-shadow:0 8px 22px rgba(31,111,195,.06);
    }
    .qf-pre-result-stat-icon{
      width:38px;height:38px;border-radius:12px;background:#edf6ff;color:#1479d0;
      display:grid;place-items:center;font-size:18px;margin-bottom:16px;
    }
    .qf-pre-result-stat-number{
      display:block;font-size:46px;line-height:1;font-weight:850;letter-spacing:-.035em;
      color:#1479d0;margin-bottom:12px;
    }
    .qf-pre-result-stat-number.compact{font-size:38px;line-height:1.02}
    .qf-pre-result-stat-copy{
      display:block;font-size:16px;line-height:1.32;font-weight:700;color:#173a5d;
    }
    .qf-pre-result-stat-copy sup{font-size:9px;vertical-align:super;margin-left:1px}
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
      width:100%;height:210px;border-radius:16px;background:linear-gradient(145deg,#eef7ff,#e8f3fd);
      border:1px solid #dceaf5;margin-bottom:16px;position:relative;overflow:hidden;padding:14px;
    }
    .qf-pre-result-builder-placeholder .qf-pre-result-placeholder{gap:9px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat{padding:12px 10px;border-radius:12px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-icon{width:25px;height:25px;border-radius:8px;font-size:12px;margin-bottom:8px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-number{font-size:29px;margin-bottom:7px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-number.compact{font-size:24px}
    .qf-pre-result-builder-placeholder .qf-pre-result-stat-copy{font-size:10px;line-height:1.2}
    @media(max-width:760px){
      .insight-view.qf-pre-result-guide-view>.insight-visual{
        height:470px!important;border-radius:22px!important;padding:16px!important;
      }
      .qf-pre-result-placeholder{grid-template-columns:1fr;gap:10px}
      .qf-pre-result-stat{
        padding:14px 16px;border-radius:16px;display:grid;
        grid-template-columns:38px 92px 1fr;align-items:center;gap:10px;
      }
      .qf-pre-result-stat-icon{width:34px;height:34px;border-radius:10px;margin:0;font-size:15px}
      .qf-pre-result-stat-number,.qf-pre-result-stat-number.compact{font-size:31px;margin:0}
      .qf-pre-result-stat-copy{font-size:13px;line-height:1.25}
      .insight-view.qf-pre-result-guide-view>small{margin-top:16px!important}
    }
  `;
  document.head.appendChild(style);
}

const PRE_RESULT_STATS_HTML = `
  <div class="qf-pre-result-placeholder" aria-label="Dados sobre inteligência artificial e gestão de projetos">
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-icon" aria-hidden="true">⚙️</span>
      <span class="qf-pre-result-stat-number">80%</span>
      <span class="qf-pre-result-stat-copy">das tarefas de gestão de projetos serão executadas por IA até 2030<sup>1</sup></span>
    </div>
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-icon" aria-hidden="true">↗</span>
      <span class="qf-pre-result-stat-number">86%</span>
      <span class="qf-pre-result-stat-copy">das empresas classificam IA e big data como competências prioritárias para sua força de trabalho<sup>2</sup></span>
    </div>
    <div class="qf-pre-result-stat">
      <span class="qf-pre-result-stat-icon" aria-hidden="true">✦</span>
      <span class="qf-pre-result-stat-number compact">Apenas 1%</span>
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
    if (visual) {
      visual.querySelector('.qf-pre-result-placeholder')?.remove();
      renderPreResultPlaceholder(visual);
    }

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
