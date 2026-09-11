import { useEffect } from 'react';
import { BarChart3, Braces, ClipboardList, PencilRuler, PlugZap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Analytics from './Analytics';
import BuilderStable from './BuilderStable';

type BuilderSection = 'build' | 'analytics' | 'responses' | 'integrations';

const sections: { id: BuilderSection; label: string; icon: typeof PencilRuler }[] = [
  { id: 'build', label: 'Construir', icon: PencilRuler },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'responses', label: 'Respostas', icon: ClipboardList },
  { id: 'integrations', label: 'Integrações', icon: PlugZap },
];

function AutoPersistDeletedScreen() {
  useEffect(() => {
    let handling = false;
    const deletedMessage = 'Tela removida. Clique em Salvar edição desta tela para guardar esta alteração localmente.';

    const persistDeletion = () => {
      if (handling || !document.body.textContent?.includes(deletedMessage)) return;

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
      const saveButton = buttons.find(button => button.textContent?.trim().startsWith('Salvar edição desta tela'));

      if (saveButton && !saveButton.disabled) {
        handling = true;
        saveButton.click();
        window.setTimeout(() => { handling = false; }, 80);
        return;
      }

      // A tela de resultado não possui botão de salvar. Se ela ficar selecionada após
      // uma exclusão, selecionamos uma tela editável para persistir a estrutura inteira.
      const editableStep = Array.from(document.querySelectorAll<HTMLElement>('.step-item')).find(item =>
        !item.textContent?.toLowerCase().includes('resultadoresult'),
      );
      const selectable = editableStep
        ? Array.from(editableStep.children).find(child => child.tagName === 'SPAN' && !child.classList.contains('builder-step-handle')) as HTMLElement | undefined
        : undefined;
      selectable?.click();
    };

    const observer = new MutationObserver(persistDeletion);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    persistDeletion();
    return () => observer.disconnect();
  }, []);

  return null;
}

function IntegrationsPanel() {
  return <div className="builder-integrations">
    <section className="integration-hero">
      <div className="integration-icon"><PlugZap size={22}/></div>
      <div><small>Automação de dados</small><h2>Integrações</h2><p>Envie automaticamente os dados capturados pelo diagnóstico para CRM, automações e outros sistemas.</p></div>
    </section>

    <section className="integration-flow-card">
      <div className="integration-flow">
        <div className="integration-node active"><b>QueroForms</b><span>Respostas do diagnóstico</span></div>
        <span className="integration-arrow">→</span>
        <div className="integration-node active"><b>Supabase</b><span>submissions</span><em>Conectado</em></div>
        <span className="integration-arrow">→</span>
        <div className="integration-node"><b>CRM</b><span>Webhook / Edge Function</span><em className="pending">A configurar</em></div>
      </div>
    </section>

    <section className="integration-grid">
      <article className="integration-card">
        <div className="integration-card-icon"><Braces size={20}/></div>
        <div><small>Dados disponíveis</small><h3>Campos que podem ser enviados</h3></div>
        <div className="integration-tags"><span>Nome</span><span>E-mail</span><span>Score</span><span>Nível</span><span>Dimensões</span><span>Todas as respostas</span><span>Origem</span><span>UTMs</span></div>
      </article>
      <article className="integration-card">
        <div className="integration-card-icon"><PlugZap size={20}/></div>
        <div><small>Próximo passo</small><h3>Conectar um CRM</h3><p>Quando o CRM for definido, a integração pode transformar cada nova submissão no formato exigido pela API de destino sem expor credenciais no navegador.</p></div>
      </article>
    </section>
  </div>;
}

export default function BuilderPage(){
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('section') as BuilderSection | null;
  const active: BuilderSection = sections.some(item => item.id === requested) ? requested! : 'build';

  const changeSection = (section: BuilderSection) => {
    const next = new URLSearchParams(searchParams);
    if (section === 'build') next.delete('section');
    else next.set('section', section);
    setSearchParams(next, { replace: true });
  };

  return <>
    <header className="builder-workspace-head">
      <div><div className="crumb">Keisse › My workspace › Diagnóstico</div><h1>Diagnóstico de Maturidade em IA para GP</h1></div>
      {active === 'build' && <a className="btn" href="/d/gp-ia?preview=draft" target="_blank" rel="noreferrer">Pré-visualizar rascunho</a>}
    </header>

    <nav className="builder-workspace-tabs" aria-label="Áreas do diagnóstico">
      {sections.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => changeSection(item.id)}><Icon size={17}/>{item.label}</button>;
      })}
    </nav>

    <div className={active === 'build' ? '' : 'builder-section-hidden'} aria-hidden={active !== 'build'}>
      <AutoPersistDeletedScreen/>
      <BuilderStable/>
    </div>

    {active === 'analytics' && <Analytics embedded view="overview" onOpenResponses={() => changeSection('responses')}/>} 
    {active === 'responses' && <Analytics embedded view="responses"/>}
    {active === 'integrations' && <IntegrationsPanel/>}
  </>;
}
