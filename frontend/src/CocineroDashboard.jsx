import { useState, useEffect } from 'react';

function CocineroDashboard({ socket }) {
  const [pedidosCocina, setPedidosCocina] = useState([]);

  useEffect(() => {
    // Función auxiliar para actualizar estado local
    const actualizarLista = (lista) => setPedidosCocina(lista);

    // ESCUCHA: Eventos que traen la lista actualizada de pedidos
    socket.on('pedido_creado', actualizarLista);
    socket.on('actualizacion_pedidos', actualizarLista);
    socket.on('lista_inicial', actualizarLista);

    return () => {
      socket.off('pedido_creado');
      socket.off('actualizacion_pedidos');
      socket.off('lista_inicial');
    };
  }, []);

  const marcarListo = (idPedido) => {
    // EMISIÓN: Informar al servidor que el plato está listo
    socket.emit('actualizar_estado_pedido', {
      idPedido,
      nuevoEstado: 'Listo para Servir'
    });
  };

  return (
    <div>
      <h2>👨‍🍳 Panel de Cocina</h2>
      <div className="lista-cocina">
        {pedidosCocina.length === 0 ? <p>No hay pedidos pendientes.</p> : null}
        
        {pedidosCocina.map(pedido => (
          <div key={pedido.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>Mesa: {pedido.mesa}</h3>
            <p><strong>Platos:</strong> {pedido.platos.join(', ')}</p>
            <p>Estado: {pedido.estado}</p>
            
            {pedido.estado === 'En Preparación' && (
              <button onClick={() => marcarListo(pedido.id)}>
                ✅ Marcar como Listo
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
export default CocineroDashboard;