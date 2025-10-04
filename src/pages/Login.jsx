// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "usuarios", user.uid), {
          email: user.email,
          plan: "free",
          fecha_registro: new Date()
        });
        setCurrentUser(user);
        navigate('/');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
      alert("Error: " + err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      return alert("Por favor, introduce tu email en el campo correspondiente para restablecer la contraseña.");
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("¡Revisa tu correo! Se ha enviado un enlace para restablecer tu contraseña.");
    } catch (err) {
      setError(err.message);
      alert("Error al enviar el correo de restablecimiento: " + err.message);
    }
  };

  return (
    // ¡AQUÍ APLICAMOS LAS CLASES CSS!
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <form onSubmit={handleAuthAction}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <button type="submit">{isRegistering ? 'Registrarse' : 'Iniciar Sesión'}</button>
        </form>

        {!isRegistering && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="#" onClick={handlePasswordReset} style={{ color: '#61dafb', textDecoration: 'none', fontSize: '0.9em' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        )}

        <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-auth">
          {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
