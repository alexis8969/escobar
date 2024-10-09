const express = require('express');
const mysql = require('mysql');
const http = require('http');
const socketIo = require('socket.io');

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Cambia esto por tu usuario de MySQL
    password: '',      // Cambia esto por tu contraseña de MySQL
    database: 'chatdb' // Nombre de la base de datos
});

connection.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');
});

// Servir archivos estáticos
app.use(express.static('public'));

// Ruta para autenticación de usuario
app.post('/login', express.json(), (req, res) => {
    const { username, password } = req.body;

    // Consultar en la base de datos si el usuario existe
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error en la base de datos');
        }

        if (results.length > 0) {
            res.status(200).send('Autenticación exitosa');
        } else {
            res.status(401).send('Usuario o contraseña incorrectos');
        }
    });
});

// Manejo de conexiones de socket.io
io.on('connection', socket => {
    console.log('Nuevo cliente conectado');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
