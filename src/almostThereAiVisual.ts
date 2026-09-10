const STYLE_ID = 'qf-almost-there-ai-visual-styles';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .insight-visual.qf-almost-there-ai-host{
      position:relative!important;
      overflow:hidden!important;
      display:block!important;
      padding:0!important;
      background:linear-gradient(180deg,#eef6fd 0%,#eaf3fb 100%)!important;
      color:#1f6fc3!important;
      isolation:isolate;
    }
    .qf-almost-ai-scene{position:absolute;inset:0;overflow:hidden}
    .qf-almost-ai-halo{
      position:absolute;width:290px;height:290px;left:50%;top:50%;
      transform:translate(-50%,-50%);border-radius:50%;
      background:radial-gradient(circle,rgba(30,111,196,.16),rgba(30,111,196,.05) 45%,transparent 70%);
      animation:qf-almost-breathe 3s ease-in-out infinite;
    }
    .qf-almost-ai-ring{
      position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      border:1px solid rgba(31,111,195,.18);border-radius:50%;
    }
    .qf-almost-ai-ring.r1{width:170px;height:170px;animation:qf-almost-spin 18s linear infinite}
    .qf-almost-ai-ring.r2{width:118px;height:118px;animation:qf-almost-spin-reverse 12s linear infinite}
    .qf-almost-ai-core{
      position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      width:84px;height:84px;border-radius:23px;
      background:linear-gradient(180deg,#2c84e2,#1f6fc3);
      display:grid;place-items:center;color:#fff;font-size:26px;font-weight:800;
      box-shadow:0 12px 28px rgba(31,111,195,.24);
      animation:qf-almost-core 2.8s ease-in-out infinite;
    }
    .qf-almost-ai-core:after{
      content:'';position:absolute;inset:-7px;border-radius:29px;
      border:1px solid rgba(43,134,234,.22)
    }
    .qf-almost-ai-chip{
      position:absolute;padding:7px 11px;border-radius:13px;
      background:rgba(255,255,255,.84);border:1px solid rgba(31,111,195,.12);
      font-size:11px;font-weight:700;color:#2c5e92;
      box-shadow:0 5px 15px rgba(25,55,85,.05);white-space:nowrap;
      animation:qf-almost-float 4s ease-in-out infinite;
    }
    .qf-almost-ai-chip.live:before{
      content:'';display:inline-block;width:7px;height:7px;border-radius:50%;
      background:#2acb61;margin-right:7px;vertical-align:1px;
      animation:qf-almost-live 1.5s infinite;
    }
    .qf-almost-ai-line{
      position:absolute;height:2px;
      background:linear-gradient(90deg,transparent,rgba(43,134,234,.6),transparent);
      transform-origin:left center;
    }
    .qf-almost-ai-line:after{
      content:'';position:absolute;top:50%;left:0;width:8px;height:8px;
      border-radius:50%;background:#2b86ea;transform:translateY(-50%);
      animation:qf-almost-travel 2.8s linear infinite;
    }
    .qf-almost-ai-node{
      position:absolute;width:10px;height:10px;border-radius:50%;background:#2b86ea;
      animation:qf-almost-pulse 2.2s infinite;
    }
    .qf-almost-ai-bars{
      position:absolute;left:5%;bottom:9%;width:128px;height:64px;border-radius:16px;
      background:rgba(255,255,255,.64);display:flex;align-items:flex-end;gap:8px;
      padding:10px;border:1px solid rgba(31,111,195,.1);
    }
    .qf-almost-ai-bar{
      width:16px;border-radius:8px 8px 3px 3px;
      background:linear-gradient(180deg,#91c2f4,#2a83e5);
      animation:qf-almost-bar 2.4s ease-in-out infinite;transform-origin:bottom;
    }
    .qf-almost-ai-scan{
      position:absolute;inset:0;
      background:linear-gradient(180deg,transparent,rgba(43,134,234,.08),transparent);
      transform:translateY(-120%);animation:qf-almost-scan 3.5s linear infinite;
      pointer-events:none;
    }
    @keyframes qf-almost-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
    @keyframes qf-almost-spin-reverse{to{transform:translate(-50%,-50%) rotate(-360deg)}}
    @keyframes qf-almost-breathe{50%{transform:translate(-50%,-50%) scale(1.06)}}
    @keyframes qf-almost-core{50%{transform:translate(-50%,-50%) scale(1.05)}}
    @keyframes qf-almost-float{50%{transform:translateY(-5px)}}
    @keyframes qf-almost-live{0%{box-shadow:0 0 0 0 rgba(42,203,97,.35)}70%{box-shadow:0 0 0 8px rgba(42,203,97,0)}100%{box-shadow:0 0 0 0 rgba(42,203,97,0)}}
    @keyframes qf-almost-pulse{0%{box-shadow:0 0 0 0 rgba(43,134,234,.32)}70%{box-shadow:0 0 0 11px rgba(43,134,234,0)}100%{box-shadow:0 0 0 0 rgba(43,134,234,0)}}
    @keyframes qf-almost-travel{0%{left:0;opacity:0}12%,88%{opacity:1}100%{left:calc(100% - 8px);opacity:0}}
    @keyframes qf-almost-scan{to{transform:translateY(120%)}}
    @keyframes qf-almost-bar{50%{transform:scaleY(1.12)}}
    @media(max-width:640px){
      .qf-almost-ai-chip{font-size:9px;padding:5px 8px}
      .qf-almost-ai-bars{width:104px;height:54px;gap:6px;padding:8px}
      .qf-almost-ai-bar{width:13px}
      .qf-almost-ai-ring.r1{width:145px;height:145px}
      .qf-almost-ai-ring.r2{width:100px;height:100px}
      .qf-almost-ai-core{width:72px;height:72px;border-radius:20px;font-size:22px}
    }
    @media(prefers-reduced-motion:reduce){
      .qf-almost-ai-scene *{animation:none!important}
    }
  `;
  document.head.appendChild(style);
}

function applyAlmostThereAiVisual() {
  if (!window.location.pathname.startsWith('/d/')) return;

  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    const eyebrow = normalizeText(view.querySelector('small')?.textContent || '');
    const title = normalizeText(view.querySelector('h1')?.textContent || '');
    if (eyebrow !== 'quase la' || !title.includes('padrao claro')) return;

    const visual = view.querySelector<HTMLElement>('.insight-visual');
    if (!visual || visual.dataset.qfAlmostThereAi === 'true') return;

    visual.dataset.qfAlmostThereAi = 'true';
    visual.classList.add('qf-almost-there-ai-host');
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', 'Inteligência artificial interpretando os dados do diagnóstico em tempo real');
    visual.innerHTML = `
      <div class="qf-almost-ai-scene" aria-hidden="true">
        <div class="qf-almost-ai-halo"></div>
        <div class="qf-almost-ai-scan"></div>
        <div class="qf-almost-ai-ring r1"></div>
        <div class="qf-almost-ai-ring r2"></div>
        <div class="qf-almost-ai-core">IA</div>

        <div class="qf-almost-ai-line" style="width:14%;left:43%;top:39%;transform:rotate(-24deg)"></div>
        <div class="qf-almost-ai-line" style="width:14%;left:41%;top:52%;transform:rotate(196deg)"></div>
        <div class="qf-almost-ai-line" style="width:14%;left:54%;top:49%;transform:rotate(24deg)"></div>
        <div class="qf-almost-ai-line" style="width:14%;left:53%;top:58%;transform:rotate(143deg)"></div>

        <div class="qf-almost-ai-node" style="left:34%;top:31%"></div>
        <div class="qf-almost-ai-node" style="right:33%;top:34%;animation-delay:.5s"></div>
        <div class="qf-almost-ai-node" style="left:39%;bottom:20%;animation-delay:1s"></div>
        <div class="qf-almost-ai-node" style="right:37%;bottom:19%;animation-delay:1.4s"></div>

        <div class="qf-almost-ai-chip live" style="left:5%;top:11%">interpretando dados</div>
        <div class="qf-almost-ai-chip" style="right:6%;top:12%;animation-delay:.7s">confiança 78%</div>
        <div class="qf-almost-ai-chip" style="left:12%;top:39%;animation-delay:1.4s">uso atual ↗</div>
        <div class="qf-almost-ai-chip" style="right:11%;top:42%;animation-delay:.4s">decisão +12%</div>
        <div class="qf-almost-ai-chip" style="right:6%;bottom:11%;animation-delay:1.1s">padrões em tempo real</div>

        <div class="qf-almost-ai-bars">
          <div class="qf-almost-ai-bar" style="height:19px"></div>
          <div class="qf-almost-ai-bar" style="height:35px;animation-delay:.3s"></div>
          <div class="qf-almost-ai-bar" style="height:48px;animation-delay:.6s"></div>
          <div class="qf-almost-ai-bar" style="height:29px;animation-delay:.9s"></div>
        </div>
      </div>
    `;
  });
}

function startAlmostThereAiVisual() {
  ensureStyles();
  applyAlmostThereAiVisual();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyAlmostThereAiVisual();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAlmostThereAiVisual, { once: true });
} else {
  startAlmostThereAiVisual();
}
