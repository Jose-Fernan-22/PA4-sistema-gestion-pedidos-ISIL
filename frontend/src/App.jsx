import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './Login';
import MozoDashboard from './MozoDashboard';
import CocineroDashboard from './CocineroDashboard';

// Conexión al backend
const socket = io('http://localhost:3000');

function App() {
  const [usuario, setUsuario] = useState(null);

  // Efecto para unir al usuario a su sala privada de notificaciones al loguearse
  useEffect(() => {
    if (usuario) {
      socket.emit('unirse_a_sala_usuario', usuario.id);
    }
  }, [usuario]);

  // Renderizado condicional basado en si hay usuario y su rol
  return (
    <div className="container">
      <h1>🍽️ Gestión de Pedidos Restaurante</h1>
      
      {!usuario ? (
        <Login onLogin={(userData) => setUsuario(userData)} />
      ) : (
        <>
          <button onClick={() => setUsuario(null)} style={{float: 'right'}}>Cerrar Sesión</button>
          
          {usuario.rol === 'Mozo' && (
            <MozoDashboard socket={socket} usuario={usuario} />
          )}
          
          {usuario.rol === 'Cocinero' && (
            <CocineroDashboard socket={socket} usuario={usuario} />
          )}
        </>
      )}
    </div>
  );
}

export default App;