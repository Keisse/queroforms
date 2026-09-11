export {};

const PRE_RESULT_STYLE_ID = 'qf-pre-result-guide-screen-styles';
const PRE_RESULT_STEP_ID = 'insight-pre-result-guide';

function ensurePreResultStyles() {
  if (document.getElementById(PRE_RESULT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRE_RESULT_STYLE_ID;
  style.textContent = `
    .insight-view.qf-pre-result-guide-view{text-align:left!important}
    .insight-view.qf-pre-result-guide-view>.insight-visual{
      position:relative!important;
      height:280px!important;
      padding:22px!important;
      overflow:hidden!important;
      display:block!important;
      border-radius:28px!important;
      background:linear-gradient(145deg,#eef7ff 0%,#e8f3fd 100%)!important;
      border:1px solid #dceaf5!important;
    }
    .qf-pre-result-placeholder{
      width:100%;height:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      gap:14px;align-items:stretch;
    }
    .qf-pre-result-stat{
      min-width:0;background:#fff;border:1px solid #d7e7f5;border-radius:20px;
      padding:18px;display:flex;flex-direction:column;justify-content:flex-start;
      box-shadow:0 8px 22px rgba(31,111,195,.06);font-weight:400;
    }
    .qf-pre-result-stat-icon{
      width:34px;height:34px;border-radius:11px;background:#edf6ff;color:#1479d0;
      display:grid;place-items:center;font-size:16px;margin-bottom:12px;
    }
    .qf-pre-result-stat-number{
      display:block;font-size:38px;line-height:1;font-weight:700;letter-spacing:-.03em;
      color:#1479d0;margin-bottom:10px;
    }
    .qf-pre-result-stat-copy{display:block;font-size:13px;line-height:1.34;font-weight:400;color:#173a5d}
    .qf-pre-result-stat-copy sup{font-size:8px;vertical-align:super;margin-left:1px}
    .insight-view.qf-pre-result-guide-view>small{
      display:inline-flex!important;align-items:center!important;width:auto!important;margin:18px 0 14px!important;
      padding:8px 12px!important;border-radius:10px!important;background:#eef6fd!important;color:#1479d0!important;
      font-size:13px!important;font-weight:800!important;letter-spacing:0!important;text-transform:none!important;
    }
    .insight-view.qf-pre-result-guide-view>small:before{content:'🎓';margin-right:7px}
    .insight-view.qf-pre-result-guide-view>h1,
    .insight-view.qf-pre-result-guide-view>p{
      text-align:left!important;margin-left:0!important;margin-right:0!important;max-width:820px!important;
    }
    .insight-view.qf-pre-result-guide-view>.primary.big{margin-top:26px!important}
    @media(max-width:760px){
      .insight-view.qf-pre-result-guide-view>.insight-visual{height:390px!important;border-radius:22px!important;padding:14px!important}
      .qf-pre-result-placeholder{grid-template-columns:1fr;gap:9px}
      .qf-pre-result-stat{padding:12px 14px;border-radius:15px;display:grid;grid-template-columns:34px 78px 1fr;align-items:center;gap:9px}
      .qf-pre-result-stat-icon{width:30px;height:30px;border-radius:9px;margin:0;font-size:14px}
      .qf-pre-result-stat-number{font-size:27px;margin:0;font-weight:700}
      .qf-pre-result-stat-copy{font-size:12px;line-height:1.28;font-weight:400}
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
      <span class="qf-pre-result-stat-number">1%</span>
      <span class="qf-pre-result-stat-copy">das organizações acreditam ter alcançado maturidade em GenAI, segundo pesquisa do PMI</span>
    </div>
  </div>
`;

function applyPreResultPublicScreen() {
  if (!window.location.pathname.startsWith('/d/')) return;
  const view = document.querySelector<HTMLElement>(`.insight-view[data-step-id="${PRE_RESULT_STEP_ID}"]`);
  if (!view) return;

  view.classList.add('qf-pre-result-guide-view');
  const visual = view.querySelector<HTMLElement>('.insight-visual');
  if (!visual) return;

  if (visual.querySelector('img')) {
    visual.querySelector('.qf-pre-result-placeholder')?.remove();
    return;
  }

  if (!visual.querySelector('.qf-pre-result-placeholder')) {
    visual.innerHTML = PRE_RESULT_STATS_HTML;
  }
}

function startPreResultGuideScreen() {
  ensurePreResultStyles();
  applyPreResultPublicScreen();

  const stage = document.querySelector('.quiz-stage');
  if (!stage) return;

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPreResultPublicScreen();
    });
  });
  observer.observe(stage, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPreResultGuideScreen, { once: true });
} else {
  startPreResultGuideScreen();
}
