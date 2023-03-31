export const socket = io();

// prettier-ignore
import { startButton, onStartGame, usernameButton, resetLastPlayedPiece, updateScore, gameBoard, boardContainer, playersClient, drawMove, enterUsername, markActivePlayer,parseActivePlayerName, game, clearActivePlayer, startGame, endGame, renderPlayerNames , renderInfoMessage, playerLeftGame, isGameOver, flipDirectionArrow,paintWinnersPieces} from "./client-side-modules/utils-client.js";

// -------- SOCKETS HANDLING ----------- //
socket.on('new player connected', playersServer => {
  renderPlayerNames(playersServer);
  // keep copy of the players array from server side to client side
  playersClient.length === 0
    ? playersClient.push(...playersServer)
    : playersClient.push(playersServer.pop());
});

socket.on('waiting for second player', () =>
  renderInfoMessage('Waiting for second player to connect...')
);

socket.on('both players connected', () => {
  startGame();
  renderInfoMessage('Players connected, game is starting...');
});

socket.on('active player', position => {
  if (isGameOver) return;
  console.log(position, 'from active player...');
  clearActivePlayer();
  markActivePlayer(position);
  const currentPlayer = parseActivePlayerName();
  renderInfoMessage(`${currentPlayer} is on the move...`);
  flipDirectionArrow();
});

socket.on('new move', data => {
  drawMove(data);
  resetLastPlayedPiece();
});

socket.on('game over', data => {
  console.log(data, 'from game over...');
  updateScore(data.playersServer);
  endGame();
  paintWinnersPieces(data.winner.paintIndexesArray, gameBoard);
  clearActivePlayer();
  renderInfoMessage(`${data.winner.username} has won this match !`);
  console.log('from players client', playersClient);
});

socket.on('player left game', data => {
  playerLeftGame(data);
});

socket.on('no room', () =>
  renderInfoMessage('Both players are already connected...access denied')
);

// -------- EVENT LISTENERS ----------- //
startButton.addEventListener('click', onStartGame);
usernameButton.addEventListener('click', enterUsername);
boardContainer.addEventListener('click', e => {
  game(e);
});
// restart button listener
// clear board and score up
