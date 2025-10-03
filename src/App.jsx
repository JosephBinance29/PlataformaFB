// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Plantilla from './pages/Plantilla';
import Eventos from './pages/Eventos';
import DetalleEvento from './pages/DetalleEvento';
import Dashboard from './pages/Dashboard';

function App() {
  // Estilos para los enlaces de navegación (esto puede quedarse aquí o moverse a CSS)
  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    transition: 'background-color 0.3s'
  };

  // Estilo para el enlace activo (opcional pero recomendado)
  // Nota: React Router v6 no tiene `activeClassName` por defecto, esto es una simulación.
  // Para una solución real, se usaría `NavLink` en lugar de `Link`.
  // Por simplicidad, lo mantenemos así por ahora.

  return (
    <Router>
      {/* Usamos el contenedor principal con su clase CSS para la responsividad */}
      <div className="app-container">
        
        <nav style={{ 
          background: '#333742', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          display: 'flex', 
          gap: '10px',
          flexWrap: 'wrap' // Añadido para que los botones pasen a la siguiente línea en pantallas muy pequeñas
        }}>
          <Link to="/" style={navLinkStyle}>Plantilla</Link>
          <Link to="/eventos" style={navLinkStyle}>Eventos</Link>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Plantilla />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/evento/:eventoId" element={<DetalleEvento />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
