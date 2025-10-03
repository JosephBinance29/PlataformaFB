// src/components/RankingPromedio.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function RankingPromedio({ jugadores }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularRanking = async () => {
      // 1. Traemos todas las evaluaciones de la base de datos
      const evaluacionesSnapshot = await getDocs(collection(db, 'evaluaciones'));
      const todasLasEvaluaciones = evaluacionesSnapshot.docs.map(doc => doc.data());

      // 2. Agrupamos las evaluaciones por cada jugador
      const evaluacionesPorJugador = {};
      for (const evaluacion of todasLasEvaluaciones) {
        const jugadorId = evaluacion.id_jugador;
        if (!evaluacionesPorJugador[jugadorId]) {
          evaluacionesPorJugador[jugadorId] = [];
        }
        evaluacionesPorJugador[jugadorId].push(evaluacion);
      }

      // 3. Calculamos los promedios para cada jugador
      const datosRanking = jugadores.map(jugador => {
        const evaluacionesJugador = evaluacionesPorJugador[jugador.id] || [];
        let promedioGeneral = 0;

        if (evaluacionesJugador.length > 0) {
          const sumaTecnica = evaluacionesJugador.reduce((acc, e) => acc + (e.tecnica || 0), 0);
          const sumaFisico = evaluacionesJugador.reduce((acc, e) => acc + (e.fisico || 0), 0);
          const sumaTactica = evaluacionesJugador.reduce((acc, e) => acc + (e.tactica || 0), 0);
          const sumaActitud = evaluacionesJugador.reduce((acc, e) => acc + (e.actitud || 0), 0);
          
          const promTecnica = sumaTecnica / evaluacionesJugador.length;
          const promFisico = sumaFisico / evaluacionesJugador.length;
          const promTactica = sumaTactica / evaluacionesJugador.length;
          const promActitud = sumaActitud / evaluacionesJugador.length;

          // El promedio general es la media de los 4 promedios
          promedioGeneral = (promTecnica + promFisico + promTactica + promActitud) / 4;
        }

        return {
          nombre: `${jugador.nombre} ${jugador.apellidos}`,
          promedio: promedioGeneral
        };
      });

      // 4. Ordenamos el ranking de mayor a menor promedio
      datosRanking.sort((a, b) => b.promedio - a.promedio);

      setRanking(datosRanking);
      setLoading(false);
    };

    if (jugadores.length > 0) {
      calcularRanking();
    }
  }, [jugadores]);

  if (loading) {
    return <p>Calculando ranking de valoraciones...</p>;
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>Ranking de Valoración Promedio</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', borderBottom: '2px solid #555', textAlign: 'left' }}>#</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #555', textAlign: 'left' }}>Jugador</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #555', textAlign: 'right' }}>Promedio (1-10)</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '12px 10px', borderBottom: '1px solid #444' }}>{index + 1}</td>
              <td style={{ padding: '12px 10px', borderBottom: '1px solid #444' }}>{item.nombre}</td>
              <td style={{ padding: '12px 10px', borderBottom: '1px solid #444', textAlign: 'right', fontWeight: 'bold', color: '#4CAF50' }}>
                {item.promedio.toFixed(2)} {/* Mostramos con 2 decimales */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RankingPromedio;
