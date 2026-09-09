const LEGACY_CONTEXT_DRAFT_KEY = 'qf_gp_ia_context_drafts_v1';

function setContextStatus(message: string, isError = false) {
  const status = document.querySelector<HTMLElement>('.qf-context-image-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function clearLegacyLocalDrafts() {
  try {
    window.localStorage.removeItem(LEGACY_CONTEXT_DRAFT_KEY);
  } catch {
    // O banco agora é a fonte oficial do rascunho.
  }
}

function installDatabaseDraftBridge() {
  clearLegacyLocalDrafts();

  document.addEventListener('click', event => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('.qf-context-image-save-btn')
      : null;
    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const databaseSaveButton = document.querySelector<HTMLButtonElement>('[data-qf-save-draft="true"]');
    if (!databaseSaveButton) {
      setContextStatus('Não encontrei o botão de salvar rascunho do editor.', true);
      return;
    }
    if (databaseSaveButton.disabled) {
      setContextStatus('Aguarde a operação atual terminar para salvar novamente.');
      return;
    }

    setContextStatus('Salvando rascunho no banco...');
    databaseSaveButton.click();
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installDatabaseDraftBridge, { once: true });
} else {
  installDatabaseDraftBridge();
}
