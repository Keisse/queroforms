import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Diagnostics from './pages/Diagnostics';
import Analytics from './pages/Analytics';
import Builder from './pages/BuilderPage';
import PublicQuiz from './pages/PublicQuiz';
import Placeholder from './pages/Placeholder';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { getSession, onAuthChange } from './lib/auth';
import './lib/resultSalesEnhancer';
import './lib/processingProgressEnhancer';
import './styles/global.css';
import './styles/introCertificate.css';
import './styles/builderResponsive.css';
import './styles/finalPolish.css';
import './styles/resultSales.css';
import './styles/contextCompact.css';
import './styles/title28.css';
import './styles/photoChoiceButtons.css';
import './styles/answerEmojiFallback.css';
import './styles/specialInsightVisuals.css';
import './styles/quizResponsiveHardening.css';
import './styles/salaryInsightAnimation.css';
import './styles/adminAnalytics.css';
import './styles/builderAnalytics.css';
import './styles/diagnostics.css';

function Admin({children}:{children:React.ReactNode}){
  const [session,setSession]=useState<Session|null|undefined>(undefined);
  useEffect(()=>{
    getSession().then(setSession);
    return onAuthChange(setSession);
  },[]);
  if(session===undefined) return <div style={{padding:60,textAlign:'center',color:'#7a8b9c'}}>Carregando...</div>;
  if(!session) return <Navigate to="/login" replace/>;
  if(session.user.app_metadata?.role!=='admin') return <Navigate to="/login" replace/>;
  return <AppShell>{children}</AppShell>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<Admin><Dashboard/></Admin>}/>
        <Route path="/diagnostics" element={<Admin><Diagnostics/></Admin>}/>
        <Route path="/builder/gp-ia" element={<Admin><Builder/></Admin>}/>
        <Route path="/contacts" element={<Admin><Placeholder title="Contatos"/></Admin>}/>
        <Route path="/responses" element={<Admin><Navigate to="/analytics?tab=responses" replace/></Admin>}/>
        <Route path="/analytics" element={<Admin><Analytics/></Admin>}/>
        <Route path="/workflows" element={<Admin><Placeholder title="Workflows"/></Admin>}/>
        <Route path="/settings" element={<Admin><Settings/></Admin>}/>
        <Route path="/d/:slug" element={<PublicQuiz/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);