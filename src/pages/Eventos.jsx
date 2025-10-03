// src/pages/Eventos.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function Eventos() {
  const [todosLosEventos, setTodosLosEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // Estados para el formulario (sin cambios)
  const [tipo, setTipo] = useState('Partido');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [condicion, setCondicion] = useState('Local');
  const [resumen, setResumen] = useState('');

  const eventosCollectionRef = collection(db, 'eventos');

  const obtenerEventos = async () => {
    const data = await getDocs(eventosCollectionRef);
    const listaEventos = data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    listaEventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setTodosLosEventos(listaEventos);
  };

  useEffect(() => {
    if (filtroActivo === 'Todos') {
      setEventosFiltrados(todosLosEventos);
    } else {
      const filtrados = todosLosEventos.filter(evento => evento.tipo === filtroActivo);
      setEventosFiltrados(filtrados);
    }
  }, [filtroActivo, todosLosEventos]);

  const crearEvento = async (e) => {
    e.preventDefault();
    await addDoc(eventosCollectionRef, { tipo, fecha, descripcion, condicion: tipo === 'Partido' ? condicion : null, resumen: resumen || null, valoracion_colectiva: null });
    setTipo('Partido'); setFecha(''); setDescripcion(''); setCondicion('Local'); setResumen('');
    obtenerEventos();
  };

  useEffect(() => {
    obtenerEventos();
  }, []);

  // Función para renderizar una tarjeta de evento individual
  const renderEventoCard = (evento) => (
    <Link to={`/evento/${evento.id}`} key={evento.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1em' }}>{evento.tipo}: {evento.descripcion}</h3>
            {evento.valoracion_colectiva && (
              <div style={{ background: '#4CAF50', color: 'white', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>
                {evento.valoracion_colectiva.toFixed(2)}/10
              </div>
            )}
          </div>
        </div>
        <p style={{ color: '#ccc', marginTop: '10px', marginBottom: 0 }}>{evento.fecha}</p>
      </div>
    </Link>
  );

  // ¡LÓGICA CORREGIDA! Se ejecuta solo cuando es necesario
  const getPartidosPorCondicion = () => {
    const partidosLocal = eventosFiltrados.filter(e => e.condicion === 'Local');
    const partidosVisitante = eventosFiltrados.filter(e => e.condicion === 'Visitante');
    return { partidosLocal, partidosVisitante };
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Formulario (sin cambios) */}
      <div style={{ background: '#333742', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Registrar Nuevo Evento</h2>
        {/* ... (el JSX del formulario es el mismo) ... */}
        <form onSubmit={crearEvento}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: '10px' }}>
              <option value="Partido">Partido</option>
              <option value="Entrenamiento">Entrenamiento</option>
            </select>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required style={{ padding: '10px' }} />
            <input placeholder="Descripción (ej. vs Real Madrid)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required style={{ padding: '10px' }} />
            {tipo === 'Partido' && (
              <select value={condicion} onChange={(e) => setCondicion(e.target.value)} style={{ padding: '10px' }}>
                <option value="Local">Local</option>
                <option value="Visitante">Visitante</option>
              </select>
            )}
          </div>
          <textarea placeholder="Resumen o notas clave del evento..." value={resumen} onChange={(e) => setResumen(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '15px', minHeight: '80px' }} />
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer' }}>Crear Evento</button>
        </form>
      </div>

      {/* Historial de Eventos con Filtros y Estilos Mejorados */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Historial de Eventos</h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setFiltroActivo('Todos')} style={{ padding: '8px 15px', background: filtroActivo === 'Todos' ? '#4CAF50' : '#555', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>Todos</button>
          <button onClick={() => setFiltroActivo('Partido')} style={{ padding: '8px 15px', background: filtroActivo === 'Partido' ? '#4CAF50' : '#555', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>Partidos</button>
          <button onClick={() => setFiltroActivo('Entrenamiento')} style={{ padding: '8px 15px', background: filtroActivo === 'Entrenamiento' ? '#4CAF50' : '#555', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>Entrenamientos</button>
        </div>
      </div>
      <hr style={{ borderColor: '#444', marginBottom: '20px' }} />

      {/* ¡RENDERIZADO CORREGIDO! */}
      {filtroActivo === 'Partido' ? (
        // Vista de dos columnas para Partidos
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ textAlign: 'center' }}>Local</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {getPartidosPorCondicion().partidosLocal.map(evento => renderEventoCard(evento))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ textAlign: 'center' }}>Visitante</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {getPartidosPorCondicion().partidosVisitante.map(evento => renderEventoCard(evento))}
            </div>
          </div>
        </div>
      ) : (
        // Vista de rejilla para 'Todos' y 'Entrenamientos'
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {eventosFiltrados.map(evento => renderEventoCard(evento))}
        </div>
      )}
    </div>
  );
}

export default Eventos;
