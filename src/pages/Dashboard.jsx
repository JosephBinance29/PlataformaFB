// src/pages/Dashboard.jsx - VERSIÓN FINAL COMPLETA (CON GESTION EQUIPO IMPORTADO)

import { useState, useEffect } from 'react';
import { db } from '../firebase';
// ¡IMPORTACIÓN LIMPIA! Solo lo que se usa en los componentes de este archivo
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../context/AuthContext';
// ¡¡¡IMPORTAMOS EL NUEVO COMPONENTE DESDE SU PROPIO ARCHIVO!!!


ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend);

const initialChartData = {
  labels: [],
  datasets: [{ label: 'Cargando...', data: [], backgroundColor: 'rgba(97, 218, 251, 0.6)' }]
};

function TablaTemporada() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ pj: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.teamId) return;
    const calcularEstadisticas = async () => {
      const q = query(collection(db, 'eventos'), where('teamId', '==', currentUser.teamId), where('tipo', '==', 'Partido'), where('puntos_obtenidos', 'in', [0, 1, 3]));
      const querySnapshot = await getDocs(q);
      let pj = 0, v = 0, e = 0, d = 0, gf = 0, gc = 0, pts = 0;
      querySnapshot.forEach(doc => {
        const partido = doc.data();
        pj++;
        gf += partido.goles_favor || 0;
        gc += partido.goles_contra || 0;
        pts += partido.puntos_obtenidos || 0;
        if (partido.puntos_obtenidos === 3) v++;
        else if (partido.puntos_obtenidos === 1) e++;
        else d++;
      });
      setStats({ pj, v, e, d, gf, gc, dg: gf - gc, pts });
      setLoading(false);
    };
    calcularEstadisticas();
  }, [currentUser]);

  if (loading) return <div className="card">Cargando estadísticas...</div>;
  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <h2>Rendimiento de la Temporada</h2>
      <table width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid #666' }}><th style={{ padding: '10px' }}>PJ</th><th>V</th><th>E</th><th>D</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead>
        <tbody><tr><td style={{ padding: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>{stats.pj}</td><td style={{ fontSize: '1.2em' }}>{stats.v}</td><td style={{ fontSize: '1.2em' }}>{stats.e}</td><td style={{ fontSize: '1.2em' }}>{stats.d}</td><td style={{ fontSize: '1.2em' }}>{stats.gf}</td><td style={{ fontSize: '1.2em' }}>{stats.gc}</td><td style={{ fontSize: '1.2em' }}>{stats.dg}</td><td style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{stats.pts}</td></tr></tbody>
      </table>
    </div>
  );
}

function RankingGoles() {
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(initialChartData);
  const [loading, setLoading] = useState(true);
  const chartOptions = {
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    datasets: { bar: { maxBarThickness: 50 } }
  };

  useEffect(() => {
    if (!currentUser?.teamId) return;
    const fetchJugadores = async () => {
      const q = query(collection(db, 'jugadores'), where('teamId', '==', currentUser.teamId), where('total_goles', '>', 0), orderBy('total_goles', 'desc'));
      const data = await getDocs(q);
      const jugadores = data.docs.map(doc => doc.data());
      if (jugadores.length > 0) {
        setChartData({ labels: jugadores.map(j => j.nombre), datasets: [{ label: 'Goles Totales', data: jugadores.map(j => j.total_goles), backgroundColor: 'rgba(97, 218, 251, 0.6)' }] });
      } else {
        setChartData({ ...initialChartData, labels: [], datasets: [{ ...initialChartData.datasets[0], label: 'Sin goleadores', data: [] }] });
      }
      setLoading(false);
    };
    fetchJugadores();
  }, [currentUser]);

  if (loading) return <div>Cargando...</div>;
  if (chartData.labels.length === 0) return <p>Aún no hay jugadores con goles registrados.</p>;
  return <Bar data={chartData} options={chartOptions} />;
}

