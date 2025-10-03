// src/components/PlayerList.jsx

function PlayerList({ jugadores, activarEdicion, borrarJugador }) {
  return (
    <div>
      <h1>Mi Plantilla de Jugadores</h1>
      <hr style={{ borderColor: '#444' }} />
      
      {jugadores.map(jugador => (
        <div key={jugador.id} style={{ border: '1px solid #444', background: '#333742', borderRadius: '8px', padding: '20px', margin: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{jugador.dorsal || '-'}. {jugador.nombre} {jugador.apellidos}</h2>
            <p><strong>Posición:</strong> {jugador.posicion}</p>
            
            {/* Contenedor para las estadísticas */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', color: '#ccc' }}>
              <span><strong>Goles:</strong> {jugador.total_goles || 0}</span>
              <span><strong>Asistencias:</strong> {jugador.total_asistencias || 0}</span>
              <span><strong>Minutos Jugados:</strong> {jugador.total_minutos_jugados || 0}</span>
              <span><strong>Convocatorias:</strong> {jugador.total_convocatorias || 0}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => activarEdicion(jugador)} style={{ padding: '8px 15px', cursor: 'pointer', background: '#f0ad4e', color: 'white', border: 'none', borderRadius: '5px' }}>
              Editar
            </button>
            <button onClick={() => borrarJugador(jugador.id)} style={{ padding: '8px 15px', cursor: 'pointer', background: '#d9534f', color: 'white', border: 'none', borderRadius: '5px' }}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlayerList;
