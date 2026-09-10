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
    // O rascunho atual da tela passa a ser controlado pelo Builder.
  }
}

function installScreenDraftBridge() {
  clearLegacyLocalDrafts();

  document.addEventListener('click', event => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('.qf-context-image-save-btn')
      : null;
    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const saveScreenButton = document.querySelector<HTMLButtonElement>('[data-qf-save-screen="true"]');
    if (!saveScreenButton) {
      setContextStatus('Não encontrei o botão de salvar edição desta tela.', true);
      return;
    }
    if (saveScreenButton.disabled) {
      setContextStatus('Aguarde a operação atual terminar para salvar novamente.');
      return;
    }

    saveScreenButton.click();
    setContextStatus('Edição salva como rascunho neste navegador ✓');
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installScreenDraftBridge, { once: true });
} else {
  installScreenDraftBridge();
}
