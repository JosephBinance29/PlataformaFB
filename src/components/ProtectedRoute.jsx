// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Si no hay usuario, redirige a la página de login.
    // El 'replace' evita que el usuario pueda volver atrás con el botón del navegador.
    return <Navigate to="/login" replace />;
  }

  // Si hay un usuario, muestra el componente hijo (la página que se quería ver).
  return children;
}

export default ProtectedRoute;
