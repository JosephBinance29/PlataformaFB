// src/components/AppLayout.jsx

import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert("Error al cerrar sesión");
    }
  };

  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
  };

  return (
    <div className="app-container">
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: '#333742', 
        padding: '10px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        flexWrap: 'wrap' 
      }}>
        <div>
          <Link to="/" style={navLinkStyle}>Plantilla</Link>
          <Link to="/eventos" style={navLinkStyle}>Eventos</Link>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
        </div>
        <button onClick={handleLogout} style={{ background: '#c0392b', color: 'white' }}>
          Cerrar Sesión
        </button>
      </nav>
      <main>
        <Outlet /> {/* Aquí se renderizarán las páginas (Plantilla, Eventos, etc.) */}
      </main>
    </div>
  );
}

export default AppLayout;
