// src/pages/Configuracion.jsx - VERSIÓN REDISEÑADA Y ESTÉTICA

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function Configuracion() {
  const { currentUser } = useAuth();
  const [emailInvitado, setEmailInvitado] = useState('');
  const [invitaciones, setInvitaciones] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // Usamos un objeto para el tipo de mensaje (éxito/error)

  useEffect(() => {
    if (!currentUser || currentUser.rol !== 'administrador' || !currentUser.teamId) {
      return;
    }
    const q = query(collection(db, 'invitaciones'), where('teamId', '==', currentUser.teamId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvitaciones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!emailInvitado || !currentUser?.teamId) return;
    const q = query(collection(db, 'invitaciones'), where('email', '==', emailInvitado.toLowerCase()), where('teamId', '==', currentUser.teamId));
    const existingInvite = await getDocs(q);
    if (!existingInvite.empty) {
      setMensaje({ texto: 'Error: Ya existe una invitación pendiente para este email.', tipo: 'error' });
      return;
    }
    await addDoc(collection(db, 'invitaciones'), {
      email: emailInvitado.toLowerCase(),
      teamId: currentUser.teamId,
      rol: 'visualizador',
      estado: 'pendiente',
      fecha: new Date()
    });
    setMensaje({ texto: `¡Invitación enviada a ${emailInvitado}!`, tipo: 'exito' });
    setEmailInvitado('');
  };

  const cancelarInvitacion = async (id) => {
    await deleteDoc(doc(db, 'invitaciones', id));
    setMensaje({ texto: 'Invitación cancelada.', tipo: 'exito' });
  };

  if (currentUser?.rol !== 'administrador') {
    return (
        <div className="container">
            <h1>Configuración</h1>
            <div className="card">
                <p>Esta sección solo está disponible para administradores.</p>
            </div>
        </div>
    );
  }

  // ===================================================================
  // JSX REDISEÑADO
  // ===================================================================
  return (
    <div> {/* No necesitamos el fontFamily aquí si ya está global */}
        <h1>Configuración del Equipo</h1>
        
        <div className="card">
            <h2>Invitar Miembro al Cuerpo Técnico</h2>
            <p style={{ color: '#ccc', marginTop: '-10px', marginBottom: '25px' }}>
                Invita a otros entrenadores o analistas a tu equipo. Tendrán acceso de solo lectura a todas las estadísticas y datos.
            </p>
            
            {/* Formulario con Flexbox para alineación perfecta */}
            <form onSubmit={handleInvitar} className="form-invitar">
                <input
                    type="email"
                    value={emailInvitado}
                    onChange={(e) => setEmailInvitado(e.target.value)}
                    placeholder="Email del nuevo miembro"
                    required
                />
                <button type="submit">Invitar</button>
            </form>

            {/* Mensaje de feedback con estilo condicional */}
            {mensaje.texto && (
                <p className={`mensaje-feedback ${mensaje.tipo}`}>
                    {mensaje.texto}
                </p>
            )}
        </div>

        <div className="card">
            <h2>Invitaciones Pendientes</h2>
            <div className="lista-invitaciones">
                {invitaciones.length > 0 ? (
                    invitaciones.map(inv => (
                        <div key={inv.id} className="item-invitacion">
                            <div className="info-invitacion">
                                <span className="email">{inv.email}</span>
                                <span className="rol">(Rol: {inv.rol})</span>
                            </div>
                            <button onClick={() => cancelarInvitacion(inv.id)} className="btn-cancelar">Cancelar</button>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#aaa' }}>No hay invitaciones pendientes.</p>
                )}
            </div>
        </div>
    </div>
  );
}

export default Configuracion;
