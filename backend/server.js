/*
  ARQUITECTURA DE SOFTWARE - BACKEND
  Tecnologías: Node.js, Express, Socket.IO
  Persistencia: Archivos JSON (Sin base de datos compleja)
*/

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const servidor = http.createServer(app);

// Configuración de CORS para permitir que el Frontend (Vite) se conecte
const io = new Server(servidor, {
  cors: {
    origin:   "*", //"http://localhost:5173", Puerto por defecto de Vite
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// --- PERSISTENCIA DE DATOS ---
const FILE_USUARIOS = './usuarios.json';
const FILE_PEDIDOS = './pedidos.json';

// Función auxiliar para leer pedidos sin romper el servidor si el archivo no existe
const leerPedidos = () => {
  try {
    if (!fs.existsSync(FILE_PEDIDOS)) {
      fs.writeFileSync(FILE_PEDIDOS, '[]'); // Crear si no existe
      return [];
    }
    const data = fs.readFileSync(FILE_PEDIDOS, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo pedidos:", error);
    return [];
  }
};

// Función auxiliar para guardar pedidos
const guardarPedidos = (pedidos) => {
  try {
    fs.writeFileSync(FILE_PEDIDOS, JSON.stringify(pedidos, null, 2));
  } catch (error) {
    console.error("Error guardando pedidos:", error);
  }
};

// Cargar pedidos al iniciar el servidor
let listaPedidos = leerPedidos();

// --- API REST (Login) ---
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  
  try {
    const usuariosData = JSON.parse(fs.readFileSync(FILE_USUARIOS, 'utf-8'));
    const usuarioEncontrado = usuariosData.find(u => u.usuario === usuario && u.clave === clave);

    if (usuarioEncontrado) {
      // No enviamos la contraseña al frontend por seguridad
      const { clave, ...userWithoutPass } = usuarioEncontrado;
      res.json({ success: true, user: userWithoutPass });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// --- WEB SOCKETS (Tiempo Real) ---
io.on('connection', (socket) => {
  console.log('⚡ Cliente conectado:', socket.id);

  // 1. Enviar lista actual al conectarse (para que no vean pantalla vacía)
  socket.emit('lista_inicial', listaPedidos);

  // 2. Unir al usuario a su sala privada (Para notificaciones directas)
  socket.on('unirse_a_sala_usuario', (usuarioId) => {
    if (usuarioId) {
      socket.join(`usuario_${usuarioId}`);
      console.log(`👤 Usuario ${usuarioId} unido a su sala privada.`);
    }
  });

  // 3. Escuchar nuevo pedido del Mozo
  socket.on('crear_pedido', (nuevoPedido) => {
    listaPedidos.push(nuevoPedido);
    guardarPedidos(listaPedidos); // Persistir en disco
    
    // Emitir a TODOS (Cocineros ven el nuevo pedido, Mozos ven su lista actualizada)
    io.emit('pedido_creado', listaPedidos);
  });

  // 4. Escuchar cambio de estado del Cocinero
  socket.on('actualizar_estado_pedido', ({ idPedido, nuevoEstado }) => {
    const pedidoIndex = listaPedidos.findIndex(p => p.id === idPedido);
    
    if (pedidoIndex !== -1) {
      listaPedidos[pedidoIndex].estado = nuevoEstado;
      guardarPedidos(listaPedidos); // Persistir cambios

      // Actualizar tableros de todos
      io.emit('actualizacion_pedidos', listaPedidos);

      // LÓGICA DE NOTIFICACIÓN ESPECÍFICA
      if (nuevoEstado === 'Listo para Servir') {
        const mozoId = listaPedidos[pedidoIndex].mozoId;
        // Enviar mensaje SOLO a la sala de ese mozo
        io.to(`usuario_${mozoId}`).emit('notificacion_mozo', {
          mensaje: `🔔 ¡Pedido de Mesa ${listaPedidos[pedidoIndex].mesa} listo!`,
          pedidoId: idPedido
        });
        console.log(`📢 Notificando al Mozo ID: ${mozoId}`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const PUERTO = process.env.PORT || 3000;
servidor.listen(PUERTO, () => {
  console.log(`🚀 Servidor Backend corriendo en puerto ${PUERTO}`);
});