function RankingAsistencias() {
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(initialChartData);
  const [loading, setLoading] = useState(true);
  const chartOptions = {
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    datasets: { bar: { maxBarThickness: 50 } }
  };

  useEffect(() => {
    if (!currentUser?.teamId) return;
    const fetchJugadores = async () => {
      const q = query(collection(db, 'jugadores'), where('teamId', '==', currentUser.teamId), where('total_asistencias', '>', 0), orderBy('total_asistencias', 'desc'));
      const data = await getDocs(q);
      const jugadores = data.docs.map(doc => doc.data());
      if (jugadores.length > 0) {
        setChartData({ labels: jugadores.map(j => j.nombre), datasets: [{ label: 'Asistencias Totales', data: jugadores.map(j => j.total_asistencias), backgroundColor: 'rgba(76, 175, 80, 0.6)' }] });
      } else {
        setChartData({ ...initialChartData, labels: [], datasets: [{ ...initialChartData.datasets[0], label: 'Sin asistidores', data: [] }] });
      }
      setLoading(false);
    };
    fetchJugadores();
  }, [currentUser]);

  if (loading) return <div>Cargando...</div>;
  if (chartData.labels.length === 0) return <p>Aún no hay jugadores con asistencias registradas.</p>;
  return <Bar data={chartData} options={chartOptions} />;
}

function PerfilJugador() {
  const { currentUser } = useAuth();
  const [jugadores, setJugadores] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState('');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!currentUser?.teamId) return;
    const fetchJugadores = async () => {
      const q = query(collection(db, 'jugadores'), where('teamId', '==', currentUser.teamId));
      const data = await getDocs(q);
      setJugadores(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchJugadores();
  }, [currentUser]);

  useEffect(() => {
    if (jugadorSeleccionado && currentUser?.teamId) {
      const fetchEvaluacion = async () => {
        const q = query(collection(db, 'evaluaciones'), where('id_jugador', '==', jugadorSeleccionado), where('teamId', '==', currentUser.teamId), orderBy('fecha_evento', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const ultimaEval = querySnapshot.docs[0].data();
          setChartData({
            labels: ['Técnica', 'Físico', 'Táctica', 'Actitud'],
            datasets: [{
              label: `Valoración más reciente (${new Date(ultimaEval.fecha_evento).toLocaleDateString()})`,
              data: [ultimaEval.tecnica || 0, ultimaEval.fisico || 0, ultimaEval.tactica || 0, ultimaEval.actitud || 0],
              backgroundColor: 'rgba(97, 218, 251, 0.2)',
              borderColor: 'rgba(97, 218, 251, 1)',
              borderWidth: 1,
            }]
          });
        } else {
          setChartData(null);
        }
      };
      fetchEvaluacion();
    } else {
      setChartData(null);
    }
  }, [jugadorSeleccionado, currentUser]);

  return (
    <div>
      <select value={jugadorSeleccionado} onChange={e => setJugadorSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
        <option value="">Selecciona un jugador...</option>
        {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre} {j.apellidos}</option>)}
      </select>
      {chartData ? <Radar data={chartData} /> : <p>Selecciona un jugador para ver su perfil o evalúalo en un evento.</p>}
    </div>
  );
}

function EvolucionColectiva() {
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!currentUser?.teamId) return;
    const fetchEvolucion = async () => {
      const q = query(collection(db, 'eventos'), where('teamId', '==', currentUser.teamId), where('valoracion_colectiva', '>', 0), orderBy('fecha', 'asc'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 1) {
        const eventos = querySnapshot.docs.map(doc => doc.data());
        setChartData({
          labels: eventos.map(e => new Date(e.fecha).toLocaleDateString()),
          datasets: [{
            label: 'Valoración Colectiva',
            data: eventos.map(e => e.valoracion_colectiva),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        });
      } else {
        setChartData(null);
      }
    };
    fetchEvolucion();
  }, [currentUser]);

  if (!chartData) return <p>No hay suficientes datos. Evalúa al menos dos eventos para ver la evolución.</p>;
  return <Line data={chartData} />;
}

function Dashboard() {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>Dashboard de Rendimiento</h1>
      
      <TablaTemporada />
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="card"><h2>Ranking de Goleadores</h2><div style={{ height: '300px' }}><RankingGoles /></div></div>
        <div className="card"><h2>Ranking de Asistencias</h2><div style={{ height: '300px' }}><RankingAsistencias /></div></div>
        <div className="card"><h2>Perfil de Jugador</h2><PerfilJugador /></div>
        <div className="card"><h2>Evolución del Rendimiento Colectivo</h2><EvolucionColectiva /></div>
      </div>
    </div>
  );
}

export default Dashboard;
