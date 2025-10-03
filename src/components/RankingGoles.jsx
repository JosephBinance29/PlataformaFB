// src/components/RankingGoles.jsx

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function RankingGoles({ jugadores }) {
  const jugadoresOrdenados = [...jugadores].sort((a, b) => b.total_goles - a.total_goles);

  const data = {
    labels: jugadoresOrdenados.map(j => `${j.nombre} ${j.apellidos}`),
    datasets: [
      {
        label: 'Goles Totales',
        data: jugadoresOrdenados.map(j => j.total_goles),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    // ¡NUEVO! Esta opción es clave para que el gráfico se adapte al contenedor
    maintainAspectRatio: false, 
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Ranking de Goleadores de la Plantilla',
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
    <div style={{ height: '400px' }}> {/* <-- PUEDES AJUSTAR ESTE VALOR */}
      <Bar options={options} data={data} />
    </div>
  );
}

export default RankingGoles;
