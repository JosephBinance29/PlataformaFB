// src/components/RankingMinutos.jsx
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function RankingMinutos({ jugadores }) {
  const jugadoresOrdenados = [...jugadores].sort((a, b) => b.total_minutos_jugados - a.total_minutos_jugados);

  const data = {
    labels: jugadoresOrdenados.map(j => `${j.nombre} ${j.apellidos}`),
    datasets: [{
      label: 'Minutos Totales Jugados',
      data: jugadoresOrdenados.map(j => j.total_minutos_jugados),
      backgroundColor: 'rgba(255, 99, 132, 0.6)', // Color rojo
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      title: { display: true, text: 'Ranking de Minutos Jugados', font: { size: 18 }, color: '#FFFFFF' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#FFFFFF' } },
      x: { ticks: { color: '#FFFFFF' } }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar options={options} data={data} />
    </div>
  );
}

export default RankingMinutos;
