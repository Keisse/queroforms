const AI_CHECKOUT_URL = 'https://chk.eduzz.com/40QR6AJP9B';
const AI_DETAILS_URL = 'https://trentim.com/livro-gestao-de-projetos-com-ia-perpetuo/#';
const PMO_CHECKOUT_URL = 'https://chk.eduzz.com/xgklntvt';
const TIRE_PROJETO_CHECKOUT_URL = 'https://chk.eduzz.com/3va57nye';

function AuthorSection(){
  return <section className="qf-sales-section qf-sales-author">
    <div className="qf-author-photo-wrap">
      <img src="/mario-trentim-result.webp" alt="Mario Trentim" loading="lazy" decoding="async" />
    </div>
    <div className="qf-author-copy">
      <span className="qf-sales-eyebrow">QUEM VAI TE ENSINAR</span>
      <h2>Mario Trentim</h2>
      <p className="qf-author-intro">Experiência prática, atuação global e décadas dedicadas à Gestão de Projetos.</p>
      <div className="qf-author-credentials">
        <div><strong>20+ anos</strong><span>em gestão de projetos em mais de 20 países</span></div>
        <div><strong>PMI Board</strong><span>Board of Directors Global</span></div>
        <div><strong>Engenheiro do ITA</strong><span>Microsoft MVP por 8 anos</span></div>
        <div><strong>11 livros</strong><span>sobre gestão, projetos e carreira</span></div>
        <div><strong>465 mil</strong><span>alunos na LinkedIn Learning</span></div>
        <div><strong>Petrobras, Embraer e Heineken</strong><span>atuação executiva e projetos globais</span></div>
      </div>
    </div>
  </section>;
}

export function ResultBookOffer({surveySlug='gp-ia'}:{surveySlug?:string}){
  if(surveySlug==='pmo-vmo'){
    return <div className="offer-card qf-book-offer-hero">
      <div className="ebook-cover-real">
        <img
          src="/books/estrategia-em-acao-pmo-vmo-cover.svg"
          alt="Capa do livro Estratégia em Ação: da gestão de projetos à gestão de valor com PMOs e VMOs"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="offer-copy">
        <small className="qf-book-kicker">O PRÓXIMO PASSO DO SEU DIAGNÓSTICO</small>
        <h2>Estratégia em Ação: da gestão de projetos à gestão de valor com PMOs &amp; VMOs</h2>
        <p>Um guia para quem quer estruturar, reposicionar ou evoluir um PMO com mais estratégia, governança e foco em valor.</p>
        <a className="primary big qf-sales-primary" href={PMO_CHECKOUT_URL} target="_blank" rel="noreferrer">QUERO MEU EXEMPLAR</a>
        <div className="secondary big qf-price-link"><strong>R$ 47</strong></div>
      </div>
    </div>;
  }

  if(surveySlug==='tire-projeto-do-papel'){
    return <div className="offer-card qf-book-offer-hero">
      <div className="ebook-cover-real">
        <img
          src="/books/tire-projeto-do-papel-cover.webp"
          alt="Capa do livro Tire Esse Projeto do Papel, de Mario Trentim"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="offer-copy">
        <small className="qf-book-kicker">O PRÓXIMO PASSO DO SEU DIAGNÓSTICO</small>
        <h2>Tire Esse Projeto do Papel!</h2>
        <p>Um guia prático para transformar boas ideias em projetos claros, organizados, executáveis e capazes de gerar resultado.</p>
        <a className="primary big qf-sales-primary" href={TIRE_PROJETO_CHECKOUT_URL} target="_blank" rel="noreferrer">QUERO TIRAR MEU PROJETO DO PAPEL</a>
        <div className="secondary big qf-price-link"><strong>R$ 47</strong></div>
      </div>
    </div>;
  }

  return <div className="offer-card qf-book-offer-hero">
    <div className="ebook-cover-real">
      <img src="https://allevotech.com.br/wp-content/uploads/2026/06/Capa-760.webp" alt="Capa do livro Gestão de Projetos com Inteligência Artificial, de Mario Trentim" />
    </div>
    <div className="offer-copy">
      <small className="qf-book-kicker">SE TORNE UM MESTRE EM IA</small>
      <h2>O Playbook mais atualizado sobre Gestão de Projetos com IA</h2>
      <p>Um guia direto e aplicável para transformar Inteligência Artificial em planejamento, análise, decisão e execução de projetos.</p>
      <a className="primary big qf-sales-primary" href={AI_CHECKOUT_URL} target="_blank" rel="noreferrer">QUERO MEU EXEMPLAR</a>
      <a className="secondary big qf-price-link" href={AI_DETAILS_URL} target="_blank" rel="noreferrer"><span className="qf-old-price">R$67</span> <strong>por R$47</strong></a>
    </div>
  </div>;
}

