var express = require('express');
var socket = require('socket.io');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
var server = app.listen(5000, function() {
    console.log("Puerto 5000 abierto...");
});

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/whatmini')
    .then(() => {
        console.log('Conectado a MongoDB');
    })
    .catch(err => {
        console.error('Error al conectar a MongoDB', err);
        process.exit(1);
    });

// Definir el esquema de mensajes
const messageSchema = new mongoose.Schema({
    usuario: String,
    mensaje: String,
    timestamp: {
        type: String,
        default: new Date().toLocaleString()
    }
});
const Message = mongoose.model('Message', messageSchema);

// Definir el esquema de usuarios
const userSchema = new mongoose.Schema({
    usuario: String,
    contraseña: String
});
const User = mongoose.model('User', userSchema);

// Middleware para procesar datos JSON y formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configurar Socket.io
var io = socket(server);
let usuariosConectados = [];

// Manejo de conexiones de Socket.io
io.on('connection', async function(socket) {
    console.log('Conexión establecida con el ID: ', socket.id);
    
    // Cargar mensajes previos desde MongoDB
    try {
        const mensajesGuardados = await Message.find({});
        socket.emit('cargar mensajes', mensajesGuardados);
    } catch (error) {
        console.error('Error al cargar los mensajes:', error);
    }

    // Cuando se conecta un nuevo usuario
    socket.on('nuevo usuario', function(nombreUsuario) {
        socket.username = nombreUsuario;
        if (!usuariosConectados.includes(nombreUsuario)) {
            usuariosConectados.push(nombreUsuario);
        }
        io.sockets.emit('actualizar usuarios', usuariosConectados);
    });

    // Cuando se envía un mensaje de chat
    socket.on('chat', async function(data) {
        const now = new Date();
        const timestamp = now.toLocaleString();

        const nuevoMensaje = new Message({
            usuario: socket.username,  // Asegúrate de que el nombre de usuario está asociado correctamente
            mensaje: data.mensaje,
            timestamp: timestamp
        });

        try {
            await nuevoMensaje.save();
            io.sockets.emit('chat', nuevoMensaje);
            console.log('Mensaje guardado en MongoDB:', nuevoMensaje);
        } catch (error) {
            console.error('Error al guardar el mensaje:', error);
        }
    });

    // Evento de usuario escribiendo
    socket.on('typing', function(data) {
        socket.broadcast.emit('typing', data);
    });

    // Cuando un usuario se desconecta
    socket.on('disconnect', function() {
        usuariosConectados = usuariosConectados.filter(usuario => usuario !== socket.username);
        io.sockets.emit('actualizar usuarios', usuariosConectados);
        console.log(`Usuario desconectado: ${socket.username}`);
    });
});

// Endpoint para iniciar sesión
app.post('/login', async (req, res) => {
    const { usuario, contraseña } = req.body;

    try {
        const user = await User.findOne({ usuario });

        if (!user) {
            return res.status(401).send({ success: false, message: 'Usuario no encontrado' });
        }

        if (user.contraseña === contraseña) {
            res.status(200).send({ success: true, usuario: user.usuario });
        } else {
            res.status(401).send({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).send({ success: false, message: 'Error del servidor' });
    }
});
