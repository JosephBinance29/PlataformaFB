// src/pages/Plantilla.jsx - VERSIÓN FINAL CON NUEVO DISEÑO DE TARJETA

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function Plantilla() {
  const [jugadores, setJugadores] = useState([]);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState(null);
  const [nuevoJugador, setNuevoJugador] = useState({ nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha' });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.teamId) {
      const q = query(collection(db, 'jugadores'), where("teamId", "==", currentUser.teamId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setJugadores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const crearJugador = async (e) => {
    e.preventDefault();
    if (!nuevoJugador.nombre || !nuevoJugador.apellidos) return;
    await addDoc(collection(db, 'jugadores'), {
      ...nuevoJugador,
      dorsal: Number(nuevoJugador.dorsal) || 0,
      edad: Number(nuevoJugador.edad) || 0,
      teamId: currentUser.teamId,
      total_goles: 0, total_asistencias: 0, total_minutos_jugados: 0, total_convocatorias: 0,
      total_tarjetas_amarillas: 0, total_tarjetas_rojas: 0, total_faltas_cometidas: 0,
      eventos_evaluados: 0, promedio_tecnica: 0, promedio_fisico: 0, promedio_tactica: 0,
      promedio_actitud: 0, valoracion_general_promedio: 0,
    });
    setNuevoJugador({ nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha' });
  };

  const iniciarEdicion = (jugador) => { setJugadorEnEdicion({ ...jugador }); };

  const guardarCambios = async () => {
    const jugadorDocRef = doc(db, 'jugadores', jugadorEnEdicion.id);
    await updateDoc(jugadorDocRef, { ...jugadorEnEdicion, dorsal: Number(jugadorEnEdicion.dorsal) || 0, edad: Number(jugadorEnEdicion.edad) || 0 });
    setJugadorEnEdicion(null);
  };

  const eliminarJugador = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este jugador?")) { await deleteDoc(doc(db, 'jugadores', id)); }
  };

  return (
    <div>
      {currentUser?.rol === 'administrador' && (
        <div className="card">
          <h2>Añadir Nuevo Jugador</h2>
          <form onSubmit={crearJugador} className="form-grid">
            <input value={nuevoJugador.dorsal} onChange={e => setNuevoJugador({ ...nuevoJugador, dorsal: e.target.value })} placeholder="Dorsal" type="number" />
            <input value={nuevoJugador.nombre} onChange={e => setNuevoJugador({ ...nuevoJugador, nombre: e.target.value })} placeholder="Nombre" required/>
            <input value={nuevoJugador.apellidos} onChange={e => setNuevoJugador({ ...nuevoJugador, apellidos: e.target.value })} placeholder="Apellidos" required/>
            <input value={nuevoJugador.posicion} onChange={e => setNuevoJugador({ ...nuevoJugador, posicion: e.target.value })} placeholder="Posición" />
            <input value={nuevoJugador.edad} onChange={e => setNuevoJugador({ ...nuevoJugador, edad: e.target.value })} placeholder="Edad" type="number" />
            <select value={nuevoJugador.pierna_habil} onChange={e => setNuevoJugador({ ...nuevoJugador, pierna_habil: e.target.value })}>
              <option value="Derecha">Derecha</option>
              <option value="Izquierda">Izquierda</option>
            </select>
            <button type="submit" className="btn-full-width">Añadir Jugador</button>
          </form>
        </div>
      )}

      <h2 style={{ marginTop: '40px' }}>Plantilla del Equipo</h2>
      <div className="plantilla-grid">
        {jugadores.map(jugador => (
          <div key={jugador.id} className="card-jugador">
            <div className="card-jugador-header">
              <div className="jugador-identidad">
                <h3>{jugador.dorsal}. {jugador.nombre} {jugador.apellidos}</h3>
                <p>{jugador.posicion} | {jugador.edad} años | Pierna: {jugador.pierna_habil}</p>
              </div>
              {jugador.valoracion_general_promedio > 0 && (
                <div className="jugador-media-global">
                  <span>{jugador.valoracion_general_promedio.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="card-jugador-body">
              <div className="jugador-stats-principales">
                <div><span>{jugador.promedio_tecnica?.toFixed(2) || '-'}</span> TÉC</div>
                <div><span>{jugador.promedio_fisico?.toFixed(2) || '-'}</span> FÍS</div>
                <div><span>{jugador.promedio_tactica?.toFixed(2) || '-'}</span> TÁC</div>
                <div><span>{jugador.promedio_actitud?.toFixed(2) || '-'}</span> ACT</div>
              </div>
              <div className="jugador-stats-secundarias">
                Goles: {jugador.total_goles || 0} | Asist: {jugador.total_asistencias || 0} | Min: {jugador.total_minutos_jugados || 0}
              </div>
            </div>
            {currentUser?.rol === 'administrador' && (
              <div className="card-jugador-footer">
                <button onClick={() => iniciarEdicion(jugador)} className="btn-secondary">Editar</button>
                <button onClick={() => eliminarJugador(jugador.id)} className="btn-danger">Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Plantilla;
