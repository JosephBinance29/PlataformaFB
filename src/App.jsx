// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

// Importa todas tus páginas, incluyendo las nuevas de Login y Registro
import Plantilla from './pages/Plantilla';
import Eventos from './pages/Eventos';
import DetalleEvento from './pages/DetalleEvento';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Registro from './pages/Registro';

// --- COMPONENTE ESPECIAL PARA PROTEGER RUTAS ---
// Este componente actúa como un "guardia de seguridad".
// Si hay un usuario logueado, muestra el contenido (children).
// Si no, redirige a la página de login.
function RutaProtegida({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Si no hay usuario, no renderices nada, solo redirige.
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  const { currentUser } = useAuth();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión: ", error);
    });
  };

  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
  };

  return (
    <Router>
      <div className="app-container">
        
        {/* --- BARRA DE NAVEGACIÓN INTELIGENTE --- */}
        {/* Solo se muestra si hay un usuario logueado */}
        {currentUser && (
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
        )}

        {/* --- SISTEMA DE RUTAS --- */}
        <Routes>
          {/* Rutas Públicas: Cualquiera puede acceder a ellas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas Protegidas: Envueltas en nuestro componente de seguridad */}
          <Route 
            path="/" 
            element={
              <RutaProtegida>
                <Plantilla />
              </RutaProtegida>
            } 
          />
          <Route 
            path="/eventos" 
            element={
              <RutaProtegida>
                <Eventos />
              </RutaProtegida>
            } 
          />
          <Route 
            path="/evento/:eventoId" 
            element={
              <RutaProtegida>
                <DetalleEvento />
              </RutaProtegida>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            } 
          />
          
          {/* Ruta por defecto: Si el usuario escribe cualquier otra cosa en la URL */}
          {/* Si está logueado, lo manda a la plantilla. Si no, al login. */}
          <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
