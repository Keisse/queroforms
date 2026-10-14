import { useState } from 'react';
import { Database, ShieldCheck, PlugZap, UserPlus } from 'lucide-react';
import { supabaseEnabled, SUPABASE_URL, supabase } from '../lib/supabase';

export default function Settings(){
  const project = SUPABASE_URL || 'Não configurado';
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [success,setSuccess]=useState(false);

  const addUser=async (event:React.FormEvent)=>{
    event.preventDefault();
    if(busy)return;
    setMessage('');setSuccess(false);setBusy(true);
    try {
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||user?.app_metadata?.role!=='admin')throw new Error('Apenas administradores podem cadastrar usuários.');
      const {data,error}=await supabase.functions.invoke('admin-create-user',{body:{name:name.trim(),email:email.trim(),password}});
      if(error){
        const response=error.context as Response|undefined;
        const parsed=response&&typeof response.json==='function'?await response.json().catch(()=>null):null;
        throw new Error(parsed?.error||'Serviço de cadastro indisponível. Solicite a implantação da função administrativa.');
      }
      if(!data?.user)throw new Error('Não foi possível confirmar a criação da conta.');
      setSuccess(true);setMessage('Usuário criado. Ele já pode acessar o painel com e-mail e senha.');
      setName('');setEmail('');setPassword('');
    } catch(err) {
      setMessage(err instanceof Error?err.message:'Não foi possível cadastrar o usuário.');
    } finally {setBusy(false);}
  };
  return <>
    <header className="page-head"><div><div className="crumb">Criador de Diagnósticos › Workspace</div><h1>Configurações</h1></div></header>
    <section className="settings-grid">
      <div className="settings-card"><div className="settings-icon"><UserPlus/></div><div style={{width:'100%',maxWidth:470}}>
        <h2>Adicionar usuário</h2>
        <p>Cadastre novos administradores para acessar os diagnósticos, respostas e configurações. Somente administradores podem criar contas.</p>
        <form onSubmit={addUser} style={{display:'grid',gap:12,marginTop:18}}>
          <label style={{display:'grid',gap:6}}>Nome
            <input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={120} placeholder="Nome completo" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
          </label>
          <label style={{display:'grid',gap:6}}>E-mail
            <input required type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@empresa.com" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
          </label>
          <label style={{display:'grid',gap:6}}>Senha inicial
            <input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 12 caracteres" style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
          </label>
          <small>Compartilhe a senha inicial por um canal seguro e oriente a pessoa a alterá-la no primeiro acesso. Não reutilize senhas.</small>
          <button type="submit" className="primary big" disabled={busy}>{busy?'Cadastrando...':'Adicionar usuário'}</button>
          {message&&<p role="status" style={{margin:0,color:success?'#216c4c':'#ae3434'}}>{message}</p>}
        </form>
      </div></div>
      <div className="settings-card"><div className="settings-icon"><Database/></div><div><h2>Supabase</h2><p>Banco central de leads, respostas, scores e origem de campanha.</p><span className={supabaseEnabled?'conn ok':'conn'}>{supabaseEnabled?'● Configurado':'● Não configurado'}</span><code>{project}</code></div></div>
      <div className="settings-card"><div className="settings-icon"><ShieldCheck/></div><div><h2>Privacidade do painel</h2><p>A criação de contas exige autenticação administrativa no servidor. Senhas são processadas pelo Supabase Auth.</p></div></div>
      <div className="settings-card"><div className="settings-icon"><PlugZap/></div><div><h2>CRM</h2><p>O CRM poderá consumir os dados do Supabase depois, sem depender do frontend.</p><span className="conn pending">Próxima etapa</span></div></div>
    </section>
  </>;
}
