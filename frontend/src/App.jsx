import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Operario from './Operario';
import Gerencia from './Gerencia';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="nav-link">Inicio</Link>
        <Link to="/escaner" className="nav-link">Operario (Escáner)</Link>
        <Link to="/dashboard" className="nav-link">Gerencia (Dashboard)</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h2 className="titulo-principal" style={{marginTop: '50px'}}>Sistema de Inventario QR</h2>} />
        <Route path="/escaner" element={<Operario />} />
        <Route path="/dashboard" element={<Gerencia />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;