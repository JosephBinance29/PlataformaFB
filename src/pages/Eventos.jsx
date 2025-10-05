// Ruta: src/pages/Eventos.jsx
// ¡¡ÚSALO SOLO DESPUÉS DE ACTUALIZAR TUS EVENTOS ANTIGUOS EN FIREBASE!!

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [nuevoEvento, setNuevoEvento] = useState({ tipo: 'Partido', descripcion: '', fecha: '', condicion: 'Local' });
  const { currentUser } = useAuth();

  // En src/pages/Eventos.jsx

  useEffect(() => {
    // Si no hay un usuario con teamId, no podemos hacer una consulta.
    // Devolvemos una función vacía para que React no se queje.
    if (!currentUser?.teamId) {
      // Si el usuario se desloguea, nos aseguramos de limpiar la lista de eventos.
      setEventos([]);
      return () => {};
    }

    // Si llegamos aquí, es porque currentUser y currentUser.teamId existen.
    console.log(`Realizando consulta para teamId: ${currentUser.teamId}`);

    const q = query(collection(db, 'eventos'), where("teamId", "==", currentUser.teamId), orderBy('fecha', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Añadimos un log para ver exactamente qué está llegando de Firebase.
      console.log("Datos recibidos de Firestore:", eventosData);
      
      setEventos(eventosData);
    }, (error) => {
      console.error("Error en onSnapshot: ", error);
    });

    // La función de limpieza que detiene la escucha cuando el componente se desmonta o el usuario cambia.
    return () => {
      console.log("Limpiando suscripción de onSnapshot.");
      unsubscribe();
    };
    
  }, [currentUser]); // La dependencia en currentUser es correcta.


  const crearEvento = async (e) => {
    e.preventDefault();
    if (!nuevoEvento.descripcion || !nuevoEvento.fecha || !currentUser) return;
    
    await addDoc(collection(db, 'eventos'), {
      ...nuevoEvento,
      teamId: currentUser.teamId, // Asegura que los nuevos eventos tengan teamId
      userId: currentUser.uid,
      valoracion_colectiva: 0,
      puntos_obtenidos: -1,
    });

    setNuevoEvento({ tipo: 'Partido', descripcion: '', fecha: '', condicion: 'Local' });
  };

  const eventosFiltrados = eventos.filter(evento => {
    if (filtro === 'Todos') return true;
    return evento.tipo.toLowerCase() === filtro.toLowerCase();
  });

  return (
    <div>
      {currentUser?.rol === 'administrador' && (
        <div className="card">
          <h2>Crear Nuevo Evento</h2>
          <form onSubmit={crearEvento} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
            {/* ... Formulario ... */}
            <select value={nuevoEvento.tipo} onChange={e => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}><option value="Partido">Partido</option><option value="Entrenamiento">Entrenamiento</option></select>
            <input value={nuevoEvento.descripcion} onChange={e => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })} placeholder={nuevoEvento.tipo === 'Partido' ? 'vs Rival' : 'Descripción'} required />
            <input value={nuevoEvento.fecha} onChange={e => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })} type="date" required />
            {nuevoEvento.tipo === 'Partido' && (<select value={nuevoEvento.condicion} onChange={e => setNuevoEvento({ ...nuevoEvento, condicion: e.target.value })}><option value="Local">Local</option><option value="Visitante">Visitante</option></select>)}
            <button type="submit" style={{ gridColumn: '1 / -1' }}>Crear Evento</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Historial de Eventos</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setFiltro('Todos')} style={{ background: filtro === 'Todos' ? '#61dafb' : '#555' }}>Todos</button>
          <button onClick={() => setFiltro('Partido')} style={{ background: filtro === 'Partido' ? '#61dafb' : '#555' }}>Partidos</button>
          <button onClick={() => setFiltro('Entrenamiento')} style={{ background: filtro === 'Entrenamiento' ? '#61dafb' : '#555' }}>Entrenamientos</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {eventosFiltrados.map(evento => <CardEvento key={evento.id} evento={evento} />)}
      </div>
    </div>
  );
}

// El componente CardEvento no necesita cambios
function CardEvento({ evento }) {
    let resultadoParaMostrar = '';
    let resultadoColor = {};
    if (evento.tipo === 'Partido' && typeof evento.goles_favor !== 'undefined' && typeof evento.goles_contra !== 'undefined') {
        const golesFavor = evento.goles_favor;
        const golesContra = evento.goles_contra;
        resultadoParaMostrar = `${golesFavor} - ${golesContra}`;
        if (golesFavor > golesContra) { resultadoColor = { color: '#4CAF50' }; }
        else if (golesFavor < golesContra) { resultadoColor = { color: '#F44336' }; }
        else { resultadoColor = { color: '#FFC107' }; }
    }
    return (
        <Link to={`/evento/${evento.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{evento.tipo === 'Partido' ? `vs ${evento.descripcion}` : evento.descripcion}</h4>
                    {resultadoParaMostrar && (<span style={{ fontWeight: 'bold', fontSize: '1.1em', ...resultadoColor }}>{resultadoParaMostrar}</span>)}
                </div>
                <p>{new Date(evento.fecha).toLocaleDateString()} {evento.tipo === 'Partido' ? `(${evento.condicion})` : ''}</p>
                {evento.valoracion_colectiva > 0 && (<div style={{ background: '#4CAF50', color: 'white', padding: '5px 10px', borderRadius: '5px', textAlign: 'center', marginTop: '10px' }}>Valoración: {evento.valoracion_colectiva.toFixed(2)}/10</div>)}
            </div>
        </Link>
    );
}

export default Eventos;
