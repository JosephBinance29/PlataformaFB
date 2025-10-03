// src/pages/DetalleEvento.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, where, query, increment } from 'firebase/firestore';

function DetalleEvento() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [plantilla, setPlantilla] = useState([]);
  const [convocados, setConvocados] = useState([]);
  const [noConvocados, setNoConvocados] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [evaluacionesGuardadas, setEvaluacionesGuardadas] = useState([]);
  const [yaEvaluado, setYaEvaluado] = useState(false);
  const [vista, setVista] = useState('convocatoria'); // 'convocatoria' o 'evaluacion'

  // ¡NUEVO ESTADO PARA ESTADÍSTICAS DEL PARTIDO!
  const [statsPartido, setStatsPartido] = useState({ goles_favor: 0, goles_contra: 0 });

  useEffect(() => {
    const obtenerDatos = async () => {
      // Obtener evento
      const eventoDoc = await getDoc(doc(db, 'eventos', eventoId));
      if (eventoDoc.exists()) {
        const eventoData = eventoDoc.data();
        setEvento({ id: eventoDoc.id, ...eventoData });
        // ¡NUEVO! Cargar estadísticas si ya existen
        if (eventoData.goles_favor !== undefined) {
          setStatsPartido({ goles_favor: eventoData.goles_favor, goles_contra: eventoData.goles_contra });
        }
      }

      // Obtener plantilla
      const plantillaSnapshot = await getDocs(collection(db, 'jugadores'));
      const listaPlantilla = plantillaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlantilla(listaPlantilla);

      // Comprobar si el evento ya fue evaluado
      const q = query(collection(db, 'evaluaciones'), where('id_evento', '==', eventoId));
      const evaluacionesSnapshot = await getDocs(q);
      if (!evaluacionesSnapshot.empty) {
        setYaEvaluado(true);
        setVista('evaluacion'); // Si ya está evaluado, mostrar directamente las estadísticas
        const datosGuardados = await Promise.all(evaluacionesSnapshot.docs.map(async (docEval) => {
          const datos = docEval.data();
          const jugadorDoc = listaPlantilla.find(j => j.id === datos.id_jugador);
          return { ...datos, nombre: jugadorDoc?.nombre || 'Jugador no encontrado' };
        }));
        setEvaluacionesGuardadas(datosGuardados);
      }

      // Inicializar convocados/no convocados
      const convocadosIds = eventoData.convocados || [];
      setConvocados(listaPlantilla.filter(j => convocadosIds.includes(j.id)));
      setNoConvocados(listaPlantilla.filter(j => !convocadosIds.includes(j.id)));
    };
    obtenerDatos();
  }, [eventoId]);

  // --- Lógica de Convocatoria (sin cambios) ---
  const moverJugador = (jugador, aConvocados) => {
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

    // Actualizar contador de convocatorias de cada jugador
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

  // ¡NUEVO! Manejador para las estadísticas del partido
  const handleStatsPartidoChange = (e) => {
    const { name, value } = e.target;
    setStatsPartido(prev => ({ ...prev, [name]: Number(value) }));
  };

  // --- ¡FUNCIÓN DE GUARDADO DEFINITIVA! ---
  const guardarEvaluacionesYStats = async () => {
    if (Object.keys(evaluaciones).length === 0) { alert("No has introducido ninguna evaluación."); return; }

    let sumaDePromediosColectivos = 0;
    let jugadoresEvaluadosCount = 0;

    for (const jugadorId in evaluaciones) {
      const datosEvaluacion = evaluaciones[jugadorId];
      
      await addDoc(collection(db, 'evaluaciones'), { id_jugador: jugadorId, id_evento: eventoId, fecha_evento: evento.fecha, ...datosEvaluacion });

      const jugadorDocRef = doc(db, 'jugadores', jugadorId);
      const jugadorDoc = await getDoc(jugadorDocRef);
      const datosJugador = jugadorDoc.data();

      const updates = {
        total_goles: increment(datosEvaluacion.goles || 0),
        total_asistencias: increment(datosEvaluacion.asistencias || 0),
        total_minutos_jugados: increment(datosEvaluacion.minutos_jugados || 0),
        // ¡NUEVO! Actualizar tarjetas y faltas
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
      
      await updateDoc(jugadorDocRef, updates);

      const promedioIndividualColectivo = ((datosEvaluacion.tecnica || 0) + (datosEvaluacion.fisico || 0) + (datosEvaluacion.tactica || 0) + (datosEvaluacion.actitud || 0)) / 4;
      if (promedioIndividualColectivo > 0) {
        sumaDePromediosColectivos += promedioIndividualColectivo;
        jugadoresEvaluadosCount++;
      }
    }

    // ¡NUEVO! Guardar estadísticas del partido y puntos
    const valoracionColectivaFinal = jugadoresEvaluadosCount > 0 ? sumaDePromediosColectivos / jugadoresEvaluadosCount : 0;
    let puntos = 0;
    if (statsPartido.goles_favor > statsPartido.goles_contra) puntos = 3;
    else if (statsPartido.goles_favor === statsPartido.goles_contra) puntos = 1;

    const eventoDocRef = doc(db, 'eventos', eventoId);
    await updateDoc(eventoDocRef, { 
      valoracion_colectiva: valoracionColectivaFinal,
      goles_favor: statsPartido.goles_favor,
      goles_contra: statsPartido.goles_contra,
      puntos_obtenidos: puntos
    });

    alert("¡Evaluaciones y estadísticas del partido guardadas!");
    window.location.reload();
  };

  const eliminarEvento = async () => {
    if (window.confirm("¿Seguro que quieres eliminar este evento y todas sus evaluaciones asociadas? Esta acción no se puede deshacer.")) {
      // Eliminar evaluaciones asociadas
      const q = query(collection(db, 'evaluaciones'), where('id_evento', '==', eventoId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      // Eliminar evento
      await deleteDoc(doc(db, 'eventos', eventoId));
      navigate('/eventos');
    }
  };

  if (!evento) return <div>Cargando evento...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>{evento.tipo}: {evento.descripcion}</h1>
      <p>{new Date(evento.fecha).toLocaleDateString()} ({evento.condicion})</p>

      {/* Pestañas de navegación */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', marginBottom: '20px' }}>
        <button onClick={() => setVista('convocatoria')} style={{ background: vista === 'convocatoria' ? '#61dafb' : '#555' }}>1. Convocatoria</button>
        <button onClick={() => setVista('evaluacion')} style={{ background: vista === 'evaluacion' ? '#61dafb' : '#555' }}>2. Evaluación y Estadísticas</button>
      </div>

      {/* --- VISTA DE CONVOCATORIA --- */}
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
          <button onClick={guardarConvocatoria} style={{ marginTop: '20px', width: '100%' }}>Guardar Convocatoria</button>
        </div>
      )}

      {/* --- VISTA DE EVALUACIÓN Y ESTADÍSTICAS --- */}
      {vista === 'evaluacion' && (
        <div>
          {yaEvaluado ? (
            // --- VISTA DE DATOS GUARDADOS ---
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
                      <td style={{ padding: '10px', textAlign: 'left' }}>{e.nombre}</td>
                      <td>{e.tecnica || 0}</td><td>{e.fisico || 0}</td><td>{e.tactica || 0}</td><td>{e.actitud || 0}</td>
                      <td>{e.minutos_jugados || 0}</td><td>{e.goles || 0}</td><td>{e.asistencias || 0}</td>
                      <td>{e.tarjetas_amarillas_partido || 0}</td><td>{e.tarjetas_rojas_partido || 0}</td><td>{e.faltas_cometidas_partido || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // --- VISTA DE FORMULARIO PARA EVALUAR ---
            <div>
              {/* ¡NUEVO! Formulario de Estadísticas del Partido */}
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

      {/* Botón de eliminar (discreto) */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button onClick={eliminarEvento} style={{ background: 'transparent', color: '#c0392b', border: '1px solid #c0392b', padding: '8px 12px' }}>
          Eliminar este evento
        </button>
      </div>
    </div>
  );
}

export default DetalleEvento;
