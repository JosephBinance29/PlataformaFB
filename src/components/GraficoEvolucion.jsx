// src/components/GraficoEvolucion.jsx

import { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2'; // <-- Cambiamos a Radar
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'; // <-- Añadimos RadialLinearScale y Filler

// Registramos los nuevos componentes
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function GraficoEvolucion({ jugadores }) {
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState('');
  const [datosGrafico, setDatosGrafico] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jugadores.length > 0 && !jugadorSeleccionado) {
      setJugadorSeleccionado(jugadores[0].id);
    }
  }, [jugadores, jugadorSeleccionado]);

  useEffect(() => {
    const cargarDatosEvolucion = async () => {
      if (!jugadorSeleccionado) return;
      setLoading(true);
      
      const q = query(
        collection(db, "evaluaciones"),
        where("id_jugador", "==", jugadorSeleccionado),
        orderBy("fecha_evento", "desc") // Ordenamos del más nuevo al más viejo
      );

      const querySnapshot = await getDocs(q);
      const evaluacionesJugador = querySnapshot.docs.map(doc => doc.data());

      if (evaluacionesJugador.length > 0) {
        // Tomamos la evaluación más reciente para el gráfico radar
        const ultimaEvaluacion = evaluacionesJugador[0];
        setDatosGrafico({
          labels: ['Técnica', 'Físico', 'Táctica', 'Actitud'], // Los 4 atributos
          datasets: [{
            label: `Valoración más reciente (${ultimaEvaluacion.fecha_evento})`,
            data: [
              ultimaEvaluacion.tecnica || 0,
              ultimaEvaluacion.fisico || 0,
              ultimaEvaluacion.tactica || 0,
              ultimaEvaluacion.actitud || 0,
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
          }]
        });
      } else {
        // Si no hay datos, mostramos un gráfico vacío
        setDatosGrafico({ labels: ['Técnica', 'Físico', 'Táctica', 'Actitud'], datasets: [] });
      }
      setLoading(false);
    };
    cargarDatosEvolucion();
  }, [jugadorSeleccionado]);

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Perfil de Habilidades (Última Evaluación)', font: { size: 18 }, color: '#FFFFFF' },
    },
    scales: {
      r: { // 'r' es para la escala radial
        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' },
        pointLabels: { font: { size: 14 }, color: '#FFFFFF' },
        ticks: {
          color: '#FFFFFF',
          backdropColor: 'transparent',
          stepSize: 2
        },
        min: 0,
        max: 10,
      }
    }
  };

  return (
    <div>
      <h3>Selecciona un jugador para ver su perfil:</h3>
      <select value={jugadorSeleccionado} onChange={(e) => setJugadorSeleccionado(e.target.value)} style={{ padding: '8px', marginBottom: '20px', background: '#555', color: 'white' }}>
        {jugadores.map(j => (
          <option key={j.id} value={j.id}>{j.nombre} {j.apellidos}</option>
        ))}
      </select>
      {loading ? <p>Cargando gráfico...</p> : <Radar options={options} data={datosGrafico} />}
    </div>
  );
}

export default GraficoEvolucion;
