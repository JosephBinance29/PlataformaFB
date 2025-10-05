// src/pages/Plantilla.jsx - VERSIÓN FINAL CON CLASES RESPONSIVE

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function Plantilla() {
  const [jugadores, setJugadores] = useState([]);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState(null);
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha'
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const obtenerJugadores = async () => {
      if (currentUser?.teamId) {
        const q = query(collection(db, 'jugadores'), where("teamId", "==", currentUser.teamId));
        const data = await getDocs(q);
        setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    obtenerJugadores();
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
    const q = query(collection(db, 'jugadores'), where("teamId", "==", currentUser.teamId));
    const data = await getDocs(q);
    setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const iniciarEdicion = (jugador) => {
    setJugadorEnEdicion({ ...jugador });
  };

  const guardarCambios = async () => {
    const jugadorDocRef = doc(db, 'jugadores', jugadorEnEdicion.id);
    await updateDoc(jugadorDocRef, {
      ...jugadorEnEdicion,
      dorsal: Number(jugadorEnEdicion.dorsal) || 0,
      edad: Number(jugadorEnEdicion.edad) || 0,
    });
    setJugadorEnEdicion(null);
    const q = query(collection(db, 'jugadores'), where("teamId", "==", currentUser.teamId));
    const data = await getDocs(q);
    setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const eliminarJugador = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este jugador? Se borrarán también todas sus evaluaciones asociadas.")) {
      const q = query(collection(db, 'evaluaciones'), where('id_jugador', '==', id));
      const evaluacionesSnapshot = await getDocs(q);
      const batch = writeBatch(db);
      evaluacionesSnapshot.forEach(doc => { batch.delete(doc.ref); });
      await batch.commit();
      await deleteDoc(doc(db, 'jugadores', id));
      setJugadores(jugadores.filter(j => j.id !== id));
    }
  };

  // ===================================================================
  // JSX CON CLASES RESPONSIVE APLICADAS
  // ===================================================================
  return (
    <div> {/* Eliminamos el style en línea, ya que los estilos son globales */}
      {currentUser?.rol === 'administrador' && (
        <div className="card">
          <h2>Añadir Nuevo Jugador</h2>
          {/* ¡CAMBIO! Usamos el estilo grid del formulario que ya es responsive */}
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
      {jugadores.map(jugador => (
        <div key={jugador.id} className="card">
          {jugadorEnEdicion && jugadorEnEdicion.id === jugador.id ? (
            // VISTA DE EDICIÓN
            <div>
              {/* ¡CAMBIO! Usamos una clase para el grid de edición */}
              <div className="form-grid">
                <input value={jugadorEnEdicion.dorsal} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, dorsal: e.target.value })} placeholder="Dorsal" type="number" />
                <input value={jugadorEnEdicion.nombre} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, nombre: e.target.value })} placeholder="Nombre" />
                <input value={jugadorEnEdicion.apellidos} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, apellidos: e.target.value })} placeholder="Apellidos" />
                <input value={jugadorEnEdicion.edad} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, edad: e.target.value })} placeholder="Edad" type="number" />
                <input value={jugadorEnEdicion.posicion} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, posicion: e.target.value })} placeholder="Posición" />
                <select value={jugadorEnEdicion.pierna_habil} onChange={e => setJugadorEnEdicion({ ...jugadorEnEdicion, pierna_habil: e.target.value })}>
                  <option value="Derecha">Derecha</option>
                  <option value="Izquierda">Izquierda</option>
                </select>
              </div>
              <div className="card-inner">
                <h4>Valoraciones Promedio</h4>
                <div className="stats-grid">
                  <span>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || '0.00'}</strong></span>
                  <span>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || '0.00'}</strong></span>
                  <span>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || '0.00'}</strong></span>
                  <span>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || '0.00'}</strong></span>
                </div>
              </div>
              <div className="action-buttons">
                <button onClick={guardarCambios}>Guardar Cambios</button>
                <button onClick={() => setJugadorEnEdicion(null)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          ) : (
            // VISTA NORMAL
            // ¡CAMBIO! Usamos la clase card-jugador-flex para el contenedor principal
            <div className="card-jugador-flex">
              <div className="jugador-main-info">
                <div className="jugador-header">
                  {jugador.valoracion_general_promedio > 0 && (
                    <div className="jugador-media">
                      <div className="media-valor">{jugador.valoracion_general_promedio.toFixed(2)}</div>
                      <div className="media-label">Media</div>
                    </div>
                  )}
                  <div>
                    <h3>{jugador.dorsal}. {jugador.nombre} {jugador.apellidos}</h3>
                    <p className="jugador-subtitulo">{jugador.posicion} | {jugador.edad} años | Pierna: {jugador.pierna_habil}</p>
                  </div>
                </div>
                <div className="stats-grid">
                  <div>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || '-'}</strong></div>
                  <div>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || '-'}</strong></div>
                  <div>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || '-'}</strong></div>
                  <div>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || '-'}</strong></div>
                </div>
              </div>
              {/* ¡CAMBIO! Usamos clases para las estadísticas y los botones */}
              <div className="jugador-secondary-info">
                <div className="stats-linea">Goles: {jugador.total_goles || 0} | Asist: {jugador.total_asistencias || 0} | Min: {jugador.total_minutos_jugados || 0} | Conv: {jugador.total_convocatorias || 0}</div>
                <div className="stats-linea">TA: {jugador.total_tarjetas_amarillas || 0} | TR: {jugador.total_tarjetas_rojas || 0} | Faltas: {jugador.total_faltas_cometidas || 0}</div>
                {currentUser?.rol === 'administrador' && (
                  <div className="action-buttons">
                    <button onClick={() => iniciarEdicion(jugador)}>Editar</button>
                    <button onClick={() => eliminarJugador(jugador.id)} className="btn-danger">Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Plantilla;
