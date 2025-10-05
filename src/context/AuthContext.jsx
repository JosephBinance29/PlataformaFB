// src/context/AuthContext.jsx - VERSIÓN FINAL A PRUEBA DE FALLOS

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  writeBatch
} from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ¡¡¡NUEVA FUNCIÓN DE REGISTRO CON LÓGICA CORREGIDA!!! ---
  async function signup(email, password) {
    try {
      // PASO 1: Intentar crear el usuario en Firebase Authentication PRIMERO.
      // Si este paso falla (ej. email ya existe), saltará al 'catch' y no continuará.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // PASO 2: Si la creación en Auth fue exitosa, procedemos con la lógica de Firestore.
      const userDocRef = doc(db, 'usuarios', user.uid);

      // PASO 3: Buscar si existe una invitación para este email.
      const invitacionesRef = collection(db, 'invitaciones');
      const q = query(invitacionesRef, where('email', '==', email.toLowerCase()), limit(1));
      const invitacionSnapshot = await getDocs(q);

      if (!invitacionSnapshot.empty) {
        // CASO A: SÍ HAY INVITACIÓN
        const invitacionDoc = invitacionSnapshot.docs[0];
        const datosInvitacion = invitacionDoc.data();

        // Creamos el documento del usuario con los datos de la invitación.
        await setDoc(userDocRef, {
          email: user.email,
          rol: datosInvitacion.rol,
          teamId: datosInvitacion.teamId,
        });

        // Borramos la invitación para que no se pueda volver a usar.
        const batch = writeBatch(db);
        batch.delete(invitacionDoc.ref);
        await batch.commit();

      } else {
        // CASO B: NO HAY INVITACIÓN (comportamiento original)
        // El nuevo usuario es administrador de su propio equipo.
        await setDoc(userDocRef, {
          email: user.email,
          rol: 'administrador',
          teamId: user.uid,
        });
      }
      // La función termina con éxito. onAuthStateChanged se encargará de loguear al usuario.

    } catch (error) {
      // Si llegamos aquí, es porque createUserWithEmailAndPassword falló.
      // Relanzamos el error para que el componente de Registro pueda mostrar el mensaje.
      console.error("Error en el proceso de signup:", error.code, error.message);
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          // Esto puede pasar si el documento de Firestore aún no se ha creado.
          // Damos un pequeño margen o simplemente usamos el usuario de Auth.
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
