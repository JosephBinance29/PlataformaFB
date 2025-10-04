// src/pages/Eventos.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [nuevoEvento, setNuevoEvento] = useState({ tipo: 'Partido', descripcion: '', fecha: '', condicion: 'Local' });
  const { currentUser } = useAuth();

  useEffect(() => {
    const obtenerEventos = async () => {
      if (currentUser) {
        const q = query(collection(db, 'eventos'), where("userId", "==", currentUser.uid), orderBy('fecha', 'desc'));
        const data = await getDocs(q);
        setEventos(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    obtenerEventos();
  }, [currentUser]);

  const crearEvento = async (e) => {
    e.preventDefault();
    if (!nuevoEvento.descripcion || !nuevoEvento.fecha || !currentUser) return;
    
    // 1. Añadimos el nuevo evento a la base de datos
    await addDoc(collection(db, 'eventos'), {
      ...nuevoEvento,
      userId: currentUser.uid,
      valoracion_colectiva: 0,
      puntos_obtenidos: -1,
    });

    // 2. Limpiamos el formulario
    setNuevoEvento({ tipo: 'Partido', descripcion: '', fecha: '', condicion: 'Local' });

    // 3. ¡CORRECCIÓN! Volvemos a pedir la lista actualizada de eventos para refrescar la pantalla
    const q = query(collection(db, 'eventos'), where("userId", "==", currentUser.uid), orderBy('fecha', 'desc'));
    const data = await getDocs(q);
    setEventos(data.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const eventosFiltrados = eventos.filter(evento => {
    if (filtro === 'Todos') return true;
    return evento.tipo === filtro;
  });

  const partidosLocal = eventosFiltrados.filter(e => e.tipo === 'Partido' && e.condicion === 'Local');
  const partidosVisitante = eventosFiltrados.filter(e => e.tipo === 'Partido' && e.condicion === 'Visitante');

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div className="card">
        <h2>Crear Nuevo Evento</h2>
        <form onSubmit={crearEvento} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
          <select value={nuevoEvento.tipo} onChange={e => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}>
            <option value="Partido">Partido</option>
            <option value="Entrenamiento">Entrenamiento</option>
          </select>
          <input value={nuevoEvento.descripcion} onChange={e => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })} placeholder={nuevoEvento.tipo === 'Partido' ? 'vs Rival' : 'Descripción'} required />
          <input value={nuevoEvento.fecha} onChange={e => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })} type="date" required />
          {nuevoEvento.tipo === 'Partido' && (
            <select value={nuevoEvento.condicion} onChange={e => setNuevoEvento({ ...nuevoEvento, condicion: e.target.value })}>
              <option value="Local">Local</option>
              <option value="Visitante">Visitante</option>
            </select>
          )}
          <button type="submit" style={{ gridColumn: '1 / -1' }}>Crear Evento</button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Historial de Eventos</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setFiltro('Todos')} style={{ background: filtro === 'Todos' ? '#61dafb' : '#555' }}>Todos</button>
          <button onClick={() => setFiltro('Partido')} style={{ background: filtro === 'Partido' ? '#61dafb' : '#555' }}>Partidos</button>
          <button onClick={() => setFiltro('Entrenamiento')} style={{ background: filtro === 'Entrenamiento' ? '#61dafb' : '#555' }}>Entrenamientos</button>
        </div>
      </div>

      {filtro === 'Partido' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div><h3>Local</h3>{partidosLocal.map(evento => <CardEvento key={evento.id} evento={evento} />)}</div>
          <div><h3>Visitante</h3>{partidosVisitante.map(evento => <CardEvento key={evento.id} evento={evento} />)}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {eventosFiltrados.map(evento => <CardEvento key={evento.id} evento={evento} />)}
        </div>
      )}
    </div>
  );
}

function CardEvento({ evento }) {
  const resultado = evento.puntos_obtenidos !== -1 && evento.puntos_obtenidos !== undefined ? `${evento.goles_favor} - ${evento.goles_contra}` : '';
  return (
    <Link to={`/evento/${evento.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>{evento.tipo === 'Partido' ? `vs ${evento.descripcion}` : evento.descripcion}</h4>
          {resultado && <span style={{ fontWeight: 'bold' }}>{resultado}</span>}
        </div>
        <p>{new Date(evento.fecha).toLocaleDateString()} {evento.tipo === 'Partido' ? `(${evento.condicion})` : ''}</p>
        {evento.valoracion_colectiva > 0 && (
          <div style={{ background: '#4CAF50', color: 'white', padding: '5px 10px', borderRadius: '5px', textAlign: 'center', marginTop: '10px' }}>
            Valoración: {evento.valoracion_colectiva.toFixed(2)}/10
          </div>
        )}
      </div>
    </Link>
  );
}

export default Eventos;
