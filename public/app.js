export const socket = io();

// prettier-ignore
import { startButton, onStartGame, usernameButton, resetLastPlayedPiece, gameBoard, boardContainer, playersClient, drawMove, enterUsername, markActivePlayer,parseActivePlayerName, game, clearActivePlayer, startGame, endGame, renderPlayerNames , renderInfoMessage, playerLeftGame, isGameOver, flipDirectionArrow, paintWinnersPieces, gameWinnerSound, activateRestartButton, restartButton, restartGame, resetBoard} from "./client-side-modules/utils-client.js";

// -------- SOCKETS HANDLING ----------- //
socket.on('new player connected', playersServer => {
  renderPlayerNames(playersServer);
  // keep the copy of the players array from server side to client side
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

socket.on('draw game', () => {
  renderInfoMessage('Draw game ! Click on the Restart button to play again...');
  endGame();
  clearActivePlayer();
  activateRestartButton();
});

socket.on('game over', data => {
  endGame();
  paintWinnersPieces(data.winner.winningIndexesArray, gameBoard);
  clearActivePlayer();
  renderInfoMessage(`${data.winner.winnersName} has won this match !`);
  gameWinnerSound();
  activateRestartButton();
});

socket.on('clear board', () => {
  resetBoard();
});

socket.on('player left game', data => {
  playerLeftGame(data);
});

socket.on('no room', () =>
  renderInfoMessage('Both players are already connected...access denied')
);

// -------- EVENT LISTENERS ----------- //
startButton.addEventListener('click', onStartGame);
restartButton.addEventListener('click', restartGame);
usernameButton.addEventListener('click', enterUsername);
boardContainer.addEventListener('click', e => {
  game(e);
});
