const SALARY_MULTIPLIERS = [1, 1.35, 1.70, 2.05] as const;

function parseCurrency(text: string) {
  const digits = text.replace(/\D/g, '');
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function softenAlmostThereStat() {
  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    const eyebrow = view.querySelector('small')?.textContent?.trim().toLowerCase();
    if (eyebrow !== 'quase lá') return;

    const stat = view.querySelector<HTMLElement>('.stat-box');
    if (stat && stat.style.fontWeight !== '400') stat.style.fontWeight = '400';
  });
}

function installSalaryContextProjection() {
  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    const eyebrow = view.querySelector('small')?.textContent?.trim().toLowerCase();
    if (eyebrow !== 'remuneração') return;

    const visual = view.querySelector<HTMLElement>('.insight-visual');
    if (!visual || visual.dataset.projectionReady === 'true') return;

    visual.dataset.projectionReady = 'true';
    visual.classList.add('qf-career-projection-host');
    visual.innerHTML = `
      <svg class="qf-career-projection" viewBox="0 0 720 320" role="img" aria-label="Projeção de evolução profissional: Sem GP, Com GP sem IA e Com GP mais IA">
        <line x1="60" y1="258" x2="680" y2="258" class="qf-projection-axis" />
        <line x1="60" y1="42" x2="60" y2="258" class="qf-projection-axis" />
        <line x1="76" y1="202" x2="650" y2="202" class="qf-projection-grid" />
        <line x1="76" y1="145" x2="650" y2="145" class="qf-projection-grid" />
        <line x1="76" y1="88" x2="650" y2="88" class="qf-projection-grid" />

        <text x="55" y="25" class="qf-projection-axis-label">$</text>
        <text x="60" y="282" text-anchor="middle" class="qf-projection-axis-label">Hoje</text>
        <text x="220" y="282" text-anchor="middle" class="qf-projection-axis-label">1 ano</text>
        <text x="380" y="282" text-anchor="middle" class="qf-projection-axis-label">2 anos</text>
        <text x="540" y="282" text-anchor="middle" class="qf-projection-axis-label">3 anos</text>

        <path d="M60 255 C155 253 225 246 300 236 C380 225 450 212 535 196" class="qf-projection-line qf-no-gp" />
        <path d="M60 255 C135 248 220 226 300 198 C380 168 455 136 535 111" class="qf-projection-line qf-gp" />
        <path d="M60 255 C140 244 215 214 295 170 C375 125 455 79 535 54" class="qf-projection-line qf-gp-ai" />

        <circle cx="535" cy="196" r="7" class="qf-projection-point qf-no-gp qf-point-1" />
        <circle cx="535" cy="111" r="8" class="qf-projection-point qf-gp qf-point-2" />
        <circle cx="535" cy="54" r="9" class="qf-projection-point qf-gp-ai qf-point-3" />

        <g class="qf-projection-callout qf-callout-1">
          <rect x="452" y="202" width="171" height="50" rx="16" class="qf-callout-bg qf-no-gp" />
          <text x="538" y="223" text-anchor="middle" class="qf-callout-title qf-callout-dark">Sem GP</text>
          <text x="538" y="242" text-anchor="middle" class="qf-callout-value qf-callout-dark">crescimento menor</text>
        </g>

        <g class="qf-projection-callout qf-callout-2">
          <rect x="444" y="116" width="190" height="50" rx="16" class="qf-callout-bg qf-gp" />
          <text x="539" y="137" text-anchor="middle" class="qf-callout-title qf-callout-dark">Com GP sem IA</text>
          <text x="539" y="156" text-anchor="middle" class="qf-callout-value qf-callout-dark">evolução consistente</text>
        </g>

        <g class="qf-projection-callout qf-callout-3">
          <rect x="430" y="4" width="210" height="58" rx="18" class="qf-callout-bg qf-gp-ai" />
          <path d="M527 62 L543 62 L535 76 Z" class="qf-callout-arrow" />
          <text x="535" y="27" text-anchor="middle" class="qf-callout-title qf-callout-light">Com GP + IA</text>
          <text x="535" y="49" text-anchor="middle" class="qf-callout-value qf-callout-light">maior projeção</text>
        </g>
      </svg>
    `;
  });
}

function updateSalaryProjection() {
  const chart = document.querySelector<HTMLElement>('.result-view .salary-chart');
  if (!chart) return;

  const values = Array.from(chart.querySelectorAll<HTMLElement>('.salary-value'));
  const bars = Array.from(chart.querySelectorAll<HTMLElement>('.salary-bar'));
  if (values.length < 4 || bars.length < 4) return;

  const baseline = parseCurrency(values[0].textContent || '');
  if (!baseline) return;

  const projection = SALARY_MULTIPLIERS.map(multiplier => Math.round(baseline * multiplier));
  const max = projection[projection.length - 1];

  projection.forEach((value, index) => {
    const formatted = formatCurrency(value);
    if (values[index].textContent !== formatted) values[index].textContent = formatted;

    const height = `${Math.round((value / max) * 100)}%`;
    if (bars[index].style.height !== height) bars[index].style.height = height;
  });
}

function applyFinalPolish() {
  softenAlmostThereStat();
  installSalaryContextProjection();
  updateSalaryProjection();
}

function startFinalPolish() {
  applyFinalPolish();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyFinalPolish();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startFinalPolish, { once: true });
} else {
  startFinalPolish();
}
