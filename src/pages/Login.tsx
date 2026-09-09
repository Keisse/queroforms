import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const navigate=useNavigate();

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setLoading(true); setError('');
    const {error}=await signIn(email,password);
    setLoading(false);
    if(error){ setError('E-mail ou senha inválidos.'); return; }
    navigate('/');
  };

  return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f6f8fb'}}>
    <form onSubmit={submit} style={{background:'#fff',border:'1px solid #e1e9ef',borderRadius:18,padding:36,width:340,display:'flex',flexDirection:'column',gap:14}}>
      <h1 style={{margin:0,fontSize:22}}>Entrar</h1>
      <p style={{margin:0,color:'#7a8b9c',fontSize:14}}>Acesso ao painel do Diagnóstico de Maturidade.</p>
      <label style={{fontSize:13,fontWeight:600}}>E-mail</label>
      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
      <label style={{fontSize:13,fontWeight:600}}>Senha</label>
      <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} style={{padding:12,border:'1px solid #d0dbe3',borderRadius:10}}/>
      {error && <div className="save-error">{error}</div>}
      <button className="primary big" disabled={loading} type="submit">{loading?'Entrando...':'Entrar'}</button>
    </form>
  </div>;
}
