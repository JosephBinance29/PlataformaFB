// src/pages/DetalleEvento.jsx - VERSIÓN FINAL CON CLASES CSS Y LÓGICA COMPLETA

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, where, query, increment, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function DetalleEvento() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --- NO HAY CAMBIOS EN LOS ESTADOS ---
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plantilla, setPlantilla] = useState([]);
  const [convocados, setConvocados] = useState([]);
  const [noConvocados, setNoConvocados] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [evaluacionesGuardadas, setEvaluacionesGuardadas] = useState([]);
  const [yaEvaluado, setYaEvaluado] = useState(false);
  const [vista, setVista] = useState('convocatoria');
  const [statsPartido, setStatsPartido] = useState({ goles_local: 0, goles_visitante: 0 });

  // --- NO HAY CAMBIOS EN LA LÓGICA (useEffect, funciones, etc.) ---
  useEffect(() => {
    const obtenerDatos = async () => {
      if (!currentUser?.teamId) { setLoading(false); setError("No se ha podido verificar tu equipo."); return; }
      const eventoDocRef = doc(db, 'eventos', eventoId);
      const eventoDoc = await getDoc(eventoDocRef);
      if (!eventoDoc.exists() || eventoDoc.data().teamId !== currentUser.teamId) { setError("Evento no encontrado o no tienes permiso para verlo."); setLoading(false); return; }
      const eventoData = { id: eventoDoc.id, ...eventoDoc.data() };
      setEvento(eventoData);
      if (typeof eventoData.goles_local !== 'undefined') { setStatsPartido({ goles_local: eventoData.goles_local, goles_visitante: eventoData.goles_visitante }); }
      const qPlantilla = query(collection(db, 'jugadores'), where("teamId", "==", currentUser.teamId));
      const plantillaSnapshot = await getDocs(qPlantilla);
      const listaPlantilla = plantillaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlantilla(listaPlantilla);
      const qEvaluaciones = query(collection(db, 'evaluaciones'), where('id_evento', '==', eventoId), where('teamId', '==', currentUser.teamId));
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
      const convocadosIds = eventoData.convocados || [];
      setConvocados(listaPlantilla.filter(j => convocadosIds.includes(j.id)));
      setNoConvocados(listaPlantilla.filter(j => !convocadosIds.includes(j.id)));
      setLoading(false);
    };
    obtenerDatos();
  }, [eventoId, currentUser]);

  const moverJugador = (jugador, aConvocados) => {
    if (yaEvaluado) { alert("No se puede modificar la convocatoria de un evento que ya ha sido evaluado."); return; }
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
      if (convocadoEstaVez && !yaEstabaConvocado) { await updateDoc(jugadorDocRef, { total_convocatorias: increment(1) }); }
      else if (!convocadoEstaVez && yaEstabaConvocado) { await updateDoc(jugadorDocRef, { total_convocatorias: increment(-1) }); }
    }
    alert("Convocatoria guardada.");
    window.location.reload();
  };

  const handleEvalChange = (jugadorId, campo, valor) => { setEvaluaciones(prev => ({ ...prev, [jugadorId]: { ...prev[jugadorId], [campo]: Number(valor) } })); };
  const handleStatsPartidoChange = (e) => { const { name, value } = e.target; setStatsPartido(prev => ({ ...prev, [name]: Number(value) })); };

  const guardarEvaluacionesYStats = async () => {
    if (Object.keys(evaluaciones).length === 0) { alert("No has introducido ninguna evaluación."); return; }
    let sumaDePromediosColectivos = 0;
    let jugadoresEvaluadosCount = 0;
    const batch = writeBatch(db);
    for (const jugadorId in evaluaciones) {
      const datosEvaluacion = evaluaciones[jugadorId];
      const evalDocRef = doc(collection(db, 'evaluaciones'));
      batch.set(evalDocRef, { id_jugador: jugadorId, id_evento: eventoId, fecha_evento: evento.fecha, teamId: currentUser.teamId, ...datosEvaluacion });
      const jugadorDocRef = doc(db, 'jugadores', jugadorId);
      const jugadorDoc = await getDoc(jugadorDocRef);
      const datosJugador = jugadorDoc.data();
      const updates = { total_goles: increment(datosEvaluacion.goles || 0), total_asistencias: increment(datosEvaluacion.asistencias || 0), total_minutos_jugados: increment(datosEvaluacion.minutos_jugados || 0), total_tarjetas_amarillas: increment(datosEvaluacion.tarjetas_amarillas_partido || 0), total_tarjetas_rojas: increment(datosEvaluacion.tarjetas_rojas_partido || 0), total_faltas_cometidas: increment(datosEvaluacion.faltas_cometidas_partido || 0) };
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
      if (promedioIndividualColectivo > 0) { sumaDePromediosColectivos += promedioIndividualColectivo; jugadoresEvaluadosCount++; }
    }
    const valoracionColectivaFinal = jugadoresEvaluadosCount > 0 ? sumaDePromediosColectivos / jugadoresEvaluadosCount : 0;
    let puntos = 0;
    let goles_favor_reales, goles_contra_reales;
    if (evento.condicion === 'Local') { goles_favor_reales = statsPartido.goles_local; goles_contra_reales = statsPartido.goles_visitante; }
    else { goles_favor_reales = statsPartido.goles_visitante; goles_contra_reales = statsPartido.goles_local; }
    if (goles_favor_reales > goles_contra_reales) puntos = 3;
    else if (goles_favor_reales === goles_contra_reales) puntos = 1;
    const eventoDocRef = doc(db, 'eventos', eventoId);
    batch.update(eventoDocRef, { valoracion_colectiva: valoracionColectivaFinal, goles_local: statsPartido.goles_local, goles_visitante: statsPartido.goles_visitante, goles_favor: goles_favor_reales, goles_contra: goles_contra_reales, puntos_obtenidos: puntos });
    await batch.commit();
    alert("¡Evaluaciones y estadísticas del partido guardadas!");
    window.location.reload();
  };

  const eliminarEvento = async () => {
    if (window.confirm("¿Seguro que quieres eliminar este evento y todas sus evaluaciones asociadas?")) {
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
  if (error) return <div className="card auth-error">{error}</div>;

  // --- ¡AQUÍ EMPIEZAN LOS CAMBIOS DE ESTILO! ---
  return (
    <div>
      <h1>{evento.tipo}: {evento.descripcion}</h1>
      <p>{new Date(evento.fecha).toLocaleDateString()} ({evento.condicion})</p>

      {/* CAMBIO 1: Reemplazado el div con style por uno con className */}
      <div className="botones-vista-evento">
        <button onClick={() => setVista('convocatoria')} className={vista === 'convocatoria' ? '' : 'btn-secondary'}>1. Convocatoria</button>
        <button onClick={() => setVista('evaluacion')} className={vista === 'evaluacion' ? '' : 'btn-secondary'}>2. Evaluación y Estadísticas</button>
      </div>

      {vista === 'convocatoria' && (
        <div className="card">
          <h2>Gestión de Convocatoria</h2>
          {/* CAMBIO 2: Usando clases para el grid de convocatoria */}
          <div className="convocatoria-grid">
            <div>
              <h3>Plantilla ({noConvocados.length})</h3>
              <div className="lista-jugadores-convocatoria">
                {noConvocados.map(j => <div key={j.id} onClick={() => currentUser?.rol === 'administrador' && moverJugador(j, true)} className={`item-jugador ${currentUser?.rol === 'administrador' ? 'clickable' : ''}`}>{j.nombre} {j.apellidos}</div>)}
              </div>
            </div>
            <div>
              <h3>Convocados ({convocados.length})</h3>
              <div className="lista-jugadores-convocatoria">
                {convocados.map(j => <div key={j.id} onClick={() => currentUser?.rol === 'administrador' && moverJugador(j, false)} className={`item-jugador convocado ${currentUser?.rol === 'administrador' ? 'clickable' : ''}`}>{j.nombre} {j.apellidos}</div>)}
              </div>
            </div>
          </div>
          {currentUser?.rol === 'administrador' && !yaEvaluado && <button onClick={guardarConvocatoria} className="btn-full-width" style={{marginTop: '20px'}}>Guardar Convocatoria</button>}
        </div>
      )}

      {vista === 'evaluacion' && (
        <div>
          {yaEvaluado ? (
            <div className="card">
              <h2>Estadísticas Registradas del Partido</h2>
              {/* CAMBIO 3: Usando clases para el marcador */}
              <div className="marcador-final">
                <span>{evento.goles_favor}</span>
                <span>-</span>
                <span>{evento.goles_contra}</span>
              </div>
              {/* CAMBIO 4: Envolviendo la tabla en el div responsive */}
              <div className="tabla-responsive-wrapper">
                <table>
                  <thead><tr><th>Jugador</th><th>Téc.</th><th>Fís.</th><th>Táct.</th><th>Act.</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th><th>Faltas</th></tr></thead>
                  <tbody>{evaluacionesGuardadas.map(e => (<tr key={e.id_jugador}><td>{e.nombre} {e.apellidos}</td><td>{e.tecnica || 0}</td><td>{e.fisico || 0}</td><td>{e.tactica || 0}</td><td>{e.actitud || 0}</td><td>{e.minutos_jugados || 0}</td><td>{e.goles || 0}</td><td>{e.asistencias || 0}</td><td>{e.tarjetas_amarillas_partido || 0}</td><td>{e.tarjetas_rojas_partido || 0}</td><td>{e.faltas_cometidas_partido || 0}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="card">
                <h2>Resultado del Partido</h2>
                {/* CAMBIO 5: Usando clases para el formulario del resultado */}
                <div className="form-resultado-partido">
                  <div className="input-group">
                    <label>{evento.condicion === 'Local' ? 'Tu Equipo (Local)' : 'Equipo Local'}</label>
                    <input type="number" name="goles_local" value={statsPartido.goles_local} onChange={handleStatsPartidoChange} disabled={currentUser?.rol !== 'administrador'} />
                  </div>
                  <span>-</span>
                  <div className="input-group">
                    <label>{evento.condicion === 'Visitante' ? 'Tu Equipo (Visitante)' : 'Equipo Visitante'}</label>
                    <input type="number" name="goles_visitante" value={statsPartido.goles_visitante} onChange={handleStatsPartidoChange} disabled={currentUser?.rol !== 'administrador'} />
                  </div>
                </div>
              </div>
              <div className="card">
                <h2>Parrilla de Evaluación y Estadísticas Individuales</h2>
                <div className="tabla-responsive-wrapper">
                  <table>
                    <thead><tr><th>Jugador</th><th>Téc.</th><th>Fís.</th><th>Táct.</th><th>Act.</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th><th>Faltas</th></tr></thead>
                    <tbody>
                      {convocados.map(jugador => (
                        <tr key={jugador.id}>
                          <td>{jugador.nombre} {jugador.apellidos}</td>
                          {['tecnica', 'fisico', 'tactica', 'actitud'].map(c => (<td key={c}><input type="number" min="0" max="10" onChange={e => handleEvalChange(jugador.id, c, e.target.value)} disabled={currentUser?.rol !== 'administrador'} /></td>))}
                          {['minutos_jugados', 'goles', 'asistencias', 'tarjetas_amarillas_partido', 'tarjetas_rojas_partido', 'faltas_cometidas_partido'].map(c => (<td key={c}><input type="number" min="0" onChange={e => handleEvalChange(jugador.id, c, e.target.value)} disabled={currentUser?.rol !== 'administrador'} /></td>))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {currentUser?.rol === 'administrador' && <button onClick={guardarEvaluacionesYStats} className="btn-full-width" style={{marginTop: '20px'}}>Guardar Evaluaciones y Estadísticas</button>}
              </div>
            </div>
          )}
        </div>
      )}
      {currentUser?.rol === 'administrador' && (
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button onClick={eliminarEvento} className="btn-danger-outline">Eliminar este evento</button>
        </div>
      )}
    </div>
  );
}

export default DetalleEvento;
