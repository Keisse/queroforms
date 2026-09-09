const MARKER_RE = /\s*\[\[QF_IMAGE:([^\]]+)\]\]\s*/;
const STYLE_ID = 'qf-context-image-editor-styles';

function parseSource(raw: string) {
  const match = raw.match(MARKER_RE);
  return {
    source: raw.replace(MARKER_RE, '').trim(),
    imageUrl: match?.[1]?.trim() || '',
  };
}

function composeSource(source: string, imageUrl: string) {
  const clean = source.trim();
  const url = imageUrl.trim();
  if (!url) return clean;
  return `${clean}${clean ? '\n' : ''}[[QF_IMAGE:${url}]]`;
}

function setReactTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  descriptor?.set?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function isValidImageUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function selectedStepIsInsight() {
  const active = document.querySelector<HTMLElement>('.step-item.active');
  return active?.querySelector('small')?.textContent?.trim() === 'insight';
}

function findSourceField() {
  const panel = document.querySelector<HTMLElement>('.props-panel');
  if (!panel) return null;
  const labels = Array.from(panel.querySelectorAll<HTMLLabelElement>('label'));
  const label = labels.find(item => item.textContent?.trim() === 'Fonte');
  const textarea = label?.nextElementSibling instanceof HTMLTextAreaElement ? label.nextElementSibling : null;
  return label && textarea ? { panel, label, textarea } : null;
}

