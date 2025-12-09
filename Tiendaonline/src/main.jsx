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
import PedidosAdmin from './PedidosAdmin.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Inicio/>} />
      <Route path="/login" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/mispedidos" element={<MisPedidos />} />
      <Route path="/pedidosadmin" element={<PedidosAdmin />} />
    </Routes>
  </BrowserRouter>
)
