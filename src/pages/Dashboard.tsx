import { Link } from 'react-router-dom';
import { Plus, Sparkles, Gauge, BookOpen, Brain } from 'lucide-react';

export default function Dashboard(){
  return <>
    <header className="page-head"><div><div className="crumb">Keisse › My workspace</div><h1>Diagnósticos</h1></div><button className="btn dark"><Plus size={17}/> Novo diagnóstico</button></header>
    <section className="template-row">
      <div className="template-card"><Sparkles/><b>Criar com IA</b><small>Descreva o objetivo e gere uma primeira versão.</small></div>
      <div className="template-card"><Gauge/><b>Maturidade</b><small>Classifique o lead por nível e dimensão.</small></div>
      <div className="template-card"><Brain/><b>Perfil</b><small>Descubra comportamento, contexto e intenção.</small></div>
      <div className="template-card"><BookOpen/><b>Recomendação</b><small>Conecte o resultado ao produto ideal.</small></div>
    </section>
    <section className="list-panel">
      <div className="list-tools"><input placeholder="Buscar diagnóstico"/><select><option>Status</option></select><select><option>Tipo</option></select></div>
      <div className="table-row table-head"><span>Nome</span><span>Status</span><span>Respostas</span><span>Tipo</span><span>Atualizado</span></div>
      <div className="table-row"><Link to="/builder/gp-ia" className="survey-name">Diagnóstico de Maturidade em IA para GP</Link><span className="status live">● Publicado</span><span>0</span><span>Diagnóstico</span><span>agora</span></div>
    </section>
  </>
}
