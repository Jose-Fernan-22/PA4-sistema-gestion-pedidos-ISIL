import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './Login';
import MozoDashboard from './MozoDashboard';
import CocineroDashboard from './CocineroDashboard';
import './App.css'; 

// Logica para detectar si estamos en local o en produccion
const URL_BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
// Conexión usando la variable de entorno
const socket = io(URL_BACKEND);

function App() {
  const [usuario, setUsuario] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Monitorear estado de conexión (Punto extra por robustez)
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    // Unir al usuario a su sala privada para notificaciones
    if (usuario) {
      socket.emit('unirse_a_sala_usuario', usuario.id);
    }
  }, [usuario]);

  return (
    <div className="app-container">
      {/* Indicador de estado del sistema */}
      <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
        {isConnected ? '🟢 Sistema Conectado' : '🔴 Desconectado'}
      </div>

      <header>
        <h1>🍽️ Restaurante ISIL - Pedidos en Vivo</h1>
        {usuario && (
          <div className="user-info">
            <span>Hola, <strong>{usuario.nombre}</strong> ({usuario.rol})</span>
            <button onClick={() => setUsuario(null)} className="btn-logout">Salir</button>
          </div>
        )}
      </header>

      <main>
        {!usuario ? (
          <Login onLogin={setUsuario} />
        ) : usuario.rol === 'Mozo' ? (
          <MozoDashboard socket={socket} usuario={usuario} />
        ) : (
          <CocineroDashboard socket={socket} />
        )}
      </main>
    </div>
  );
}

export default App;