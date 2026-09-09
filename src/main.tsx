import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import PublicQuiz from './pages/PublicQuiz';
import Placeholder from './pages/Placeholder';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { getSession, onAuthChange } from './lib/auth';
import './styles/global.css';
import './styles/introCertificate.css';
import './styles/builderResponsive.css';
import './styles/finalPolish.css';
import './styles/aiCloud.css';
import './finalPolish';
import './focusValueImage';
import './modernProjectImage';
import './contextImageUpload';

function Admin({children}:{children:React.ReactNode}){
  const [session,setSession]=useState<Session|null|undefined>(undefined);
  useEffect(()=>{
    getSession().then(setSession);
    return onAuthChange(setSession);
  },[]);
  if(session===undefined) return <div style={{padding:60,textAlign:'center',color:'#7a8b9c'}}>Carregando...</div>;
  if(!session) return <Navigate to="/login" replace/>;
  return <AppShell>{children}</AppShell>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><Routes>
  <Route path="/login" element={<Login/>}/>
  <Route path="/" element={<Admin><Dashboard/></Admin>}/>
  <Route path="/builder/gp-ia" element={<Admin><Builder/></Admin>}/>
  <Route path="/contacts" element={<Admin><Placeholder title="Contatos"/></Admin>}/>
  <Route path="/responses" element={<Admin><Placeholder title="Respostas"/></Admin>}/>
  <Route path="/analytics" element={<Admin><Placeholder title="Análises"/></Admin>}/>
  <Route path="/workflows" element={<Admin><Placeholder title="Workflows"/></Admin>}/>
  <Route path="/settings" element={<Admin><Settings/></Admin>}/>
  <Route path="/d/gp-ia" element={<PublicQuiz/>}/>
</Routes></BrowserRouter></React.StrictMode>)