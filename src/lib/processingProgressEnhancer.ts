const PROCESSING_SELECTOR = '.processing-view';
const ENHANCED_ATTR = 'data-qf-processing-animation';

const style = document.createElement('style');
style.textContent = `
  .processing-view .process-lines > p,
  .processing-view .process-lines > div {
    transition: opacity .22s ease;
  }

  .processing-view .process-lines > .qf-processing-pending {
    opacity: .42;
  }

  .processing-view .process-lines > .qf-processing-active,
  .processing-view .process-lines > .qf-processing-complete {
    opacity: 1;
  }

  .processing-view .process-lines > div > i {
    width: 0;
    transition: none;
  }

  .processing-view .qf-processing-result-cta {
    animation: qf-processing-result-in .38s ease both;
  }

  @keyframes qf-processing-result-in {
    from { opacity: 0; transform: translateY(8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
document.head.appendChild(style);

function enhanceProcessingView(root: HTMLElement) {
  if (root.getAttribute(ENHANCED_ATTR) === 'true') return;

  const processLines = root.querySelector<HTMLElement>('.process-lines');
  const button = root.querySelector<HTMLButtonElement>('button.primary.big');
  if (!processLines || !button) return;

  const rows = Array.from(processLines.children);
  const labels = rows.filter((_, index) => index % 2 === 0) as HTMLElement[];
  const tracks = rows.filter((_, index) => index % 2 === 1) as HTMLElement[];
  const fills = tracks.map(track => track.querySelector<HTMLElement>('i'));
  const percentages = labels.map(label => label.querySelector<HTMLElement>('b'));

  if (labels.length < 3 || tracks.length < 3 || fills.some(fill => !fill) || percentages.some(value => !value)) return;

  root.setAttribute(ENHANCED_ATTR, 'true');
  button.hidden = true;

  labels.forEach((label, index) => {
    label.classList.remove('qf-processing-active', 'qf-processing-complete');
    label.classList.add('qf-processing-pending');
    tracks[index]?.classList.remove('qf-processing-active', 'qf-processing-complete');
    tracks[index]?.classList.add('qf-processing-pending');
    if (fills[index]) fills[index]!.style.width = '0%';
    if (percentages[index]) percentages[index]!.textContent = '0%';
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduceMotion ? 220 : 1450;
  const pause = reduceMotion ? 60 : 260;
  let frame = 0;
  let timeout = 0;
  let cancelled = false;

  const activate = (index: number) => {
    labels[index].classList.remove('qf-processing-pending');
    labels[index].classList.add('qf-processing-active');
    tracks[index].classList.remove('qf-processing-pending');
    tracks[index].classList.add('qf-processing-active');
  };

  const complete = (index: number) => {
    labels[index].classList.remove('qf-processing-active');
    labels[index].classList.add('qf-processing-complete');
    tracks[index].classList.remove('qf-processing-active');
    tracks[index].classList.add('qf-processing-complete');
  };

  const runStage = (index: number) => {
    if (cancelled || index >= 3) return;
    activate(index);
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const ratio = Math.min(1, (now - startedAt) / duration);
      const value = Math.min(100, Math.round(ratio * 100));
      fills[index]!.style.width = `${value}%`;
      percentages[index]!.textContent = `${value}%`;

      if (ratio < 1) {
        frame = window.requestAnimationFrame(tick);
        return;
      }

      fills[index]!.style.width = '100%';
      percentages[index]!.textContent = '100%';
      complete(index);

      if (index < 2) {
        timeout = window.setTimeout(() => runStage(index + 1), pause);
      } else {
        timeout = window.setTimeout(() => {
          if (cancelled || !document.body.contains(root)) return;
          button.hidden = false;
          button.classList.add('qf-processing-result-cta');
        }, pause);
      }
    };

    frame = window.requestAnimationFrame(tick);
  };

  runStage(0);

  const cleanupObserver = new MutationObserver(() => {
    if (document.body.contains(root)) return;
    cancelled = true;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
    cleanupObserver.disconnect();
  });
  cleanupObserver.observe(document.body, { childList: true, subtree: true });
}

function scan() {
  document.querySelectorAll<HTMLElement>(PROCESSING_SELECTOR).forEach(enhanceProcessingView);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scan, { once: true });
} else {
  scan();
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
