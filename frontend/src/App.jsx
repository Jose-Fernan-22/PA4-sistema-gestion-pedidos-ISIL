import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './Login';
import MozoDashboard from './MozoDashboard';
import CocineroDashboard from './CocineroDashboard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (usuario && socket) {
      socket.emit('unirse_a_sala_usuario', usuario.id);
    }
  }, [usuario, socket]);

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