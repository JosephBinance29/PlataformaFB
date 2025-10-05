// src/components/PublicRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // Si hay un usuario, redirige a la página principal (dashboard).
    return <Navigate to="/dashboard" replace />;
  }

  // Si no hay usuario, muestra el componente hijo (Login o Registro).
  return children;
}

export default PublicRoute;
