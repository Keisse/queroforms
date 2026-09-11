const CHECKOUT_URL = 'https://chk.eduzz.com/40QR6AJP9B';
const DETAILS_URL = 'https://trentim.com/livro-gestao-de-projetos-com-ia-perpetuo/#';

function makeSection(className: string, html: string) {
  const section = document.createElement('section');
  section.className = `qf-sales-section ${className}`;
  section.innerHTML = html;
  return section;
}

function enhanceResultSales() {
  const result = document.querySelector<HTMLElement>('.result-view[data-step-id="result"]');
  if (!result || result.dataset.salesEnhanced === 'true') return;

  const offer = result.querySelector<HTMLElement>('.offer-card');
  const offerCopy = offer?.querySelector<HTMLElement>('.offer-copy');
  if (!offer || !offerCopy) return;

  result.dataset.salesEnhanced = 'true';
  offer.classList.add('qf-book-offer-hero');

  const kicker = offerCopy.querySelector('small');
  if (kicker) {
    kicker.textContent = 'SE TORNE UM MESTRE EM IA';
    kicker.classList.add('qf-book-kicker');
  }

  const title = offerCopy.querySelector('h2');
  if (title) title.textContent = 'O Playbook mais atualizado sobre Gestão de Projetos com IA';

  const description = offerCopy.querySelector('p');
  if (description) {
    description.textContent = 'Um guia direto e aplicável para transformar Inteligência Artificial em planejamento, análise, decisão e execução de projetos.';
  }

  const buttons = offerCopy.querySelectorAll<HTMLAnchorElement>('a');
  const primary = buttons[0];
  const secondary = buttons[1];

  if (primary) {
    primary.textContent = 'QUERO MEU EXEMPLAR';
    primary.href = CHECKOUT_URL;
    primary.classList.add('qf-sales-primary');
  }

  if (secondary) {
    secondary.innerHTML = '<span class="qf-old-price">R$67</span> <strong>por R$47</strong>';
    secondary.href = DETAILS_URL;
    secondary.classList.add('qf-price-link');
  }

  const map = makeSection('qf-sales-map', `
    <span class="qf-sales-eyebrow">DO DIAGNÓSTICO PARA A PRÁTICA</span>
    <h2>O mapa completo da Gestão de Projetos com Inteligência Artificial</h2>
    <p>Feito para você, Gestor de Projetos, que precisa implementar IA aos seus processos e se manter relevante na Era da IA.</p>
  `);

  const difference = makeSection('qf-sales-difference', `
    <span class="qf-sales-eyebrow">POR QUE ESTE LIVRO</span>
    <h2>Por que esse livro é diferente de tudo que você já viu sobre Gestão de Projetos?</h2>
    <p>Através destas páginas, o maior Gestor de Projetos do Brasil te mostra como transformar dados, incerteza e complexidade em decisões precisas e projetos que geram valor de verdade.</p>
  `);

  const author = makeSection('qf-sales-author', `
    <div class="qf-author-photo-wrap">
      <img src="/mario-trentim-result.webp" alt="Mario Trentim" loading="lazy" decoding="async" />
    </div>
    <div class="qf-author-copy">
      <span class="qf-sales-eyebrow">QUEM VAI TE ENSINAR</span>
      <h2>Mario Trentim</h2>
      <p class="qf-author-intro">Experiência prática, atuação global e décadas dedicadas à Gestão de Projetos.</p>
      <div class="qf-author-credentials">
        <div><strong>20+ anos</strong><span>em gestão de projetos em mais de 20 países</span></div>
        <div><strong>PMI Board</strong><span>Board of Directors Global</span></div>
        <div><strong>Engenheiro do ITA</strong><span>Microsoft MVP por 8 anos</span></div>
        <div><strong>11 livros</strong><span>sobre gestão, projetos e carreira</span></div>
        <div><strong>465 mil</strong><span>alunos na LinkedIn Learning</span></div>
        <div><strong>Petrobras, Embraer e Heineken</strong><span>atuação executiva e projetos globais</span></div>
      </div>
    </div>
  `);

  const finalCta = makeSection('qf-sales-final', `
    <span class="qf-sales-eyebrow">COMECE AGORA</span>
    <h2>1ª edição digital. 440 páginas. <strong>R$ 47, preço fixo.</strong></h2>
    <p>O acesso chega no seu e-mail em instantes. Sem grupo, sem espera, sem liberação por etapa.</p>
    <a class="primary big qf-sales-primary qf-sales-final-button" href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Quero meu exemplar por R$47</a>
  `);

  offer.insertAdjacentElement('afterend', map);
  map.insertAdjacentElement('afterend', difference);
  difference.insertAdjacentElement('afterend', author);
  author.insertAdjacentElement('afterend', finalCta);
}

function scheduleEnhancement() {
  enhanceResultSales();
  window.requestAnimationFrame(enhanceResultSales);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleEnhancement, { once: true });
} else {
  scheduleEnhancement();
}

const observer = new MutationObserver(() => enhanceResultSales());
observer.observe(document.documentElement, { childList: true, subtree: true });
