// -------------- REQUIRE MODULES ------------------- //
const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
// ---------------- custom modules  ------------------- //
// prettier-ignore
const { playersServer, determineGamePiece} = require('./public/server-side-modules/utils');
// ----- variables ------- //
let activePlayer;

// -------------- INIT APP-SERVER-SOCKET  ------------------- //
const app = express();
const server = http.createServer(app);
const io = socketio(server);
// -------------- SERVE STATIC FILES ------------------- //
app.use(express.static(path.join(__dirname, 'public')));

// -------------- SOCKETS HANDLING ------------------- //

io.on('connection', socket => {
  socket.on('new player', username => {
    // create player object
    const player = {
      username,
      id: socket.id,
      gamePiece: determineGamePiece(playersServer),
      score: 0,
    };
    // if two players are already connected, reject attempted connection
    if (playersServer.length === 2) {
      socket.emit('no room');
      socket.disconnect();
      return;
    }
    // add newly connected player to players array
    playersServer.push(player);

    if (playersServer.length === 1) {
      socket.emit('waiting for second player');
    }
    if (playersServer.length === 2) {
      io.emit('both players connected');
      // start game after 1.5s
      setTimeout(() => {
        activePlayer = Math.floor(Math.random() * 2);
        io.emit('active player', activePlayer);
        lastConnectedPlayer = activePlayer;
      }, 1500);
    }
    io.emit('new player connected', playersServer);
  });

  socket.on('move played', data => {
    socket.broadcast.emit('new move', data);

    setTimeout(() => {
      const nextPlayer = data.currentActivePlayer === 0 ? 1 : 0;
      io.emit('active player', nextPlayer);
    }, 1000);
  });

  socket.on('winner', winner => {
    io.emit('game over', { winner, playersServer });
  });

  socket.on('restart game', () => {
    io.emit('clear board');
    io.emit('both players connected');

    setTimeout(() => {
      activePlayer = Math.floor(Math.random() * 2);
      io.emit('active player', activePlayer);
      lastConnectedPlayer = activePlayer;
    }, 1500);
  });

  socket.on('draw', () => {
    io.emit('draw game');
  });
  // ------------------- IF PLAYER LEAVES DURING THE GAME --------------------- //
  socket.on('disconnect', () => {
    // disconnected player id
    const id = socket.id;
    // declare variables that will be sent by the 'player left event'
    let position;
    let playerName;

    if (!playersServer.some(player => player.id === id)) {
      return;
    }
    // delete disconnected player from players array
    if (playersServer.length > 0) {
      // determine if first or second player has left the game
      position = playersServer[0].id === id ? 0 : 1;
      // get username of the player who left
      playerName = playersServer[position].username;
      // remove first or last player from the array, depending who has left
      position === 0 ? playersServer.shift() : playersServer.pop();
    }

    // emit left event, and send data about player who left, that will be used to inform remaining player
    io.emit('player left game', { playerName, position });
  });
});
// -------------- INITIALIZE SERVER ------------------- //
const PORT = process.env.PORT || 3000;
server.listen(PORT);
