// src/pages/DetalleEvento.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, where, query, increment, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // ¡IMPORTANTE!

function DetalleEvento() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // ¡Obtenemos el usuario!

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // El resto de los estados no necesitan cambios
  const [plantilla, setPlantilla] = useState([]);
  const [convocados, setConvocados] = useState([]);
  const [noConvocados, setNoConvocados] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [evaluacionesGuardadas, setEvaluacionesGuardadas] = useState([]);
  const [yaEvaluado, setYaEvaluado] = useState(false);
  const [vista, setVista] = useState('convocatoria');
  const [statsPartido, setStatsPartido] = useState({ goles_favor: 0, goles_contra: 0 });

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!currentUser) return; // Si no hay usuario, no hacemos nada

      // 1. Obtener el documento del evento
      const eventoDocRef = doc(db, 'eventos', eventoId);
      const eventoDoc = await getDoc(eventoDocRef);

      if (!eventoDoc.exists() || eventoDoc.data().userId !== currentUser.uid) {
        // ¡CONTROL DE SEGURIDAD! Si el evento no existe o no pertenece al usuario, lo echamos.
        setError("Evento no encontrado o no tienes permiso para verlo.");
        setLoading(false);
        return;
      }
      
      const eventoData = eventoDoc.data();
      setEvento({ id: eventoDoc.id, ...eventoData });
      if (eventoData.goles_favor !== undefined) {
        setStatsPartido({ goles_favor: eventoData.goles_favor, goles_contra: eventoData.goles_contra });
      }

      // 2. Obtener la plantilla (ya filtrada por usuario)
      const qPlantilla = query(collection(db, 'jugadores'), where("userId", "==", currentUser.uid));
      const plantillaSnapshot = await getDocs(qPlantilla);
      const listaPlantilla = plantillaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlantilla(listaPlantilla);

      // 3. Comprobar evaluaciones (ya son seguras porque se asocian a un evento seguro)
      const qEvaluaciones = query(collection(db, 'evaluaciones'), where('id_evento', '==', eventoId));
      const evaluacionesSnapshot = await getDocs(qEvaluaciones);
      
      if (!evaluacionesSnapshot.empty) {
        setYaEvaluado(true);
        setVista('evaluacion');
        const datosGuardados = evaluacionesSnapshot.docs.map(docEval => {
          const datos = docEval.data();
          const jugadorInfo = listaPlantilla.find(j => j.id === datos.id_jugador);
          return { ...datos, nombre: jugadorInfo?.nombre || 'N/A', apellidos: jugadorInfo?.apellidos || '' };
        });
        setEvaluacionesGuardadas(datosGuardados);
      }

      // 4. Separar en convocados y no convocados
      const convocadosIds = eventoData.convocados || [];
      setConvocados(listaPlantilla.filter(j => convocadosIds.includes(j.id)));
      setNoConvocados(listaPlantilla.filter(j => !convocadosIds.includes(j.id)));
      
      setLoading(false);
    };

    obtenerDatos();
  }, [eventoId, currentUser]);

  // --- El resto de las funciones (guardar, eliminar, etc.) no necesitan la marca del userId ---
  // porque ya operan sobre un evento o jugador que sabemos que es del usuario.
  // ... (pegar aquí el resto de funciones de DetalleEvento.jsx sin cambios)
  // --- Lógica de Convocatoria (sin cambios) ---
  const moverJugador = (jugador, aConvocados) => {
    if (yaEvaluado) {
      alert("No se puede modificar la convocatoria de un evento que ya ha sido evaluado.");
      return;
    }
    if (aConvocados) {
      setNoConvocados(noConvocados.filter(j => j.id !== jugador.id));
      setConvocados([...convocados, jugador]);
    } else {
      setConvocados(convocados.filter(j => j.id !== jugador.id));
      setNoConvocados([...noConvocados, jugador]);
    }
  };

  const guardarConvocatoria = async () => {
    const convocadosIds = convocados.map(j => j.id);
    const eventoDocRef = doc(db, 'eventos', eventoId);
    await updateDoc(eventoDocRef, { convocados: convocadosIds });

    for (const jugador of plantilla) {
      const jugadorDocRef = doc(db, 'jugadores', jugador.id);
      const convocadoEstaVez = convocadosIds.includes(jugador.id);
      const yaEstabaConvocado = (evento.convocados || []).includes(jugador.id);

      if (convocadoEstaVez && !yaEstabaConvocado) {
        await updateDoc(jugadorDocRef, { total_convocatorias: increment(1) });
      } else if (!convocadoEstaVez && yaEstabaConvocado) {
        await updateDoc(jugadorDocRef, { total_convocatorias: increment(-1) });
      }
    }
    alert("Convocatoria guardada.");
    window.location.reload();
  };

  // --- Lógica de Evaluación (actualizada) ---
  const handleEvalChange = (jugadorId, campo, valor) => {
    setEvaluaciones(prev => ({
      ...prev,
      [jugadorId]: {
        ...prev[jugadorId],
        [campo]: Number(valor)
      }
    }));
  };

  const handleStatsPartidoChange = (e) => {
    const { name, value } = e.target;
    setStatsPartido(prev => ({ ...prev, [name]: Number(value) }));
  };

  // --- Función de Guardado (sin cambios) ---
  const guardarEvaluacionesYStats = async () => {
    if (Object.keys(evaluaciones).length === 0) { alert("No has introducido ninguna evaluación."); return; }
    let sumaDePromediosColectivos = 0;
    let jugadoresEvaluadosCount = 0;
    const batch = writeBatch(db);

    for (const jugadorId in evaluaciones) {
      const datosEvaluacion = evaluaciones[jugadorId];
      
      // Añadir evaluación a la colección
      const evalDocRef = doc(collection(db, 'evaluaciones'));
      batch.set(evalDocRef, { 
        id_jugador: jugadorId, 
        id_evento: eventoId, 
        fecha_evento: evento.fecha, 
        userId: currentUser.uid, // ¡Marca de propietario también aquí!
        ...datosEvaluacion 
      });

      const jugadorDocRef = doc(db, 'jugadores', jugadorId);
      const jugadorDoc = await getDoc(jugadorDocRef);
      const datosJugador = jugadorDoc.data();
      const updates = {
        total_goles: increment(datosEvaluacion.goles || 0),
        total_asistencias: increment(datosEvaluacion.asistencias || 0),
        total_minutos_jugados: increment(datosEvaluacion.minutos_jugados || 0),
        total_tarjetas_amarillas: increment(datosEvaluacion.tarjetas_amarillas_partido || 0),
        total_tarjetas_rojas: increment(datosEvaluacion.tarjetas_rojas_partido || 0),
        total_faltas_cometidas: increment(datosEvaluacion.faltas_cometidas_partido || 0),
      };
      const eventosEvaluadosPrevios = datosJugador.eventos_evaluados || 0;
      const nuevoTotalEventosEvaluados = eventosEvaluadosPrevios + 1;
      updates.promedio_tecnica = ((datosJugador.promedio_tecnica || 0) * eventosEvaluadosPrevios + (datosEvaluacion.tecnica || 0)) / nuevoTotalEventosEvaluados;
      updates.promedio_fisico = ((datosJugador.promedio_fisico || 0) * eventosEvaluadosPrevios + (datosEvaluacion.fisico || 0)) / nuevoTotalEventosEvaluados;
      updates.promedio_tactica = ((datosJugador.promedio_tactica || 0) * eventosEvaluadosPrevios + (datosEvaluacion.tactica || 0)) / nuevoTotalEventosEvaluados;
      updates.promedio_actitud = ((datosJugador.promedio_actitud || 0) * eventosEvaluadosPrevios + (datosEvaluacion.actitud || 0)) / nuevoTotalEventosEvaluados;
      updates.eventos_evaluados = nuevoTotalEventosEvaluados;
      updates.valoracion_general_promedio = (updates.promedio_tecnica + updates.promedio_fisico + updates.promedio_tactica + updates.promedio_actitud) / 4;
      
      batch.update(jugadorDocRef, updates);

      const promedioIndividualColectivo = ((datosEvaluacion.tecnica || 0) + (datosEvaluacion.fisico || 0) + (datosEvaluacion.tactica || 0) + (datosEvaluacion.actitud || 0)) / 4;
      if (promedioIndividualColectivo > 0) {
        sumaDePromediosColectivos += promedioIndividualColectivo;
        jugadoresEvaluadosCount++;
      }
    }
    const valoracionColectivaFinal = jugadoresEvaluadosCount > 0 ? sumaDePromediosColectivos / jugadoresEvaluadosCount : 0;
    let puntos = 0;
    if (statsPartido.goles_favor > statsPartido.goles_contra) puntos = 3;
    else if (statsPartido.goles_favor === statsPartido.goles_contra) puntos = 1;
    
    const eventoDocRef = doc(db, 'eventos', eventoId);
    batch.update(eventoDocRef, { 
      valoracion_colectiva: valoracionColectivaFinal,
      goles_favor: statsPartido.goles_favor,
      goles_contra: statsPartido.goles_contra,
      puntos_obtenidos: puntos
    });

    await batch.commit();
    alert("¡Evaluaciones y estadísticas del partido guardadas!");
    window.location.reload();
  };

  // --- Función de Eliminar (sin cambios) ---
  const eliminarEvento = async () => {
    if (window.confirm("¿Seguro que quieres eliminar este evento y todas sus evaluaciones asociadas? Esta acción no se puede deshacer.")) {
      const q = query(collection(db, 'evaluaciones'), where('id_evento', '==', eventoId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => { batch.delete(doc.ref); });
      batch.delete(doc(db, 'eventos', eventoId));
      await batch.commit();
      navigate('/eventos');
    }
  };

  if (loading) return <div>Cargando evento...</div>;
  if (error) return <div className="card" style={{ background: '#c0392b', color: 'white' }}>{error}</div>;

  // --- RENDERIZADO (JSX - sin cambios) ---
  // ... (pegar aquí el JSX de DetalleEvento.jsx sin cambios)
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>{evento.tipo}: {evento.descripcion}</h1>
      <p>{new Date(evento.fecha).toLocaleDateString()} ({evento.condicion})</p>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', marginBottom: '20px' }}>
        <button onClick={() => setVista('convocatoria')} style={{ background: vista === 'convocatoria' ? '#61dafb' : '#555' }}>1. Convocatoria</button>
        <button onClick={() => setVista('evaluacion')} style={{ background: vista === 'evaluacion' ? '#61dafb' : '#555' }}>2. Evaluación y Estadísticas</button>
      </div>

      {vista === 'convocatoria' && (
        <div className="card">
          <h2>Gestión de Convocatoria</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>Plantilla ({noConvocados.length})</h3>
              {noConvocados.map(j => <div key={j.id} onClick={() => moverJugador(j, true)} style={{ cursor: 'pointer', padding: '8px', background: '#444', borderRadius: '4px', marginBottom: '5px' }}>{j.nombre} {j.apellidos}</div>)}
            </div>
            <div>
              <h3>Convocados ({convocados.length})</h3>
              {convocados.map(j => <div key={j.id} onClick={() => moverJugador(j, false)} style={{ cursor: 'pointer', padding: '8px', background: '#5cb85c', borderRadius: '4px', marginBottom: '5px' }}>{j.nombre} {j.apellidos}</div>)}
            </div>
          </div>
          {!yaEvaluado && <button onClick={guardarConvocatoria} style={{ marginTop: '20px', width: '100%' }}>Guardar Convocatoria</button>}
        </div>
      )}

      {vista === 'evaluacion' && (
        <div>
          {yaEvaluado ? (
            <div className="card">
              <h2>Estadísticas Registradas del Partido</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', fontSize: '1.5em', marginBottom: '20px' }}>
                <span>{evento.goles_favor}</span>
                <span>-</span>
                <span>{evento.goles_contra}</span>
              </div>
              <table width="100%" style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #666' }}>
                    <th style={{ padding: '10px' }}>Jugador</th>
                    <th>Téc.</th><th>Fís.</th><th>Táct.</th><th>Act.</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th><th>Faltas</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluacionesGuardadas.map(e => (
                    <tr key={e.id_jugador} style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: '10px', textAlign: 'left' }}>{e.nombre} {e.apellidos}</td>
                      <td>{e.tecnica || 0}</td><td>{e.fisico || 0}</td><td>{e.tactica || 0}</td><td>{e.actitud || 0}</td>
                      <td>{e.minutos_jugados || 0}</td><td>{e.goles || 0}</td><td>{e.asistencias || 0}</td>
                      <td>{e.tarjetas_amarillas_partido || 0}</td><td>{e.tarjetas_rojas_partido || 0}</td><td>{e.faltas_cometidas_partido || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="card">
                <h2>Estadísticas Generales del Partido</h2>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  <input type="number" name="goles_favor" value={statsPartido.goles_favor} onChange={handleStatsPartidoChange} style={{ width: '80px', padding: '10px', fontSize: '1.2em', textAlign: 'center' }} />
                  <span>-</span>
                  <input type="number" name="goles_contra" value={statsPartido.goles_contra} onChange={handleStatsPartidoChange} style={{ width: '80px', padding: '10px', fontSize: '1.2em', textAlign: 'center' }} />
                </div>
              </div>
              <div className="card">
                <h2>Parrilla de Evaluación y Estadísticas Individuales</h2>
                <table width="100%" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #666' }}>
                      <th style={{ padding: '10px' }}>Jugador</th>
                      <th>Téc.</th><th>Fís.</th><th>Táct.</th><th>Act.</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th><th>Faltas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convocados.map(jugador => (
                      <tr key={jugador.id} style={{ borderBottom: '1px solid #444' }}>
                        <td style={{ padding: '10px' }}>{jugador.nombre} {jugador.apellidos}</td>
                        {['tecnica', 'fisico', 'tactica', 'actitud'].map(c => (
                          <td key={c}><input type="number" min="0" max="10" onChange={e => handleEvalChange(jugador.id, c, e.target.value)} style={{ width: '50px' }} /></td>
                        ))}
                        {['minutos_jugados', 'goles', 'asistencias', 'tarjetas_amarillas_partido', 'tarjetas_rojas_partido', 'faltas_cometidas_partido'].map(c => (
                          <td key={c}><input type="number" min="0" onChange={e => handleEvalChange(jugador.id, c, e.target.value)} style={{ width: '50px' }} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={guardarEvaluacionesYStats} style={{ marginTop: '20px', width: '100%' }}>Guardar Evaluaciones y Estadísticas</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button onClick={eliminarEvento} style={{ background: 'transparent', color: '#c0392b', border: '1px solid #c0392b', padding: '8px 12px' }}>
          Eliminar este evento
        </button>
      </div>
    </div>
  );
}

export default DetalleEvento;
