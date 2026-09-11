import { Link } from 'react-router-dom';

export default function NotFound(){
  return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24,background:'#f6f8fb'}}>
    <section style={{width:'min(560px,100%)',background:'#fff',border:'1px solid #dce5ec',borderRadius:18,padding:32,textAlign:'center',boxShadow:'0 18px 50px rgba(23,50,77,.08)'}}>
      <div style={{fontSize:13,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'#0f65b6'}}>Erro 404</div>
      <h1 style={{margin:'10px 0',fontSize:30,color:'#17324d'}}>Página não encontrada</h1>
      <p style={{margin:'0 0 22px',color:'#65788a',lineHeight:1.55}}>O endereço acessado não existe no QueroForms. Você pode voltar ao diagnóstico ou entrar na área administrativa.</p>
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <Link className="btn dark" to="/d/gp-ia">Abrir diagnóstico</Link>
        <Link className="btn" to="/login">Área administrativa</Link>
      </div>
    </section>
  </main>;
}
