import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Operario from './Operario';
import Gerencia from './Gerencia';

const fotosInicio = [
  {
    src: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=900&q=85',
    alt: 'Camisa blanca doblada',
  },
  {
    src: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85',
    alt: 'Camisa azul de vestir',
  },
  {
    src: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85',
    alt: 'Telas de distintos colores',
  },
];

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="nav-link">Inicio</Link>
        <Link to="/escaner" className="nav-link">Operario (Escáner)</Link>
        <Link to="/dashboard" className="nav-link">Gerencia (Dashboard)</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <main className="inicio">
              <h2 className="titulo-principal">Sistema de Inventario QR</h2>
              <section className="galeria-inicio" aria-label="Colección de camisería">
                {fotosInicio.map((foto) => (
                  <img key={foto.src} className="foto-inicio" src={foto.src} alt={foto.alt} />
                ))}
              </section>
            </main>
          }
        />
        <Route path="/escaner" element={<Operario />} />
        <Route path="/dashboard" element={<Gerencia />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;