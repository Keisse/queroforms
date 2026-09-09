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
