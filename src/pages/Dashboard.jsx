// src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, RadialLinearScale, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, RadialLinearScale, Filler);

function Dashboard() {
  const [jugadores, setJugadores] = useState([]);
  const [eventosColectivos, setEventosColectivos] = useState([]); // Renombrado para claridad
  const [loading, setLoading] = useState(true);

  const [jugadorSeleccionadoId, setJugadorSeleccionadoId] = useState('');
  const [evaluacionesJugador, setEvaluacionesJugador] = useState([]);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  useEffect(() => {
    const obtenerDatosGenerales = async () => {
      setLoading(true);
      try {
        // Obtener jugadores (sin cambios)
        const jugadoresSnapshot = await getDocs(collection(db, 'jugadores'));
        const listaJugadores = jugadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJugadores(listaJugadores);
        if (listaJugadores.length > 0) {
          setJugadorSeleccionadoId(listaJugadores[0].id);
        }

        // --- ¡NUEVA LÓGICA A PRUEBA DE FALLOS! ---
        // 1. Traemos TODOS los eventos
        const eventosSnapshot = await getDocs(collection(db, "eventos"));
        const todosLosEventos = eventosSnapshot.docs.map(doc => doc.data());

        // 2. Filtramos y ordenamos en JavaScript
        const eventosConValoracion = todosLosEventos
          .filter(evento => evento.valoracion_colectiva != null && evento.valoracion_colectiva > 0)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Ordenamos por fecha

        setEventosColectivos(eventosConValoracion);
        // -----------------------------------------

      } catch (error) {
        console.error("Error obteniendo datos para el dashboard:", error);
      }
      setLoading(false);
    };
    obtenerDatosGenerales();
  }, []);

  useEffect(() => {
    if (!jugadorSeleccionadoId) return;
    const obtenerEvaluaciones = async () => {
      setLoadingPerfil(true);
      const q = query(collection(db, "evaluaciones"), where("id_jugador", "==", jugadorSeleccionadoId), orderBy("fecha_evento", "desc"));
      const querySnapshot = await getDocs(q);
      setEvaluacionesJugador(querySnapshot.docs.map(doc => doc.data()));
      setLoadingPerfil(false);
    };
    obtenerEvaluaciones();
  }, [jugadorSeleccionadoId]);

  // --- Preparación de datos (sin cambios, pero ahora usamos 'eventosColectivos') ---
  const rankingGolesData = !loading && jugadores.length > 0 ? {
    labels: [...jugadores].sort((a, b) => b.total_goles - a.total_goles).map(j => `${j.nombre} ${j.apellidos}`),
    datasets: [{ label: 'Goles Totales', data: [...jugadores].sort((a, b) => b.total_goles - a.total_goles).map(j => j.total_goles), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
  } : { labels: [], datasets: [] };

  const rankingAsistenciasData = !loading && jugadores.length > 0 ? {
    labels: [...jugadores].sort((a, b) => b.total_asistencias - a.total_asistencias).map(j => `${j.nombre} ${j.apellidos}`),
    datasets: [{ label: 'Asistencias Totales', data: [...jugadores].sort((a, b) => b.total_asistencias - a.total_asistencias).map(j => j.total_asistencias), backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
  } : { labels: [], datasets: [] };

  const evolucionColectivaData = !loading && eventosColectivos.length > 0 ? {
    labels: eventosColectivos.map(e => `${e.fecha} (${e.descripcion.substring(0, 10)}...)`),
    datasets: [{ label: 'Valoración Colectiva', data: eventosColectivos.map(e => e.valoracion_colectiva), fill: true, backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1 }]
  } : { labels: [], datasets: [] };

  const ultimaEvaluacion = evaluacionesJugador.length > 0 ? evaluacionesJugador[0] : null;
  const perfilJugadorData = {
    labels: ['Técnica', 'Físico', 'Táctica', 'Actitud'],
    datasets: [{
      label: `Valoración más reciente (${ultimaEvaluacion?.fecha_evento || 'N/A'})`,
      data: ultimaEvaluacion ? [ultimaEvaluacion.tecnica, ultimaEvaluacion.fisico, ultimaEvaluacion.tactica, ultimaEvaluacion.actitud] : [0, 0, 0, 0],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' }, beginAtZero: true } } };
  const chartOptionsLine = { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 10 } } };
  const chartOptionsRadar = { ...chartOptions, scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.2)' }, grid: { color: 'rgba(255, 255, 255, 0.2)' }, pointLabels: { color: 'white', font: { size: 14 } }, suggestedMin: 0, suggestedMax: 10, ticks: { display: false } } } };

  if (loading) return <h1>Cargando datos del Dashboard...</h1>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>Dashboard de Rendimiento</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', height: '400px' }}>
          <h3 style={{ marginTop: 0 }}>Ranking de Goleadores</h3>
          <Bar data={rankingGolesData} options={chartOptions} />
        </div>
        <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', height: '400px' }}>
          <h3 style={{ marginTop: 0 }}>Ranking de Asistencias</h3>
          <Bar data={rankingAsistenciasData} options={chartOptions} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', height: '450px' }}>
          <h3 style={{ marginTop: 0 }}>Perfil de Jugador</h3>
          <select value={jugadorSeleccionadoId} onChange={(e) => setJugadorSeleccionadoId(e.target.value)} style={{ marginBottom: '20px', width: '100%', padding: '10px' }}>
            {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre} {j.apellidos}</option>)}
          </select>
          {loadingPerfil ? <p>Cargando perfil...</p> : <Radar data={perfilJugadorData} options={chartOptionsRadar} />}
        </div>

        <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', height: '450px' }}>
          <h3 style={{ marginTop: 0 }}>Evolución del Rendimiento Colectivo</h3>
          {eventosColectivos.length > 0 ? (
            <Line data={evolucionColectivaData} options={chartOptionsLine} />
          ) : (
            <p>No hay datos de valoración colectiva para mostrar el gráfico.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
