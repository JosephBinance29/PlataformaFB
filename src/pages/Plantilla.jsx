// src/pages/Plantilla.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

function Plantilla() {
  const [plantilla, setPlantilla] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para el formulario de creación
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '',
    apellidos: '',
    posicion: '',
    dorsal: '',
    edad: '',
    pierna_habil: 'Derecha' // Valor por defecto
  });

  // Estado para el formulario de edición
  const [formDataEdicion, setFormDataEdicion] = useState({});

  const obtenerJugadores = async () => {
    const data = await getDocs(collection(db, 'jugadores'));
    // Ordenamos por dorsal para una mejor visualización
    const listaOrdenada = data.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => Number(a.dorsal) - Number(b.dorsal));
    setPlantilla(listaOrdenada);
  };

  useEffect(() => {
    obtenerJugadores();
  }, []);

  // --- MANEJADORES DE FORMULARIOS ---
  const handleNuevoJugadorChange = (e) => {
    const { name, value } = e.target;
    setNuevoJugador(prev => ({ ...prev, [name]: value }));
  };

  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setFormDataEdicion(prev => ({ ...prev, [name]: value }));
  };

  // --- OPERACIONES CRUD ---
  const crearJugador = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'jugadores'), { 
      ...nuevoJugador, 
      total_goles: 0, 
      total_asistencias: 0, 
      total_minutos_jugados: 0, 
      total_convocatorias: 0,
      eventos_evaluados: 0 // Inicializamos los contadores
    });
    // Limpiar formulario
    setNuevoJugador({ nombre: '', apellidos: '', posicion: '', dorsal: '', edad: '', pierna_habil: 'Derecha' });
    obtenerJugadores();
  };

  const iniciarEdicion = (jugador) => {
    setEditandoId(jugador.id);
    setFormDataEdicion(jugador);
  };

  const guardarCambios = async (id) => {
    const jugadorDoc = doc(db, 'jugadores', id);
    await updateDoc(jugadorDoc, formDataEdicion);
    setEditandoId(null);
    obtenerJugadores();
  };

  const eliminarJugador = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar a este jugador?")) {
      const jugadorDoc = doc(db, 'jugadores', id);
      await deleteDoc(jugadorDoc);
      obtenerJugadores();
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* --- FORMULARIO DE CREACIÓN COMPLETO --- */}
      <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Añadir Nuevo Jugador</h2>
        <form onSubmit={crearJugador}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <input name="nombre" value={nuevoJugador.nombre} onChange={handleNuevoJugadorChange} placeholder="Nombre" required style={{ padding: '10px' }} />
            <input name="apellidos" value={nuevoJugador.apellidos} onChange={handleNuevoJugadorChange} placeholder="Apellidos" required style={{ padding: '10px' }} />
            <input name="posicion" value={nuevoJugador.posicion} onChange={handleNuevoJugadorChange} placeholder="Posición" required style={{ padding: '10px' }} />
            <input name="dorsal" type="number" value={nuevoJugador.dorsal} onChange={handleNuevoJugadorChange} placeholder="Dorsal" style={{ padding: '10px' }} />
            <input name="edad" type="number" value={nuevoJugador.edad} onChange={handleNuevoJugadorChange} placeholder="Edad" style={{ padding: '10px' }} />
            <select name="pierna_habil" value={nuevoJugador.pierna_habil} onChange={handleNuevoJugadorChange} style={{ padding: '10px' }}>
              <option value="Derecha">Derecha</option>
              <option value="Izquierda">Izquierda</option>
              <option value="Ambidiestro">Ambidiestro</option>
            </select>
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', cursor: 'pointer', fontSize: '1.1em' }}>Añadir Jugador a la Plantilla</button>
        </form>
      </div>

      {/* --- LISTA DE JUGADORES --- */}
      <h1>Plantilla del Equipo</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {plantilla.map(jugador => (
          <div key={jugador.id} style={{ background: '#333742', padding: '20px', borderRadius: '8px' }}>
            {editandoId === jugador.id ? (
              // --- VISTA DE EDICIÓN ---
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <input name="dorsal" type="number" value={formDataEdicion.dorsal || ''} onChange={handleEdicionChange} placeholder="Dorsal" style={{ padding: '10px' }} />
                  <input name="nombre" value={formDataEdicion.nombre || ''} onChange={handleEdicionChange} placeholder="Nombre" required style={{ padding: '10px' }} />
                  <input name="apellidos" value={formDataEdicion.apellidos || ''} onChange={handleEdicionChange} placeholder="Apellidos" required style={{ padding: '10px' }} />
                  <input name="posicion" value={formDataEdicion.posicion || ''} onChange={handleEdicionChange} placeholder="Posición" required style={{ padding: '10px' }} />
                  <input name="edad" type="number" value={formDataEdicion.edad || ''} onChange={handleEdicionChange} placeholder="Edad" style={{ padding: '10px' }} />
                  <select name="pierna_habil" value={formDataEdicion.pierna_habil || 'Derecha'} onChange={handleEdicionChange} style={{ padding: '10px' }}>
                    <option value="Derecha">Derecha</option>
                    <option value="Izquierda">Izquierda</option>
                    <option value="Ambidiestro">Ambidiestro</option>
                  </select>
                </div>
                <div style={{ borderTop: '1px solid #444', paddingTop: '20px', marginTop: '20px' }}>
                  <h4>Valoraciones Promedio (calculado automáticamente)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', color: '#ccc' }}>
                    <p>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || 'N/A'}</strong></p>
                    <p>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || 'N/A'}</strong></p>
                    <p>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || 'N/A'}</strong></p>
                    <p>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || 'N/A'}</strong></p>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button onClick={() => guardarCambios(jugador.id)} style={{ padding: '10px 20px', marginRight: '10px' }}>Guardar Cambios</button>
                  <button onClick={() => setEditandoId(null)} style={{ padding: '10px 20px', background: '#555' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              // --- VISTA NORMAL REDISEÑADA ---
<div className="player-card-normal-view" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
  {/* Columna Izquierda: Datos Principales */}
  <div style={{ flex: 3 }}>
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
    <div style={{ borderTop: '1px solid #444', marginTop: '15px', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', color: '#aaa', fontSize: '0.9em' }}>
      <div>Técnica: <strong>{jugador.promedio_tecnica?.toFixed(2) || '-'}</strong></div>
      <div>Físico: <strong>{jugador.promedio_fisico?.toFixed(2) || '-'}</strong></div>
      <div>Táctica: <strong>{jugador.promedio_tactica?.toFixed(2) || '-'}</strong></div>
      <div>Actitud: <strong>{jugador.promedio_actitud?.toFixed(2) || '-'}</strong></div>
    </div>
  </div>
  {/* Columna Derecha: Estadísticas y Botones */}
  <div style={{ flex: 2, textAlign: 'right' }}>
    {/* ¡SECCIÓN DE ESTADÍSTICAS ACTUALIZADA! */}
    <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '15px' }}>
      <div>Goles: {jugador.total_goles || 0} | Asist: {jugador.total_asistencias || 0} | Min: {jugador.total_minutos_jugados || 0} | Conv: {jugador.total_convocatorias || 0}</div>
      <div style={{marginTop: '5px'}}>TA: {jugador.total_tarjetas_amarillas || 0} | TR: {jugador.total_tarjetas_rojas || 0} | Faltas: {jugador.total_faltas_cometidas || 0}</div>
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
    </div>
  );
}

export default Plantilla;
