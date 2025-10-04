// src/pages/Plantilla.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// ¡CAMBIO 1: Importar el hook de autenticación!
import { useAuth } from '../context/AuthContext';

function Plantilla() {
  const [jugadores, setJugadores] = useState([]);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState(null);
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha'
  });

  // ¡CAMBIO 2: Obtener el usuario actual que ha iniciado sesión!
  const { currentUser } = useAuth();

  // --- OBTENER JUGADORES (AHORA FILTRADOS POR USUARIO) ---
  useEffect(() => {
    const obtenerJugadores = async () => {
      // ¡CAMBIO 3: La consulta ahora tiene un 'where' para filtrar por el ID del usuario!
      // Solo traerá los jugadores cuyo campo 'userId' coincida con el ID del usuario logueado.
      if (currentUser) {
        const q = query(collection(db, 'jugadores'), where("userId", "==", currentUser.uid));
        const data = await getDocs(q);
        setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    obtenerJugadores();
  }, [currentUser]); // Se ejecuta cada vez que el usuario cambia (login/logout)

  // --- CREAR JUGADOR (AHORA CON LA MARCA DEL USUARIO) ---
  const crearJugador = async (e) => {
    e.preventDefault();
    if (!nuevoJugador.nombre || !nuevoJugador.apellidos) return;
    
    await addDoc(collection(db, 'jugadores'), {
      ...nuevoJugador,
      dorsal: Number(nuevoJugador.dorsal) || 0,
      edad: Number(nuevoJugador.edad) || 0,
      // ¡CAMBIO 4: Al crear un jugador, le añadimos la "marca" del propietario!
      userId: currentUser.uid,
      // Inicializamos todos los campos numéricos para evitar errores
      total_goles: 0,
      total_asistencias: 0,
      total_minutos_jugados: 0,
      total_convocatorias: 0,
      total_tarjetas_amarillas: 0,
      total_tarjetas_rojas: 0,
      total_faltas_cometidas: 0,
      eventos_evaluados: 0,
      promedio_tecnica: 0,
      promedio_fisico: 0,
      promedio_tactica: 0,
      promedio_actitud: 0,
      valoracion_general_promedio: 0,
    });

    setNuevoJugador({ nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha' });
    // Refrescamos la lista para mostrar el nuevo jugador
    const q = query(collection(db, 'jugadores'), where("userId", "==", currentUser.uid));
    const data = await getDocs(q);
    setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // --- LÓGICA DE EDICIÓN Y BORRADO (No necesitan cambios, ya operan sobre un ID específico) ---
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
    // Refrescamos la lista
    const q = query(collection(db, 'jugadores'), where("userId", "==", currentUser.uid));
    const data = await getDocs(q);
    setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const eliminarJugador = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este jugador? Se borrarán también todas sus evaluaciones asociadas.")) {
      // Eliminar evaluaciones asociadas
      const q = query(collection(db, 'evaluaciones'), where('id_jugador', '==', id));
      const evaluacionesSnapshot = await getDocs(q);
      const batch = writeBatch(db);
      evaluacionesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Eliminar jugador
      await deleteDoc(doc(db, 'jugadores', id));
      
      // Refrescar lista
      setJugadores(jugadores.filter(j => j.id !== id));
    }
  };

  // --- RENDERIZADO (JSX - sin cambios funcionales) ---
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div className="card">
        <h2>Añadir Nuevo Jugador</h2>
        <form onSubmit={crearJugador} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
          <input value={nuevoJugador.dorsal} onChange={e => setNuevoJugador({ ...nuevoJugador, dorsal: e.target.value })} placeholder="Dorsal" type="number" />
          <input value={nuevoJugador.nombre} onChange={e => setNuevoJugador({ ...nuevoJugador, nombre: e.target.value })} placeholder="Nombre" />
          <input value={nuevoJugador.apellidos} onChange={e => setNuevoJugador({ ...nuevoJugador, apellidos: e.target.value })} placeholder="Apellidos" />
          <input value={nuevoJugador.posicion} onChange={e => setNuevoJugador({ ...nuevoJugador, posicion: e.target.value })} placeholder="Posición" />
          <input value={nuevoJugador.edad} onChange={e => setNuevoJugador({ ...nuevoJugador, edad: e.target.value })} placeholder="Edad" type="number" />
          <select value={nuevoJugador.pierna_habil} onChange={e => setNuevoJugador({ ...nuevoJugador, pierna_habil: e.target.value })}>
            <option value="Derecha">Derecha</option>
            <option value="Izquierda">Izquierda</option>
          </select>
          <button type="submit" style={{ gridColumn: '1 / -1' }}>Añadir Jugador</button>
        </form>
      </div>

      <h2 style={{ marginTop: '40px' }}>Plantilla del Equipo</h2>
      {jugadores.map(jugador => (
        <div key={jugador.id} className="card">
          {jugadorEnEdicion && jugadorEnEdicion.id === jugador.id ? (
            // VISTA DE EDICIÓN
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
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
              <div className="card" style={{ background: '#2a2d35', padding: '15px' }}>
                <h4>Valoraciones Promedio (calculado automáticamente)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-around', color: '#ccc' }}>
                  <span>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || '0.00'}</strong></span>
                  <span>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || '0.00'}</strong></span>
                  <span>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || '0.00'}</strong></span>
                  <span>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || '0.00'}</strong></span>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <button onClick={guardarCambios}>Guardar Cambios</button>
                <button onClick={() => setJugadorEnEdicion(null)} style={{ marginLeft: '10px', background: 'grey' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            // VISTA NORMAL REDISEÑADA
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '3 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {jugador.valoracion_general_promedio > 0 && (
                    <div style={{ background: '#4CAF50', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{jugador.valoracion_general_promedio.toFixed(2)}</div>
                      <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Media</div>
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0 }}>{jugador.dorsal}. {jugador.nombre} {jugador.apellidos}</h3>
                    <p style={{ margin: '5px 0', color: '#ccc' }}>{jugador.posicion} | {jugador.edad} años | Pierna: {jugador.pierna_habil}</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #444', marginTop: '15px', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', color: '#aaa', fontSize: '0.9em' }}>
                  <div>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || '-'}</strong></div>
                  <div>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || '-'}</strong></div>
                  <div>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || '-'}</strong></div>
                  <div>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || '-'}</strong></div>
                </div>
              </div>
              <div style={{ flex: '2 1 250px', textAlign: 'right' }}>
                <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '10px' }}>
                  Goles: {jugador.total_goles || 0} | Asist: {jugador.total_asistencias || 0} | Min: {jugador.total_minutos_jugados || 0} | Conv: {jugador.total_convocatorias || 0}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '15px' }}>
                  TA: {jugador.total_tarjetas_amarillas || 0} | TR: {jugador.total_tarjetas_rojas || 0} | Faltas: {jugador.total_faltas_cometidas || 0}
                </div>
                <div>
                  <button onClick={() => iniciarEdicion(jugador)} style={{ padding: '10px 20px', marginRight: '10px' }}>Editar</button>
                  <button onClick={() => eliminarJugador(jugador.id)} style={{ padding: '10px 20px', background: '#c0392b', color: 'white' }}>Eliminar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Plantilla;
