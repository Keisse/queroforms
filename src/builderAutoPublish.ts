import { supabase } from './lib/supabase';

export {};

const AUTOSAVE_DELAY_MS = 700;
const LOCAL_REALTIME_GUARD_MS = 5000;
const FOCUS_REFRESH_AFTER_MS = 15000;

let autosaveTimer: number | null = null;
let retryTimer: number | null = null;
let lastLocalPublishAt = 0;
let lastEditAt = 0;
let hiddenAt = 0;
let pendingRemoteReload = false;
let installed = false;

function isBuilderRoute() {
  return /^\/builder\/gp-ia\/?$/.test(window.location.pathname);
}

function getPublishButton() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.head-actions button'));
  return buttons.find(button => button.classList.contains('dark') || (button.textContent || '').trim().startsWith('Publicar')) || null;
}

function ensureStatusBadge() {
  if (!isBuilderRoute()) return null;
  const existing = document.querySelector<HTMLElement>('[data-qf-autosync-status="true"]');
  if (existing) return existing;

  const actions = document.querySelector<HTMLElement>('.head-actions');
  if (!actions) return null;

  const badge = document.createElement('span');
  badge.dataset.qfAutosyncStatus = 'true';
  badge.textContent = 'Salvamento automático ativo';
  Object.assign(badge.style, {
    alignSelf: 'center',
    marginRight: '8px',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#eef7ff',
    border: '1px solid #cfe4f8',
    color: '#1769aa',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  });
  actions.prepend(badge);
  return badge;
}

function setStatus(message: string, mode: 'idle' | 'saving' | 'saved' | 'error' = 'idle') {
  const badge = ensureStatusBadge();
  if (!badge) return;
  badge.textContent = message;

  const palette = mode === 'error'
    ? { background: '#fff1f1', border: '#f2caca', color: '#a93434' }
    : mode === 'saved'
      ? { background: '#eef9f1', border: '#ccebd4', color: '#26723b' }
      : mode === 'saving'
        ? { background: '#fff8e7', border: '#f0dfb3', color: '#8a6412' }
        : { background: '#eef7ff', border: '#cfe4f8', color: '#1769aa' };

  badge.style.background = palette.background;
  badge.style.borderColor = palette.border;
  badge.style.color = palette.color;
}

function monitorPublishResult(startedAt: number) {
  const deadline = Date.now() + 8000;

  const check = () => {
    if (!isBuilderRoute()) return;
    if (startedAt !== lastLocalPublishAt) return;

    const error = document.querySelector<HTMLElement>('.head-actions .save-error');
    if (error?.textContent?.trim()) {
      setStatus('Erro ao salvar — tente novamente', 'error');
      return;
    }

    const success = Array.from(document.querySelectorAll<HTMLElement>('.head-actions .conn.ok'))
      .find(el => (el.textContent || '').includes('Publicado'));
    if (success) {
      setStatus('Salvo no Supabase • público atualizado', 'saved');
      return;
    }

    const button = getPublishButton();
    if (button?.disabled) {
      setStatus('Salvando no Supabase e atualizando público…', 'saving');
    }

    if (Date.now() < deadline) window.setTimeout(check, 250);
    else setStatus('Salvamento automático ativo', 'idle');
  };

  window.setTimeout(check, 150);
}

function publishNow() {
  if (!isBuilderRoute()) return;

  const button = getPublishButton();
  if (!button || button.disabled) {
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(publishNow, 350);
    return;
  }

  lastLocalPublishAt = Date.now();
  const startedAt = lastLocalPublishAt;
  setStatus('Salvando no Supabase e atualizando público…', 'saving');
  button.click();
  monitorPublishResult(startedAt);
}

function scheduleAutoPublish() {
  if (!isBuilderRoute()) return;
  lastEditAt = Date.now();
  setStatus('Alteração detectada • salvando automaticamente…', 'saving');

  if (autosaveTimer !== null) window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    autosaveTimer = null;
    publishNow();
  }, AUTOSAVE_DELAY_MS);
}

function targetIsEditable(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest('.head-actions')) return false;
  return Boolean(target.closest('.props-panel, .qf-context-image-upload, .qf-context-image-editor, .qf-context-image-panel, .builder-add-modal'));
}

function buttonChangesContent(button: HTMLButtonElement) {
  if (button.closest('.head-actions')) return false;
  if (button.closest('.props-panel')) return true;
  if (button.closest('.builder-add-screen-wrap')) return true;
  if (button.closest('.builder-add-modal')) return true;
  if (button.closest('.qf-context-image-upload, .qf-context-image-editor, .qf-context-image-panel')) return true;
  const text = (button.textContent || '').trim().toLowerCase();
  const title = (button.getAttribute('title') || '').toLowerCase();
  return text === 'excluir tela' || title.includes('excluir esta tela');
}

function reloadFromRemote() {
  if (!isBuilderRoute()) return;
  pendingRemoteReload = false;
  window.location.reload();
}

function installBuilderAutoPublish() {
  if (installed) return;
  installed = true;

  const observer = new MutationObserver(() => ensureStatusBadge());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ensureStatusBadge();

  document.addEventListener('input', event => {
    if (targetIsEditable(event.target)) scheduleAutoPublish();
  }, true);

  document.addEventListener('change', event => {
    if (targetIsEditable(event.target)) scheduleAutoPublish();
  }, true);

  document.addEventListener('click', event => {
    const button = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('button')
      : null;
    if (!button) return;

    if (button.closest('.head-actions')) {
      if (button.classList.contains('dark') || (button.textContent || '').trim().startsWith('Publicar')) {
        lastLocalPublishAt = Date.now();
        monitorPublishResult(lastLocalPublishAt);
      }
      return;
    }

    if (buttonChangesContent(button)) window.setTimeout(scheduleAutoPublish, 0);
  }, true);

  document.addEventListener('drop', event => {
    if (event.target instanceof Element && event.target.closest('.steps-list')) {
      window.setTimeout(scheduleAutoPublish, 0);
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (!isBuilderRoute()) return;
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }

    if (pendingRemoteReload) {
      reloadFromRemote();
      return;
    }

    if (hiddenAt && Date.now() - hiddenAt > FOCUS_REFRESH_AFTER_MS && Date.now() - lastEditAt > AUTOSAVE_DELAY_MS + 500) {
      reloadFromRemote();
    }
  });

  const channel = supabase
    .channel('builder-live-sync-gp-ia')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'surveys', filter: 'slug=eq.gp-ia' },
      () => {
        if (!isBuilderRoute()) return;
        if (Date.now() - lastLocalPublishAt < LOCAL_REALTIME_GUARD_MS) return;

        if (document.visibilityState !== 'visible' || Date.now() - lastEditAt < AUTOSAVE_DELAY_MS + 500) {
          pendingRemoteReload = true;
          setStatus('Nova versão detectada • sincronizando ao voltar', 'saving');
          return;
        }

        reloadFromRemote();
      },
    )
    .subscribe();

  window.addEventListener('beforeunload', () => {
    void supabase.removeChannel(channel);
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installBuilderAutoPublish, { once: true });
} else {
  installBuilderAutoPublish();
}
