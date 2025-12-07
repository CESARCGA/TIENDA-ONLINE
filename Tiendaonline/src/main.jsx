import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route, Link } from "react-router-dom";
import App from './App.jsx'
import Register from './Registre.jsx'
import Inicio from './Inicio.jsx'
import Admin from './Admin.jsx';  
import Panel from './Panel.jsx';
import MisPedidos from './MisPedidos.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/mispedidos" element={<MisPedidos />} />
    </Routes>
  </BrowserRouter>
)
