import { supabase } from './lib/supabase';

const BUCKET = 'survey-assets';
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
  if (!imageUrl) return clean;
  return `${clean}${clean ? '\n' : ''}[[QF_IMAGE:${imageUrl}]]`;
}

function setReactTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  descriptor?.set?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const pos = url.indexOf(marker);
  if (pos < 0) return '';
  return decodeURIComponent(url.slice(pos + marker.length).split('?')[0]);
}

async function removeStorageObject(url: string) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Removing an old asset is best-effort; the screen update should still succeed.
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
    .qf-context-image-box{border:1.5px dashed #9fc4e8;background:#f7fbff;border-radius:14px;padding:12px}
    .qf-context-image-preview{height:132px;border-radius:11px;background:#eaf4fd;overflow:hidden;display:grid;place-items:center;color:#7b8ea0;font-size:12px;margin-bottom:10px}
    .qf-context-image-preview img{width:100%;height:100%;object-fit:cover;display:block}
    .qf-context-image-actions{display:flex;gap:7px;flex-wrap:wrap}
    .qf-context-image-actions .btn{padding:8px 11px}
    .qf-context-image-help{display:block;color:#8a99a8;font-size:11px;line-height:1.4;margin-top:8px}
    .qf-context-image-status{display:block;color:#1479d0;font-size:11px;font-weight:700;margin-top:7px}
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
  if (existing?.src === imageUrl) return;
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
      <label>Imagem da tela</label>
      <div class="qf-context-image-box">
        <div class="qf-context-image-preview"><span>Nenhuma imagem enviada</span></div>
        <div class="qf-context-image-actions">
          <label class="btn" style="cursor:pointer">Enviar imagem<input class="qf-context-image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden /></label>
          <button class="btn qf-context-image-remove" type="button">Remover</button>
        </div>
        <small class="qf-context-image-help">PNG, JPG ou WebP, até 5 MB. A imagem ocupa o retângulo superior desta tela quando você clicar em Publicar.</small>
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
  const fileInput = editor.querySelector<HTMLInputElement>('.qf-context-image-input');
  const removeButton = editor.querySelector<HTMLButtonElement>('.qf-context-image-remove');
  proxy = panel.querySelector<HTMLTextAreaElement>('.qf-context-source-proxy');

  if (preview) {
    preview.innerHTML = parsed.imageUrl
      ? `<img src="${parsed.imageUrl}" alt="Prévia da imagem" />`
      : '<span>Nenhuma imagem enviada</span>';
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

  if (fileInput && fileInput.dataset.qfBound !== 'true') {
    fileInput.dataset.qfBound = 'true';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        if (status) status.textContent = 'Use uma imagem PNG, JPG ou WebP.';
        fileInput.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        if (status) status.textContent = 'A imagem precisa ter no máximo 5 MB.';
        fileInput.value = '';
        return;
      }

      const current = findSourceField()?.textarea;
      if (!current) return;
      const previous = parseSource(current.value);
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `gp-ia/context/${uuid}.${ext}`;

      if (status) status.textContent = 'Enviando imagem...';
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        console.error(error);
        if (status) status.textContent = 'Não consegui enviar a imagem. Tente novamente.';
        fileInput.value = '';
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const imageUrl = data.publicUrl;
      setReactTextareaValue(current, composeSource(previous.source, imageUrl));
      renderBuilderCanvasImage(imageUrl);
      if (previous.imageUrl && previous.imageUrl !== imageUrl) void removeStorageObject(previous.imageUrl);
      if (status) status.textContent = 'Imagem enviada ✓ Clique em Publicar para aplicar.';
      fileInput.value = '';
      requestAnimationFrame(ensureBuilderEditor);
    });
  }

  if (removeButton && removeButton.dataset.qfBound !== 'true') {
    removeButton.dataset.qfBound = 'true';
    removeButton.addEventListener('click', () => {
      const current = findSourceField()?.textarea;
      if (!current) return;
      const parsedCurrent = parseSource(current.value);
      setReactTextareaValue(current, parsedCurrent.source);
      renderBuilderCanvasImage('');
      if (parsedCurrent.imageUrl) void removeStorageObject(parsedCurrent.imageUrl);
      if (status) status.textContent = 'Imagem removida. Clique em Publicar para aplicar.';
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
