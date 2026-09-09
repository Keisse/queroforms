import { BarChart3, ContactRound, FileQuestion, LogOut, Settings, Workflow, Database } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { signOut } from '../lib/auth';

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
  const navigate = useNavigate();
  const logout = async()=>{ await signOut(); navigate('/login'); };
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">D</span><strong>Diagnóstico de Maturidade</strong></div>
      <div className="workspace-chip">My workspace</div>
      <nav>{items.map(([to,label,Icon])=><Link key={to} to={to} className={loc.pathname===to?'active':''}><Icon size={18}/><span>{label}</span></Link>)}
        <button onClick={logout} style={{display:'flex',alignItems:'center',gap:10,width:'100%',background:'transparent',border:0,cursor:'pointer',padding:'10px 12px',color:'#52667a',font:'inherit'}}><LogOut size={18}/><span>Sair</span></button>
      </nav>
      <div className="side-bottom"><span>Diagnóstico de Maturidade</span><small>Workspace</small></div>
    </aside>
    <main className="main">{children}</main>
  </div>
}