function fieldValue(labelText: string) {
  const panel = document.querySelector<HTMLElement>('.props-panel');
  if (!panel) return '';
  const labels = Array.from(panel.querySelectorAll<HTMLLabelElement>('label'));
  const label = labels.find(item => item.textContent?.trim() === labelText && !item.classList.contains('qf-context-source-label'));
  const field = label?.nextElementSibling;
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) return field.value;
  return '';
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .qf-context-image-editor{margin:14px 0 4px}
    .qf-context-image-editor>label{display:block;font-size:13px;font-weight:700;margin:0 0 7px}
    .qf-context-image-box{border:1px solid #d7e2eb;background:#f8fbfe;border-radius:14px;padding:12px}
    .qf-context-image-url{width:100%;padding:10px 11px;border:1px solid #cfdce7;border-radius:10px;font:inherit;color:#17324d;background:#fff}
    .qf-context-image-url:focus{outline:2px solid rgba(20,121,208,.15);border-color:#78aeda}
    .qf-context-image-preview{height:132px;border-radius:11px;background:#eaf4fd;overflow:hidden;display:grid;place-items:center;color:#7b8ea0;font-size:12px;margin:10px 0}
    .qf-context-image-preview img{width:100%;height:100%;object-fit:cover;display:block}
    .qf-context-image-actions{display:flex;gap:7px;flex-wrap:wrap}
    .qf-context-image-actions .btn{padding:8px 11px}
    .qf-context-image-preview-btn{background:#1479d0!important;color:#fff!important;border-color:#1479d0!important}
    .qf-context-image-help{display:block;color:#8a99a8;font-size:11px;line-height:1.4;margin-top:8px}
    .qf-context-image-status{display:block;color:#1479d0;font-size:11px;font-weight:700;margin-top:7px;min-height:16px}
    .qf-context-image-status.error{color:#b93838}
    .qf-context-source-proxy{width:100%;min-height:68px;margin-bottom:2px}
    .qf-builder-context-image-preview{width:100%;height:190px;border-radius:16px;overflow:hidden;background:#eef7ff;margin-bottom:16px}
    .qf-builder-context-image-preview img{width:100%;height:100%;display:block;object-fit:cover}
    .insight-visual.qf-context-upload-host{padding:0!important;overflow:hidden!important;display:block!important}
    .insight-visual.qf-context-upload-host .qf-context-upload-image{width:100%;height:100%;display:block;object-fit:cover}
    .qf-context-preview-overlay{position:fixed;inset:0;background:rgba(15,30,50,.62);z-index:9999;display:grid;place-items:center;padding:24px;overflow:auto}
    .qf-context-preview-dialog{width:min(860px,96vw);background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(10,30,50,.25);overflow:hidden}
    .qf-context-preview-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid #e7edf2}
    .qf-context-preview-head b{font-size:15px;color:#17324d}
    .qf-context-preview-close{border:1px solid #d7e2eb;background:#fff;border-radius:9px;padding:7px 10px;cursor:pointer;font-weight:700;color:#52697e}
    .qf-context-preview-stage{padding:34px 26px 40px;background:#fff}
    .qf-context-preview-stage .insight-view{max-width:760px;margin:0 auto;text-align:center}
    .qf-context-preview-stage .insight-visual{width:100%;height:300px;border-radius:28px;background:#edf7ff;display:grid;place-items:center;margin-bottom:24px;overflow:hidden}
    .qf-context-preview-stage .insight-visual img{width:100%;height:100%;object-fit:cover;display:block}
    .qf-context-preview-stage .qf-preview-placeholder{font-size:13px;color:#7c91a5}
    .qf-context-preview-stage .insight-view>small{display:block;color:#1479d0;text-transform:uppercase;font-weight:800;letter-spacing:.06em;margin:0 0 14px}
    .qf-context-preview-stage .insight-view h1{font-size:36px;line-height:1.12;margin:0 auto 16px;color:#17324d}
    .qf-context-preview-stage .insight-view>p{font-size:18px;line-height:1.55;color:#63788c;margin:0 auto 20px}
    .qf-context-preview-stage .stat-box{margin:20px 0;padding:18px;border-radius:16px;background:#f7fbff;border:1px solid #dceaf5;font-weight:700;color:#17324d}
    .qf-context-preview-stage .source-note{font-size:12px;color:#8a99a8;margin:18px 0}
    .qf-context-preview-stage .primary.big{width:100%;padding:16px;border:0;border-radius:12px;background:#1479d0;color:#fff;font-weight:800;font-size:16px}
    @media(max-width:640px){
      .qf-context-preview-overlay{padding:10px}
      .qf-context-preview-stage{padding:22px 16px 26px}
      .qf-context-preview-stage .insight-visual{height:210px;border-radius:20px}
      .qf-context-preview-stage .insight-view h1{font-size:29px}
      .qf-context-preview-stage .insight-view>p{font-size:16px}
    }
  `;
  document.head.appendChild(style);
}

function renderBuilderCanvasImage(imageUrl: string) {
  const canvas = document.querySelector<HTMLElement>('.canvas-inner');
  if (!canvas) return;
  let preview = canvas.querySelector<HTMLElement>('.qf-builder-context-image-preview');
  if (!imageUrl) {
    preview?.remove();
    return;
  }
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'qf-builder-context-image-preview';
    canvas.prepend(preview);
  }
  const existing = preview.querySelector<HTMLImageElement>('img');
  if (existing?.getAttribute('src') === imageUrl) return;
  preview.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="Imagem da tela de contexto" />`;
}

function closeContextPreview() {
  document.querySelector('.qf-context-preview-overlay')?.remove();
}

function openContextPreview() {
  const sourceField = findSourceField();
  if (!sourceField) return;
  const parsed = parseSource(sourceField.textarea.value);
  const urlInput = document.querySelector<HTMLInputElement>('.qf-context-image-url');
  const imageUrl = urlInput?.value.trim() || parsed.imageUrl;

  if (!isValidImageUrl(imageUrl)) {
    const status = document.querySelector<HTMLElement>('.qf-context-image-status');
    if (status) {
      status.textContent = 'Corrija a URL antes de abrir a prévia.';
      status.classList.add('error');
    }
    return;
  }

  const eyebrow = fieldValue('Categoria (eyebrow)');
  const title = fieldValue('Título');
  const body = fieldValue('Texto');
  const stat = fieldValue('Destaque (stat)');
  const sourceProxy = document.querySelector<HTMLTextAreaElement>('.qf-context-source-proxy');
  const source = sourceProxy?.value || parsed.source;

  closeContextPreview();
  const overlay = document.createElement('div');
  overlay.className = 'qf-context-preview-overlay';
  overlay.innerHTML = `
    <div class="qf-context-preview-dialog" role="dialog" aria-modal="true" aria-label="Pré-visualização da tela de contexto">
      <div class="qf-context-preview-head">
        <b>Pré-visualização da tela de contexto</b>
        <button class="qf-context-preview-close" type="button">Fechar</button>
      </div>
      <div class="qf-context-preview-stage">
        <div class="insight-view">
          <div class="insight-visual qf-context-upload-host">
            ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="Imagem da tela de contexto" />` : '<span class="qf-preview-placeholder">Sem imagem configurada</span>'}
          </div>
          ${eyebrow ? `<small>${escapeHtml(eyebrow)}</small>` : ''}
          <h1>${escapeHtml(title || 'Título da tela')}</h1>
          ${body ? `<p>${escapeHtml(body)}</p>` : ''}
          ${stat ? `<div class="stat-box">${escapeHtml(stat)}</div>` : ''}
          ${source ? `<div class="source-note">Fonte: ${escapeHtml(source)}</div>` : ''}
          <button class="primary big" type="button">Continuar</button>
        </div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeContextPreview();
  });
  overlay.querySelector('.qf-context-preview-close')?.addEventListener('click', closeContextPreview);
  document.body.appendChild(overlay);
}

function ensureBuilderEditor() {
  if (!window.location.pathname.startsWith('/builder/')) return;
  const sourceField = findSourceField();
  const isInsight = selectedStepIsInsight();

  if (!sourceField || !isInsight) {
    document.querySelector('.qf-context-image-editor')?.remove();
    document.querySelector('.qf-context-source-label')?.remove();
    document.querySelector('.qf-context-source-proxy')?.remove();
    renderBuilderCanvasImage('');
    closeContextPreview();
    return;
  }

  const { panel, label, textarea } = sourceField;
  const parsed = parseSource(textarea.value);
  renderBuilderCanvasImage(parsed.imageUrl);

  label.style.display = 'none';
  textarea.style.display = 'none';
  textarea.dataset.qfRawSource = 'true';

  let editor = panel.querySelector<HTMLElement>('.qf-context-image-editor');
  let proxy = panel.querySelector<HTMLTextAreaElement>('.qf-context-source-proxy');

  if (!editor) {
    editor = document.createElement('div');
    editor.className = 'qf-context-image-editor';
    editor.innerHTML = `
      <label>URL da imagem</label>
      <div class="qf-context-image-box">
        <input class="qf-context-image-url" type="url" placeholder="https://trentim.com/wp-content/uploads/.../imagem.webp" />
        <div class="qf-context-image-preview"><span>Nenhuma imagem configurada</span></div>
        <div class="qf-context-image-actions">
          <button class="btn qf-context-image-preview-btn" type="button">Pré-visualizar tela</button>
          <button class="btn qf-context-image-remove" type="button">Limpar URL</button>
        </div>
        <small class="qf-context-image-help">Cole a URL direta da imagem do WordPress. Use “Pré-visualizar tela” para conferir o encaixe antes de publicar.</small>
        <small class="qf-context-image-status"></small>
      </div>
    `;
    panel.insertBefore(editor, label);

    const proxyLabel = document.createElement('label');
    proxyLabel.className = 'qf-context-source-label';
    proxyLabel.textContent = 'Fonte';
    panel.insertBefore(proxyLabel, label);

    proxy = document.createElement('textarea');
    proxy.className = 'qf-context-source-proxy';
    panel.insertBefore(proxy, label);
  }

  const preview = editor.querySelector<HTMLElement>('.qf-context-image-preview');
  const status = editor.querySelector<HTMLElement>('.qf-context-image-status');
  const urlInput = editor.querySelector<HTMLInputElement>('.qf-context-image-url');
  const previewButton = editor.querySelector<HTMLButtonElement>('.qf-context-image-preview-btn');
  const removeButton = editor.querySelector<HTMLButtonElement>('.qf-context-image-remove');
  proxy = panel.querySelector<HTMLTextAreaElement>('.qf-context-source-proxy');

  if (urlInput && document.activeElement !== urlInput && urlInput.value !== parsed.imageUrl) {
    urlInput.value = parsed.imageUrl;
  }

  if (preview) {
    preview.innerHTML = parsed.imageUrl
      ? `<img src="${escapeHtml(parsed.imageUrl)}" alt="Prévia da imagem" />`
      : '<span>Nenhuma imagem configurada</span>';
  }
  if (proxy && document.activeElement !== proxy && proxy.value !== parsed.source) proxy.value = parsed.source;

  if (proxy && proxy.dataset.qfBound !== 'true') {
    proxy.dataset.qfBound = 'true';
    proxy.addEventListener('input', () => {
      const currentRaw = findSourceField()?.textarea;
      if (!currentRaw) return;
      const currentImage = parseSource(currentRaw.value).imageUrl;
      setReactTextareaValue(currentRaw, composeSource(proxy!.value, currentImage));
    });
  }

  if (urlInput && urlInput.dataset.qfBound !== 'true') {
    urlInput.dataset.qfBound = 'true';
    const applyUrl = () => {
      const current = findSourceField()?.textarea;
      if (!current) return;
      const currentParsed = parseSource(current.value);
      const nextUrl = urlInput.value.trim();

      if (!isValidImageUrl(nextUrl)) {
        if (status) {
          status.textContent = 'Use uma URL completa começando com http:// ou https://';
          status.classList.add('error');
        }
        return;
      }

      if (status) {
        status.classList.remove('error');
        status.textContent = nextUrl ? 'URL configurada ✓ Você já pode pré-visualizar antes de publicar.' : '';
      }
      setReactTextareaValue(current, composeSource(currentParsed.source, nextUrl));
      renderBuilderCanvasImage(nextUrl);
      requestAnimationFrame(ensureBuilderEditor);
    };
    urlInput.addEventListener('input', applyUrl);
    urlInput.addEventListener('change', applyUrl);
  }

  if (previewButton && previewButton.dataset.qfBound !== 'true') {
    previewButton.dataset.qfBound = 'true';
    previewButton.addEventListener('click', openContextPreview);
  }

  if (removeButton && removeButton.dataset.qfBound !== 'true') {
    removeButton.dataset.qfBound = 'true';
    removeButton.addEventListener('click', () => {
      const current = findSourceField()?.textarea;
      if (!current) return;
      const currentParsed = parseSource(current.value);
      setReactTextareaValue(current, currentParsed.source);
      if (urlInput) urlInput.value = '';
      renderBuilderCanvasImage('');
      if (status) {
        status.classList.remove('error');
        status.textContent = 'URL removida. Clique em Publicar para aplicar.';
      }
      requestAnimationFrame(ensureBuilderEditor);
    });
  }
}

function applyPublicContextImages() {
  if (!window.location.pathname.startsWith('/d/')) return;
  document.querySelectorAll<HTMLElement>('.insight-view').forEach(view => {
    const sourceNote = view.querySelector<HTMLElement>('.source-note');
    const noteRaw = sourceNote?.textContent?.replace(/^Fonte:\s*/i, '') || '';
    const parsed = parseSource(noteRaw);
    const imageUrl = view.dataset.qfContextImageUrl || parsed.imageUrl;
    const cleanSource = view.dataset.qfContextCleanSource ?? parsed.source;

    if (parsed.imageUrl) {
      view.dataset.qfContextImageUrl = parsed.imageUrl;
      view.dataset.qfContextCleanSource = parsed.source;
    }

    if (!imageUrl) return;
    const visual = view.querySelector<HTMLElement>('.insight-visual');
    if (!visual) return;

    if (visual.dataset.qfContextImageUrl !== imageUrl || !visual.querySelector('.qf-context-upload-image')) {
      visual.dataset.qfContextImageUrl = imageUrl;
      visual.classList.add('qf-context-upload-host');
      visual.innerHTML = `<img class="qf-context-upload-image" src="${escapeHtml(imageUrl)}" alt="Imagem da tela de contexto" />`;
    }

    if (sourceNote) {
      if (cleanSource) {
        const expected = `Fonte: ${cleanSource}`;
        if (sourceNote.textContent !== expected) sourceNote.textContent = expected;
        sourceNote.style.display = '';
      } else {
        sourceNote.style.display = 'none';
      }
    }
  });
}

function applyContextImageFeature() {
  ensureStyles();
  ensureBuilderEditor();
  applyPublicContextImages();
}

function startContextImageFeature() {
  applyContextImageFeature();
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyContextImageFeature();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startContextImageFeature, { once: true });
} else {
  startContextImageFeature();
}
