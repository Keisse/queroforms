import { Database, ShieldCheck, PlugZap } from 'lucide-react';
import { supabaseEnabled, SUPABASE_URL } from '../lib/supabase';

export default function Settings(){
  const project = SUPABASE_URL || 'Não configurado';
  return <>
    <header className="page-head"><div><div className="crumb">Diagnóstico de Maturidade › Workspace</div><h1>Configurações</h1></div></header>
    <section className="settings-grid">
      <div className="settings-card"><div className="settings-icon"><Database/></div><div><h2>Supabase</h2><p>Banco central de leads, respostas, scores e origem de campanha.</p><span className={supabaseEnabled?'conn ok':'conn'}>{supabaseEnabled?'● Configurado':'● Não configurado'}</span><code>{project}</code></div></div>
      <div className="settings-card"><div className="settings-icon"><ShieldCheck/></div><div><h2>Privacidade do painel</h2><p>O formulário público pode inserir respostas. A leitura dos leads deve ficar restrita a usuários autenticados no painel.</p><span className="conn ok">RLS previsto no schema</span></div></div>
      <div className="settings-card"><div className="settings-icon"><PlugZap/></div><div><h2>CRM</h2><p>O CRM poderá consumir os dados do Supabase depois, sem depender do frontend do Diagnóstico de Maturidade.</p><span className="conn pending">Próxima etapa</span></div></div>
    </section>
  </>
}
