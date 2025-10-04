// src/pages/Registro.jsx
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirige a la página principal después del registro exitoso
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Crear una Cuenta</h2>
      <form onSubmit={handleRegistro}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" required style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Registrarse</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
export default Registro;
