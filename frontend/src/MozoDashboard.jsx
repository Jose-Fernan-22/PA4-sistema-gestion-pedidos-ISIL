import { useState, useEffect } from 'react';

function MozoDashboard({ socket, usuario }) {
  const [mesa, setMesa] = useState('');
  const [platos, setPlatos] = useState('');
  const [misPedidos, setMisPedidos] = useState([]);

  useEffect(() => {
    // ESCUCHA: Actualización general de la lista
    socket.on('pedido_creado', (lista) => filtrarMisPedidos(lista));
    socket.on('actualizacion_pedidos', (lista) => filtrarMisPedidos(lista));
    socket.on('lista_inicial', (lista) => filtrarMisPedidos(lista));

    // ESCUCHA: Notificación personalizada (Solo para ESTE mozo)
    socket.on('notificacion_mozo', (data) => {
      alert(`🔔 NOTIFICACIÓN: ${data.mensaje}`);
    });

    // Limpieza de eventos al desmontar componente
    return () => {
      socket.off('pedido_creado');
      socket.off('actualizacion_pedidos');
      socket.off('lista_inicial');
      socket.off('notificacion_mozo');
    };
  }, []);

  const filtrarMisPedidos = (listaCompleta) => {
    // Solo mostramos los pedidos creados por este usuario (Mozo)
    const propios = listaCompleta.filter(p => p.mozoId === usuario.id);
    setMisPedidos(propios);
  };

  const enviarPedido = () => {
    const nuevoPedido = {
      id: Date.now(), // ID simple basado en tiempo
      mesa,
      platos: platos.split(','), // Convierte texto separado por comas en array
      estado: 'En Preparación',
      mozoId: usuario.id
    };

    // EMISIÓN: Enviar el pedido al servidor
    socket.emit('crear_pedido', nuevoPedido);
    
    // Limpiar inputs
    setMesa('');
    setPlatos('');
  };

  return (
    <div>
      <h2>Panel de Mozo: {usuario.nombre}</h2>
      
      <div className="form-pedido">
        <h3>Nuevo Pedido</h3>
        <input 
          value={mesa} 
          onChange={e => setMesa(e.target.value)} 
          placeholder="Número de Mesa" 
        />
        <input 
          value={platos} 
          onChange={e => setPlatos(e.target.value)} 
          placeholder="Platos (separados por coma)" 
        />
        <button onClick={enviarPedido}>Enviar a Cocina</button>
      </div>

      <h3>Mis Pedidos Activos</h3>
      <ul>
        {misPedidos.map(pedido => (
          <li key={pedido.id} style={{ backgroundColor: pedido.estado === 'Listo para Servir' ? '#d4edda' : '#fff3cd' }}>
            <strong>Mesa {pedido.mesa}:</strong> {pedido.platos.join(', ')} - 
            <span> {pedido.estado}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default MozoDashboard;