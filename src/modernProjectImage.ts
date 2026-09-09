const MODERN_PROJECT_IMAGE = '/context/gestao-moderna-projetos.webp';

function installModernProjectImage() {
  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    const eyebrow = view.querySelector('small')?.textContent?.trim().toLowerCase();
    if (eyebrow !== 'gestão moderna de projetos') return;

    const visual = view.querySelector<HTMLElement>('.insight-visual');
    if (!visual || visual.dataset.modernProjectImageReady === 'true') return;

    visual.dataset.modernProjectImageReady = 'true';
    visual.style.padding = '0';
    visual.style.overflow = 'hidden';
    visual.style.display = 'block';
    visual.innerHTML = `<img src="${MODERN_PROJECT_IMAGE}" alt="De organizadores a agentes de mudança" style="width:100%;height:100%;display:block;object-fit:cover;" />`;
  });
}

function startModernProjectImage() {
  installModernProjectImage();
  const observer = new MutationObserver(installModernProjectImage);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startModernProjectImage, { once: true });
} else {
  startModernProjectImage();
}
