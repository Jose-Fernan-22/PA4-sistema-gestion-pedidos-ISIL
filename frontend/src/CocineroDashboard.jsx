import { useState, useEffect } from 'react';

function CocineroDashboard({ socket }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const actualizarLista = (lista) => setPedidos(lista);

    socket.on('lista_inicial', actualizarLista);
    socket.on('pedido_creado', actualizarLista);
    socket.on('actualizacion_pedidos', actualizarLista);

    return () => {
      socket.off('lista_inicial');
      socket.off('pedido_creado');
      socket.off('actualizacion_pedidos');
    };
  }, [socket]);

  const marcarListo = (id) => {
    socket.emit('actualizar_estado_pedido', {
      idPedido: id,
      nuevoEstado: 'Listo para Servir'
    });
  };

  // Filtramos para ver primero los pendientes
  const pedidosPendientes = pedidos.filter(p => p.estado === 'En Preparación');
  const pedidosListos = pedidos.filter(p => p.estado === 'Listo para Servir');

  return (
    <div className="dashboard-cocina">
      <h2>👨‍🍳 Comanda de Cocina</h2>
      
      <div className="cocina-sections">
        <section>
          <h3>🔥 En Preparación ({pedidosPendientes.length})</h3>
          <div className="grid-container">
            {pedidosPendientes.map(pedido => (
              <div key={pedido.id} className="pedido-card pending">
                <div className="card-header">
                  <span className="mesa-badge">Mesa {pedido.mesa}</span>
                </div>
                <ul className="platos-list">
                  {pedido.platos.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
                <button onClick={() => marcarListo(pedido.id)} className="btn-action">
                  ✅ Terminar Plato
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>✅ Listos para Servir ({pedidosListos.length})</h3>
          <div className="grid-container">
            {pedidosListos.map(pedido => (
              <div key={pedido.id} className="pedido-card ready">
                <div className="card-header">
                  <span className="mesa-badge">Mesa {pedido.mesa}</span>
                </div>
                <ul>{pedido.platos.map((p, i) => <li key={i}>{p}</li>)}</ul>
                <small>Esperando mozo...</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CocineroDashboard;