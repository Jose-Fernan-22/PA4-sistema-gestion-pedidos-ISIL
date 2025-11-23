import { useState, useEffect } from 'react';

function MozoDashboard({ socket, usuario }) {
  const [mesa, setMesa] = useState('');
  const [platos, setPlatos] = useState('');
  const [misPedidos, setMisPedidos] = useState([]);

  useEffect(() => {
    // Escuchar actualizaciones de la lista general
    const handleUpdate = (lista) => {
      // Filtramos solo los pedidos de ESTE mozo
      setMisPedidos(lista.filter(p => p.mozoId === usuario.id));
    };

    socket.on('lista_inicial', handleUpdate);
    socket.on('pedido_creado', handleUpdate);
    socket.on('actualizacion_pedidos', handleUpdate);

    // Escuchar notificación PERSONALIZADA (Solo suena para este usuario)
    socket.on('notificacion_mozo', (data) => {
      // Podrías poner un sonido aquí
      alert(`🔔 ¡ATENCIÓN! ${data.mensaje}`);
    });

    return () => {
      socket.off('lista_inicial');
      socket.off('pedido_creado');
      socket.off('actualizacion_pedidos');
      socket.off('notificacion_mozo');
    };
  }, [usuario.id, socket]);

  const enviarPedido = (e) => {
    e.preventDefault();
    if (!mesa.trim() || !platos.trim()) return alert("Completa los datos");

    const nuevoPedido = {
      id: Date.now(),
      mesa,
      platos: platos.split(',').map(p => p.trim()), // Limpia espacios
      estado: 'En Preparación',
      mozoId: usuario.id,
      timestamp: new Date().toLocaleTimeString()
    };

    socket.emit('crear_pedido', nuevoPedido);
    
    // Resetear formulario
    setMesa('');
    setPlatos('');
  };

  return (
    <div className="dashboard">
      <div className="card form-card">
        <h3>📝 Nuevo Pedido</h3>
        <form onSubmit={enviarPedido}>
          <input 
            type="text" 
            value={mesa} 
            onChange={e => setMesa(e.target.value)} 
            placeholder="N° Mesa" 
            className="input-field"
          />
          <input 
            type="text" 
            value={platos} 
            onChange={e => setPlatos(e.target.value)} 
            placeholder="Platos (ej: Ceviche, Cola)" 
            className="input-field"
          />
          <button type="submit" className="btn-primary">Enviar a Cocina 🚀</button>
        </form>
      </div>

      <div className="pedidos-list">
        <h3>Mis Pedidos Activos</h3>
        <div className="grid-container">
          {misPedidos.map(pedido => (
            <div key={pedido.id} className={`pedido-card ${pedido.estado === 'Listo para Servir' ? 'ready' : 'pending'}`}>
              <div className="card-header">
                <span className="mesa-badge">Mesa {pedido.mesa}</span>
                <small>{pedido.timestamp}</small>
              </div>
              <ul>
                {pedido.platos.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <div className="status-badge">
                {pedido.estado}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MozoDashboard;