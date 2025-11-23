const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const app = express();
const servidor = http.createServer(app);

// Configuración de Socket.IO con CORS para permitir conexión desde Vite (Puerto 5173)
const io = new Server(servidor, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// --- ESTRUCTURA DE DATOS EN MEMORIA PARA PEDIDOS ---
// En un entorno real, esto iría a una base de datos.
let listaPedidos = []; 
/* Estructura de ejemplo de un pedido:
  {
    id: 171562938,
    mesa: "5",
    platos: ["Ceviche", "Arroz con Mariscos"],
    estado: "En Preparación", // o "Listo para Servir"
    mozoId: 1 // ID del usuario que creó el pedido para notificarle luego
  }
*/

// --- ENDPOINT DE LOGIN (REST) ---
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  const usuariosData = JSON.parse(fs.readFileSync('./usuarios.json', 'utf-8'));

  const usuarioEncontrado = usuariosData.find(u => u.usuario === usuario && u.clave === clave);

  if (usuarioEncontrado) {
    res.json({ success: true, user: usuarioEncontrado });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// --- LÓGICA DE SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // 1. REGISTRO EN SALA PRIVADA:
  // Cuando el usuario entra al Dashboard, envía su ID para unirse a una "sala" personal.
  // Esto nos permite enviarle notificaciones solo a él (al Mozo específico).
  socket.on('unirse_a_sala_usuario', (usuarioId) => {
    socket.join(`usuario_${usuarioId}`);
    console.log(`Usuario ${usuarioId} unido a su sala privada.`);
  });

  // 2. NUEVO PEDIDO (Mozo -> Servidor -> Cocineros):
  socket.on('crear_pedido', (nuevoPedido) => {
    listaPedidos.push(nuevoPedido);
    
    // Emitimos a TODOS los conectados (incluyendo cocineros) que hay un nuevo pedido
    io.emit('pedido_creado', listaPedidos);
  });

  // 3. CAMBIO DE ESTADO (Cocinero -> Servidor -> Mozo específico):
  socket.on('actualizar_estado_pedido', ({ idPedido, nuevoEstado }) => {
    const pedido = listaPedidos.find(p => p.id === idPedido);
    
    if (pedido) {
      pedido.estado = nuevoEstado;

      // Notificar a todos para actualizar las listas visuales
      io.emit('actualizacion_pedidos', listaPedidos);

      // NOTIFICACIÓN ESPECÍFICA AL MOZO:
      // Si el pedido está listo, enviamos un evento SOLO a la sala del mozo que lo creó.
      if (nuevoEstado === 'Listo para Servir') {
        io.to(`usuario_${pedido.mozoId}`).emit('notificacion_mozo', {
          mensaje: `¡Atención! Tu pedido de la Mesa ${pedido.mesa} está listo.`,
          pedidoId: pedido.id
        });
      }
    }
  });

  // Enviar lista inicial al conectarse
  socket.emit('lista_inicial', listaPedidos);
});

const PUERTO = 3000;
servidor.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});