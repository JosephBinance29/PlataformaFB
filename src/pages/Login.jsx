// src/pages/Login.jsx - VERSIÓN REDISEÑADA

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard'); // Redirige al dashboard tras un login exitoso
    } catch (err) {
      setError('Error al iniciar sesión. Comprueba tu email y contraseña.');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Iniciar Sesión</h2>
        
        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-auth-primary">Iniciar Sesión</button>
        </form>

        <div className="auth-footer">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <p>
            ¿No tienes cuenta? <Link to="/signup">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
