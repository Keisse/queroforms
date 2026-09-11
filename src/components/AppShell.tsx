import { BarChart3, ContactRound, FileQuestion, LogOut, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { signOut } from '../lib/auth';

const items = [
  ['/','Dashboard',BarChart3],
  ['/diagnostics','Diagnósticos',FileQuestion],
  ['/contacts','Contatos',ContactRound],
  ['/analytics','Análises',BarChart3],
  ['/settings','Configurações',Settings],
] as const;

export function AppShell({children}:{children:React.ReactNode}){
  const loc = useLocation();
  const navigate = useNavigate();
  const logout = async()=>{ await signOut(); navigate('/login'); };
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">F</span><strong>Forms Generator</strong></div>
      <div className="workspace-chip">My workspace</div>
      <nav>{items.map(([to,label,Icon])=>{
        const active = to==='/' ? loc.pathname==='/' : loc.pathname===to || loc.pathname.startsWith(`${to}/`);
        return <Link key={to} to={to} className={active?'active':''}><Icon size={18}/><span>{label}</span></Link>;
      })}
        <button onClick={logout} style={{display:'flex',alignItems:'center',gap:10,width:'100%',background:'transparent',border:0,cursor:'pointer',padding:'10px 12px',color:'#52667a',font:'inherit'}}><LogOut size={18}/><span>Sair</span></button>
      </nav>
      <div className="side-bottom"><span>Forms Generator</span><small>Workspace</small></div>
    </aside>
    <main className="main">{children}</main>
  </div>
}
