import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import PublicQuiz from './pages/PublicQuiz';
import Placeholder from './pages/Placeholder';
import Settings from './pages/Settings';
import './styles/global.css';

function Admin({children}:{children:React.ReactNode}){return <AppShell>{children}</AppShell>}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><Routes>
  <Route path="/" element={<Admin><Dashboard/></Admin>}/>
  <Route path="/builder/gp-ia" element={<Admin><Builder/></Admin>}/>
  <Route path="/contacts" element={<Admin><Placeholder title="Contatos"/></Admin>}/>
  <Route path="/responses" element={<Admin><Placeholder title="Respostas"/></Admin>}/>
  <Route path="/analytics" element={<Admin><Placeholder title="Análises"/></Admin>}/>
  <Route path="/workflows" element={<Admin><Placeholder title="Workflows"/></Admin>}/>
  <Route path="/settings" element={<Admin><Settings/></Admin>}/>
  <Route path="/d/gp-ia" element={<PublicQuiz/>}/>
</Routes></BrowserRouter></React.StrictMode>)
