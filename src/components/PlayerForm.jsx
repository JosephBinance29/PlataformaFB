// src/components/PlayerForm.jsx

// Añadimos los nuevos campos que recibiremos desde App.jsx
function PlayerForm({
  manejarSubmit,
  nombre, setNombre,
  apellidos, setApellidos,
  posicion, setPosicion,
  dorsal, setDorsal,
  goles, setGoles,
  asistencias, setAsistencias,
  editando
}) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
      <h2>{editando ? 'Editando Jugador' : 'Añadir Nuevo Jugador'}</h2>
      <form onSubmit={manejarSubmit}>
        {/* Fila 1: Datos personales */}
        <div style={{ marginBottom: '15px' }}>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ marginRight: '10px', padding: '8px' }} />
          <input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required style={{ marginRight: '10px', padding: '8px' }} />
          <input placeholder="Posición" value={posicion} onChange={(e) => setPosicion(e.target.value)} required style={{ marginRight: '10px', padding: '8px' }} />
        </div>
        {/* Fila 2: Datos numéricos */}
        <div>
          <input type="number" placeholder="Dorsal" value={dorsal} onChange={(e) => setDorsal(e.target.value)} required style={{ marginRight: '10px', padding: '8px', width: '80px' }} />
          {/* Solo mostramos los campos de goles y asistencias si estamos editando */}
          {editando && (
            <>
              <input type="number" placeholder="Goles" value={goles} onChange={(e) => setGoles(e.target.value)} required style={{ marginRight: '10px', padding: '8px', width: '80px' }} />
              <input type="number" placeholder="Asistencias" value={asistencias} onChange={(e) => setAsistencias(e.target.value)} required style={{ marginRight: '10px', padding: '8px', width: '80px' }} />
            </>
          )}
        </div>
        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: editando ? '#4CAF50' : '#008CBA', color: 'white', border: 'none', marginTop: '15px' }}>
          {editando ? 'Guardar Cambios' : 'Añadir Jugador'}
        </button>
      </form>
    </div>
  );
}

export default PlayerForm;
