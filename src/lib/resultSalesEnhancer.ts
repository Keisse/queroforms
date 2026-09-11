const CHECKOUT_URL = 'https://chk.eduzz.com/40QR6AJP9B';
const DETAILS_URL = 'https://trentim.com/livro-gestao-de-projetos-com-ia-perpetuo/#';

function createNode<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function firstByClass<T extends HTMLElement>(root: Document | HTMLElement, className: string): T | null {
  const node = root.getElementsByClassName(className)[0];
  return node ? node as T : null;
}

function makeTextSection(className: string, eyebrow: string, title: string, body: string) {
  const section = createNode('section', `qf-sales-section ${className}`);
  section.append(
    createNode('span', 'qf-sales-eyebrow', eyebrow),
    createNode('h2', '', title),
    createNode('p', '', body),
  );
  return section;
}

function makeAuthorSection() {
  const section = createNode('section', 'qf-sales-section qf-sales-author');
  const photoWrap = createNode('div', 'qf-author-photo-wrap');
  const photo = createNode('img');
  photo.src = '/mario-trentim-result.webp';
  photo.alt = 'Mario Trentim';
  photo.loading = 'lazy';
  photo.decoding = 'async';
  photoWrap.append(photo);

  const copy = createNode('div', 'qf-author-copy');
  copy.append(
    createNode('span', 'qf-sales-eyebrow', 'QUEM VAI TE ENSINAR'),
    createNode('h2', '', 'Mario Trentim'),
    createNode('p', 'qf-author-intro', 'Experiência prática, atuação global e décadas dedicadas à Gestão de Projetos.'),
  );

  const credentials = createNode('div', 'qf-author-credentials');
  const items = [
    ['20+ anos', 'em gestão de projetos em mais de 20 países'],
    ['PMI Board', 'Board of Directors Global'],
    ['Engenheiro do ITA', 'Microsoft MVP por 8 anos'],
    ['11 livros', 'sobre gestão, projetos e carreira'],
    ['465 mil', 'alunos na LinkedIn Learning'],
    ['Petrobras, Embraer e Heineken', 'atuação executiva e projetos globais'],
  ];

  items.forEach(([title, body]) => {
    const card = createNode('div');
    card.append(createNode('strong', '', title), createNode('span', '', body));
    credentials.append(card);
  });

  copy.append(credentials);
  section.append(photoWrap, copy);
  return section;
}

function makeFinalSection() {
  const section = createNode('section', 'qf-sales-section qf-sales-final');
  const title = createNode('h2');
  title.append(
    document.createTextNode('1ª edição digital. 440 páginas. '),
    createNode('strong', '', 'R$ 47, preço fixo.'),
  );

  const button = createNode('a', 'primary big qf-sales-primary qf-sales-final-button', 'Quero meu exemplar por R$47');
  button.href = CHECKOUT_URL;
  button.target = '_blank';
  button.rel = 'noreferrer';

  section.append(
    createNode('span', 'qf-sales-eyebrow', 'COMECE AGORA'),
    title,
    createNode('p', '', 'O acesso chega no seu e-mail em instantes. Sem grupo, sem espera, sem liberação por etapa.'),
    button,
  );
  return section;
}

function enhanceResultSales() {
  const result = Array.from(document.getElementsByClassName('result-view'))
    .find(node => (node as HTMLElement).dataset.stepId === 'result') as HTMLElement | undefined;
  if (!result || result.dataset.salesEnhanced === 'true') return false;

  const offer = firstByClass<HTMLElement>(result, 'offer-card');
  const offerCopy = offer ? firstByClass<HTMLElement>(offer, 'offer-copy') : null;
  if (!offer || !offerCopy) return false;

  result.dataset.salesEnhanced = 'true';
  offer.classList.add('qf-book-offer-hero');

  const kicker = offerCopy.getElementsByTagName('small')[0];
  if (kicker) {
    kicker.textContent = 'SE TORNE UM MESTRE EM IA';
    kicker.classList.add('qf-book-kicker');
  }

  const title = offerCopy.getElementsByTagName('h2')[0];
  if (title) title.textContent = 'O Playbook mais atualizado sobre Gestão de Projetos com IA';

  const description = offerCopy.getElementsByTagName('p')[0];
  if (description) {
    description.textContent = 'Um guia direto e aplicável para transformar Inteligência Artificial em planejamento, análise, decisão e execução de projetos.';
  }

  const buttons = offerCopy.getElementsByTagName('a');
  const primary = buttons[0];
  const secondary = buttons[1];

  if (primary) {
    primary.textContent = 'QUERO MEU EXEMPLAR';
    primary.href = CHECKOUT_URL;
    primary.classList.add('qf-sales-primary');
  }

  if (secondary) {
    const oldPrice = createNode('span', 'qf-old-price', 'R$67');
    const newPrice = createNode('strong', '', 'por R$47');
    secondary.replaceChildren(oldPrice, document.createTextNode(' '), newPrice);
    secondary.href = DETAILS_URL;
    secondary.classList.add('qf-price-link');
  }

  const map = makeTextSection(
    'qf-sales-map',
    'DO DIAGNÓSTICO PARA A PRÁTICA',
    'O mapa completo da Gestão de Projetos com Inteligência Artificial',
    'Feito para você, Gestor de Projetos, que precisa implementar IA aos seus processos e se manter relevante na Era da IA.',
  );

  const difference = makeTextSection(
    'qf-sales-difference',
    'POR QUE ESTE LIVRO',
    'Por que esse livro é diferente de tudo que você já viu sobre Gestão de Projetos?',
    'Através destas páginas, o maior Gestor de Projetos do Brasil te mostra como transformar dados, incerteza e complexidade em decisões precisas e projetos que geram valor de verdade.',
  );

  const author = makeAuthorSection();
  const finalCta = makeFinalSection();

  offer.insertAdjacentElement('afterend', map);
  map.insertAdjacentElement('afterend', difference);
  difference.insertAdjacentElement('afterend', author);
  author.insertAdjacentElement('afterend', finalCta);
  return true;
}

function startEnhancement() {
  enhanceResultSales();
  window.setInterval(enhanceResultSales, 700);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startEnhancement, { once: true });
} else {
  startEnhancement();
}
