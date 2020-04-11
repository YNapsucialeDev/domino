//DECLARE GLOBAL INSTANCES
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io');
const port = 3000;
const localNetworkIP = 'localhost';
const mainSocket = io(http);
const bodyParser = require('body-parser');
const cors = require('cors');

//use body parser to retrieve body
app.use(bodyParser.json());
app.use(cors());

//Y PONEMOS A NUESTRO WEB SERVER A ESCUCHAR EN EL PUERTO especificado
http.listen(port, localNetworkIP, () =>{
    console.log('Web server escuchando en el puerto: ' + port);
});

//CREAMOS EL EVENT LISTENER PARA NUESTRO SOCKET EN EL PUERTO especificado

//PONEMOS UN LÍMITE DE CONEXIONES AL SOCKET DE 4

const playerLimit = 4;
var socketPlayers = [];
var players = [];

mainSocket.on('connection', (socket) => {
    if(mainSocket.eio.clientsCount > playerLimit)
    {
        socket.emit('fullRoom', 'Esta sala esta llena, espere una desconexión para poder entrar');
        //lo sacamos de la sala
        socket.disconnect();
    }
    else
    {
        socket.emit('welcome', { message: 'Welcome! Player ' + socket.id , id: socket.id });
        socketPlayers.push(socket);
        //handle disconnections
        socket.on('disconnect', () =>
        {
            var i = socketPlayers.indexOf(socket);
            socketPlayers.splice(i, 1);
            players.splice(i, 1);
            mainSocket.emit('players', players);
        });

        socket.on('logout', () =>
        {
            var i = socketPlayers.indexOf(socket);
            socketPlayers.splice(i, 1);
            players.splice(i, 1);
            mainSocket.emit('players', players);
            socket.disconnect();
        });

        socket.on('new_player', (body) => {
            players.push(body);
            mainSocket.emit('players', players);
            if(players.length == 4)
            {
                mainSocket.emit('init-game', true);
            }
            else
            {
                mainSocket.emit('init-game', false);
            }
        });

        //handle messages
        socket.on('message', function(body)
        {
            socket.broadcast.emit('message', body);
        });
    }
});