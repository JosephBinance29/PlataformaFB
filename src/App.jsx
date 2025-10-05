// src/App.jsx - VERSIÓN FINAL CON RUTAS PÚBLICAS Y PRIVADAS PROTEGIDAS

import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importa AMBOS componentes guardianes
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Importa todas tus páginas
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Eventos from './pages/Eventos';
import Plantilla from './pages/Plantilla';
import DetalleEvento from './pages/DetalleEvento';
import Configuracion from './pages/Configuracion';

// ... (El código del componente Navbar no cambia)
function Navbar() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  return (
    <nav className="navbar">
      <div className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/eventos">Eventos</NavLink>
        <NavLink to="/plantilla">Plantilla</NavLink>
        {currentUser?.rol === 'administrador' && (
          <NavLink to="/configuracion">Configuración</NavLink>
        )}
      </div>
      <div className="nav-user">
        <span className="user-email">{currentUser.email}</span>
        <button onClick={logout} className="logout-button">Cerrar Sesión</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container">
          <Routes>
            {/* --- Rutas Públicas Protegidas --- */}
            {/* Solo se puede acceder si el usuario NO ha iniciado sesión */}
            <Route 
              path="/login" 
              element={<PublicRoute><Login /></PublicRoute>} 
            />
            <Route 
              path="/signup" 
              element={<PublicRoute><Registro /></PublicRoute>} 
            />
            
            {/* --- Rutas Privadas Protegidas --- */}
            {/* Solo se puede acceder si el usuario SÍ ha iniciado sesión */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
            <Route path="/plantilla" element={<ProtectedRoute><Plantilla /></ProtectedRoute>} />
            <Route path="/evento/:eventoId" element={<ProtectedRoute><DetalleEvento /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />

            {/* Ruta por defecto */}
            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

            {/* Ruta para páginas no encontradas */}
            <Route path="*" element={<div><h2>404 - Página no encontrada</h2></div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
