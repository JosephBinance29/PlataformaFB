// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase'; // Nos aseguramos de importar 'auth' desde el lugar correcto
import { onAuthStateChanged } from 'firebase/auth';

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Creamos un "hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Creamos el componente "Proveedor" que envolverá nuestra aplicación
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // ¡ESTADO DE CARGA! Clave para evitar la pantalla en blanco.

  useEffect(() => {
    // onAuthStateChanged es un "oyente" de Firebase.
    // Se ejecuta cuando el componente se monta y cada vez que el estado de autenticación cambia (login/logout).
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user); // Si el usuario está logueado, 'user' tendrá sus datos. Si no, será 'null'.
      setLoading(false); // Una vez que sabemos si hay usuario o no, dejamos de cargar.
    });

    // Cuando el componente se desmonte, nos "desuscribimos" del oyente para evitar fugas de memoria.
    return unsubscribe;
  }, []); // El array vacío asegura que esto solo se ejecute una vez, al montar el componente.

  // El valor que compartiremos con toda la aplicación
  const value = {
    currentUser,
    setCurrentUser, // Lo exportamos por si lo necesitamos en el Login
    loading // ¡Añadimos el estado de carga al valor del contexto!
  };

  // Mientras estamos comprobando si el usuario está logueado, mostramos un mensaje de "Cargando...".
  // ¡ESTO EVITA LA PANTALLA EN BLANCO!
  // Solo cuando 'loading' es falso, mostramos los 'children' (el resto de la aplicación).
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
