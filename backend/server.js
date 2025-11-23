const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

// ... imports existentes
const FILE_PEDIDOS = './pedidos.json';

// 1. Función auxiliar para cargar pedidos al iniciar
const cargarPedidos = () => {
  try {
    if (fs.existsSync(FILE_PEDIDOS)) {
      const data = fs.readFileSync(FILE_PEDIDOS, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (e) {
    return [];
  }
};

// 2. Función auxiliar para guardar cambios
const guardarPedidos = (pedidos) => {
  fs.writeFileSync(FILE_PEDIDOS, JSON.stringify(pedidos, null, 2));
};

// Inicializamos la lista desde el archivo
let listaPedidos = cargarPedidos();

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

  // Enviar lista inicial cargada desde archivo
  socket.emit('lista_inicial', listaPedidos);

  socket.on('crear_pedido', (nuevoPedido) => {
    listaPedidos.push(nuevoPedido);
    guardarPedidos(listaPedidos); // <--- GUARDAR EN DISCO
    io.emit('pedido_creado', listaPedidos);
  });

  socket.on('actualizar_estado_pedido', ({ idPedido, nuevoEstado }) => {
    const pedido = listaPedidos.find(p => p.id === idPedido);
    if (pedido) {
      pedido.estado = nuevoEstado;
      guardarPedidos(listaPedidos); // <--- GUARDAR EN DISCO
      io.emit('actualizacion_pedidos', listaPedidos);
    }
  });
});

// Iniciar servidor
const PORT = 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});