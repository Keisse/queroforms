import { BarChart3, ContactRound, FileQuestion, Settings, Workflow, Database } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import React from 'react';

const items = [
  ['/','Diagnósticos',FileQuestion],
  ['/contacts','Contatos',ContactRound],
  ['/responses','Respostas',Database],
  ['/analytics','Análises',BarChart3],
  ['/workflows','Workflows',Workflow],
  ['/settings','Configurações',Settings],
] as const;

export function AppShell({children}:{children:React.ReactNode}){
  const loc = useLocation();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">Q</span><strong>QueroForms</strong></div>
      <div className="workspace-chip">My workspace</div>
      <nav>{items.map(([to,label,Icon])=><Link key={to} to={to} className={loc.pathname===to?'active':''}><Icon size={18}/><span>{label}</span></Link>)}</nav>
      <div className="side-bottom"><span>QueroForms</span><small>Workspace</small></div>
    </aside>
    <main className="main">{children}</main>
  </div>
}
