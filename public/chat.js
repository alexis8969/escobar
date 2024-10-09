var socket = io.connect('http://192.168.1.65:5000');

var persona = document.getElementById('persona'),
    appChat = document.getElementById('app-chat'),
    panelBienvenida = document.getElementById('panel-bienvenida'),
    usuario = document.getElementById('usuario'),
    mensaje = document.getElementById('mensaje'),
    botonEnviar = document.getElementById('enviar'),
    escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
    output = document.getElementById('output'),
    usuariosConectados = document.getElementById('usuarios-conectados'); // Elemento para mostrar usuarios

botonEnviar.addEventListener('click', function(){
    if(mensaje.value){
        socket.emit('chat', {
            mensaje: mensaje.value,
            usuario: usuario.value
        });
    }
    mensaje.value = '';
});

mensaje.addEventListener('keyup', function(){
    if(mensaje.value){
        socket.emit('typing', {
            nombre: usuario.value,
            texto: mensaje.value
        });
    } else {
        socket.emit('typing', {
            nombre: usuario.value,
            texto: ''
        });
    }
});

socket.on('chat', function(data){
    escribiendoMensaje.innerHTML = '';
    output.innerHTML += '<p><strong>' + data.usuario + ' (' + data.timestamp + '):</strong> ' + data.mensaje + '</p>';
});

socket.on('typing', function(data){
    if(data.texto){
        escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
    } else {
        escribiendoMensaje.innerHTML = '';
    }
});

socket.on('cargar mensajes', function(mensajes) {
    output.innerHTML = ''; // Limpiar mensajes antes de cargar los nuevos
    mensajes.forEach(function(data) {
        output.innerHTML += '<p><strong>' + data.usuario + ' (' + data.timestamp + '):</strong> ' + data.mensaje + '</p>';
    });
});

// Actualizar la lista de usuarios conectados
socket.on('actualizar usuarios', function(usuarios){
    usuariosConectados.innerHTML = ''; // Limpiar lista actual
    usuarios.forEach(function(usuario){
        usuariosConectados.innerHTML += '<li>' + usuario + '</li>'; // Agregar usuarios a la lista
    });
});

function ingresarAlChat(){
    if(persona.value){
        panelBienvenida.style.display = 'none';
        appChat.style.display = 'block';
        var nombreDeUsuario = persona.value;
        usuario.value = nombreDeUsuario;
        usuario.readOnly = true;

        // Emitir el nuevo usuario al servidor
        socket.emit('nuevo usuario', nombreDeUsuario);
    }
}

