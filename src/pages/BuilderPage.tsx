import BuilderStable from './BuilderStable';

export default function BuilderPage(){
  return <>
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
      <a className="btn" href="/d/gp-ia?preview=draft" target="_blank" rel="noreferrer">Pré-visualizar rascunho</a>
    </div>
    <BuilderStable/>
  </>;
}
