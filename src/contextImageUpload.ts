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
    .qf-context-image-help{display:block;color:#8a99a8;font-size:11px;line-height:1.4;margin-top:8px}
    .qf-context-image-status{display:block;color:#1479d0;font-size:11px;font-weight:700;margin-top:7px;min-height:16px}
    .qf-context-image-status.error{color:#b93838}
    .qf-context-source-proxy{width:100%;min-height:68px;margin-bottom:2px}
    .qf-builder-context-image-preview{width:100%;height:190px;border-radius:16px;overflow:hidden;background:#eef7ff;margin-bottom:16px}
    .qf-builder-context-image-preview img{width:100%;height:100%;display:block;object-fit:cover}
    .insight-visual.qf-context-upload-host{padding:0!important;overflow:hidden!important;display:block!important}
    .insight-visual.qf-context-upload-host .qf-context-upload-image{width:100%;height:100%;display:block;object-fit:cover}
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
  preview.innerHTML = `<img src="${imageUrl}" alt="Imagem da tela de contexto" />`;
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
          <button class="btn qf-context-image-remove" type="button">Limpar URL</button>
        </div>
        <small class="qf-context-image-help">Cole aqui a URL direta de uma imagem pública do WordPress. Nenhum arquivo será enviado para o Supabase.</small>
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
  const removeButton = editor.querySelector<HTMLButtonElement>('.qf-context-image-remove');
  proxy = panel.querySelector<HTMLTextAreaElement>('.qf-context-source-proxy');

  if (urlInput && document.activeElement !== urlInput && urlInput.value !== parsed.imageUrl) {
    urlInput.value = parsed.imageUrl;
  }

  if (preview) {
    preview.innerHTML = parsed.imageUrl
      ? `<img src="${parsed.imageUrl}" alt="Prévia da imagem" />`
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
        status.textContent = nextUrl ? 'URL configurada ✓ Clique em Publicar para aplicar.' : '';
      }
      setReactTextareaValue(current, composeSource(currentParsed.source, nextUrl));
      renderBuilderCanvasImage(nextUrl);
      requestAnimationFrame(ensureBuilderEditor);
    };
    urlInput.addEventListener('input', applyUrl);
    urlInput.addEventListener('change', applyUrl);
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
      visual.innerHTML = `<img class="qf-context-upload-image" src="${imageUrl}" alt="Imagem da tela de contexto" />`;
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
