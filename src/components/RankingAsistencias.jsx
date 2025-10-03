// src/components/RankingAsistencias.jsx

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function RankingAsistencias({ jugadores }) {
  const jugadoresOrdenados = [...jugadores].sort((a, b) => b.total_asistencias - a.total_asistencias);

  const data = {
    labels: jugadoresOrdenados.map(j => `${j.nombre} ${j.apellidos}`),
    datasets: [
      {
        label: 'Asistencias Totales',
        data: jugadoresOrdenados.map(j => j.total_asistencias),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    // ¡NUEVO!
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Ranking de Asistencias de la Plantilla',
        font: { size: 18 },
        color: '#FFFFFF'
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#FFFFFF' } },
      x: { ticks: { color: '#FFFFFF' } }
    }
  };

  // Envolvemos el gráfico en un div con una altura fija
  return (
    <div style={{ height: '400px' }}> {/* <-- MISMA ALTURA PARA CONSISTENCIA */}
      <Bar options={options} data={data} />
    </div>
  );
}

export default RankingAsistencias;