export default function ResultSalesSections({surveySlug='gp-ia'}:{surveySlug?:string}){
  if(surveySlug==='pmo-vmo'){
    return <>
      <section className="qf-sales-section qf-sales-map">
        <span className="qf-sales-eyebrow">DO DIAGNÓSTICO PARA A PRÁTICA</span>
        <h2>Transforme o PMO em uma ponte entre estratégia, execução e valor</h2>
        <p>O livro aprofunda os fundamentos, decisões e práticas para quem precisa construir, reconfigurar ou elevar o papel de um PMO ou VMO dentro da organização.</p>
      </section>

      <section className="qf-sales-section qf-sales-difference">
        <span className="qf-sales-eyebrow">DE CONTROLE A VALOR</span>
        <h2>Seu próximo salto não é criar mais relatórios. É aumentar a capacidade de decisão e geração de valor.</h2>
        <p>Use o seu resultado como ponto de partida para desenvolver visão estratégica, arquitetura de PMO, governança, influência e gestão de valor.</p>
      </section>

      <AuthorSection/>

      <section className="qf-sales-section qf-sales-final">
        <span className="qf-sales-eyebrow">COMECE AGORA</span>
        <h2>Estratégia em Ação por <strong>R$ 47</strong></h2>
        <p>Da gestão de projetos à gestão de valor com PMOs &amp; VMOs.</p>
        <a className="primary big qf-sales-primary qf-sales-final-button" href={PMO_CHECKOUT_URL} target="_blank" rel="noreferrer">Quero meu exemplar por R$47</a>
      </section>
    </>;
  }

  if(surveySlug==='tire-projeto-do-papel'){
    return <>
      <section className="qf-sales-section qf-sales-map">
        <span className="qf-sales-eyebrow">DO DIAGNÓSTICO PARA A PRÁTICA</span>
        <h2>Você não precisa de mais uma ideia. Precisa de um caminho para fazer acontecer.</h2>
        <p>O livro transforma os fundamentos da Gestão de Projetos em uma sequência prática para sair da intenção, organizar o trabalho e conduzir o projeto até a entrega.</p>
      </section>

      <section className="qf-sales-section qf-sales-difference">
        <span className="qf-sales-eyebrow">DA IDEIA AO RESULTADO</span>
        <h2>Clareza para começar. Estrutura para planejar. Método para executar. Controle para chegar ao resultado.</h2>
        <p>Use o seu diagnóstico como ponto de partida para fortalecer exatamente as competências que fazem um projeto deixar de ser promessa e virar realidade.</p>
      </section>

      <AuthorSection/>

      <section className="qf-sales-section qf-sales-final">
        <span className="qf-sales-eyebrow">COMECE AGORA</span>
        <h2>Tire Esse Projeto do Papel por <strong>R$ 47</strong></h2>
        <p>Fundamentos da Gestão de Projetos para descomplicar sua vida e transformar ideias em projetos reais.</p>
        <a className="primary big qf-sales-primary qf-sales-final-button" href={TIRE_PROJETO_CHECKOUT_URL} target="_blank" rel="noreferrer">Quero tirar meu projeto do papel por R$47</a>
      </section>
    </>;
  }

  return <>
    <section className="qf-sales-section qf-sales-map">
      <span className="qf-sales-eyebrow">DO DIAGNÓSTICO PARA A PRÁTICA</span>
      <h2>O mapa completo da Gestão de Projetos com Inteligência Artificial</h2>
      <p>Feito para você, Gestor de Projetos, que precisa implementar IA aos seus processos e se manter relevante na Era da IA.</p>
    </section>

    <section className="qf-sales-section qf-sales-difference">
      <span className="qf-sales-eyebrow">POR QUE ESTE LIVRO</span>
      <h2>Por que esse livro é diferente de tudo que você já viu sobre Gestão de Projetos?</h2>
      <p>Através destas páginas, o maior Gestor de Projetos do Brasil te mostra como transformar dados, incerteza e complexidade em decisões precisas e projetos que geram valor de verdade.</p>
    </section>

    <AuthorSection/>

    <section className="qf-sales-section qf-sales-final">
      <span className="qf-sales-eyebrow">COMECE AGORA</span>
      <h2>1ª edição digital. 440 páginas. <strong>R$ 47, preço fixo.</strong></h2>
      <p>O acesso chega no seu e-mail em instantes. Sem grupo, sem espera, sem liberação por etapa.</p>
      <a className="primary big qf-sales-primary qf-sales-final-button" href={AI_CHECKOUT_URL} target="_blank" rel="noreferrer">Quero meu exemplar por R$47</a>
    </section>
  </>;
}
