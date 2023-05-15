import { socket } from '../app.js';

export const startButton = document.querySelector('.start-btn');
export const restartButton = document.querySelector('.restart-button-div');
export const usernameWrapperDiv = document.querySelector('.input-div');
export const usernameInput = document.querySelector('.name-input');
export const usernameButton = document.querySelector('.name-btn');
export const boardContainer = document.querySelector('.wrapper');
export const playersClient = [];
export const gameBoard = document.querySelectorAll('.game-field');
export let isGameOver = true;
let lastPlacedPiece;
const playersNames = document.querySelectorAll('.player');
const infoDiv = document.querySelector('.info');
const playerTurnArrow = document.querySelector('.player-turn');

export function resetLastPlayedPiece() {
  lastPlacedPiece = undefined;
}

export function onStartGame() {
  usernameWrapperDiv.classList.toggle('inactive');
  this.classList.toggle('inactive');
  usernameInput.focus();
}

export function enterUsername() {
  if (usernameInput.value === '') return;
  const username = usernameInput.value;

  socket.emit('new player', username);

  usernameInput.value = '';
  usernameWrapperDiv.classList.toggle('inactive');
}

export function renderPlayerNames(playersArray) {
  playersArray.forEach((player, i) => {
    playersNames[i].textContent = `${player.username} (${player.gamePiece})`;
  });
}

export function renderInfoMessage(message) {
  infoDiv.textContent = '';
  infoDiv.textContent = message;
}

export function clearGameBoard() {
  gameBoard.forEach(gameField => (gameField.textContent = ''));
}

export function clearLeftPlayer(position) {
  if (playersNames[position])
    playersNames[position].textContent = `Player ${position + 1}`;
}

export function clearActivePlayer() {
  playersNames.forEach(playerName =>
    playerName.classList.remove('active-player')
  );
}

export function playerLeftGame(data) {
  isGameOver = true;
  clearGameBoard();
  clearLeftPlayer(data.position);
  clearActivePlayer();
  if (data.playerName) {
    renderInfoMessage(
      `${data.playerName} has left...Waiting for second player...`
    );
  }
}

export function markActivePlayer(position) {
  playersNames[position].classList.add('active-player');
}

export function parseActivePlayerName() {
  const activePlayerName = document.querySelector('.active-player');
  return activePlayerName.textContent;
}

export function flipDirectionArrow() {
  const leftOrRight = document
    .getElementById('left')
    .classList.contains('active-player')
    ? 'left'
    : 'right';
  const text = `&${leftOrRight}arrow;`;
  playerTurnArrow.innerHTML = text;
}

// --------------------- SOUNDS --------------------- //
function placeGamePieceSound() {
  const placePieceSound = new Audio('../sounds/draw_piece_sound.wav');
  return placePieceSound.play();
}

export function gameWinnerSound() {
  const winSound = new Audio('../sounds/game_win.wav');
  return winSound.play();
}
// ------------------------------------------------- //

export function getActivePlayerNum() {
  const currentActive = document
    .getElementById('left')
    .classList.contains('active-player')
    ? 0
    : 1;
  return currentActive;
}

export function drawMove(data) {
  const targetField = document.getElementById(data.targetField);
  targetField.textContent = data.gamePiece;
}

export function game(e) {
  if (isGameOver) return;
  if (!e.target.classList.contains('game-field')) return;
  if (e.target.classList.contains('game-field') && e.target.textContent !== '')
    return;

  const [player] = playersClient.filter(player => player.id === socket.id);
  const gamePiece = player.gamePiece;
  const targetField = e.target.getAttribute('id');
  const currentActivePlayer = getActivePlayerNum();
  const activeName = parseActivePlayerName();
  const regex = new RegExp('(' + gamePiece + ')', 'g');
  // prevent consecutive input from the same player
  if (gamePiece === lastPlacedPiece) return;

  // probably not necessary, prevents opposite tab wrong player input. (most likely this is possible only in development mode when two browser windows are open one to another, and player can un/intentionally try to click on the opposite player turn)
  if (!regex.test(activeName)) return;

  // draw gamePiece
  e.target.textContent = gamePiece;
  // play draw sound
  placeGamePieceSound();
  // update last played gamePiece
  lastPlacedPiece = gamePiece;

  socket.emit('move played', {
    targetField,
    gamePiece,
    activeSocketId: socket.id,
    currentActivePlayer,
  });

  checkWinner();
}

// helper functions for manipulating state variable from app.js
export const startGame = () => (isGameOver = false);
export const endGame = () => (isGameOver = true);

// helper function for activating restart button
export const activateRestartButton = () =>
  restartButton.classList.remove('inactive');

// helper function that checks for winner after every move in checkWinner function
const test = (gamePiece, movesArray, winningIndexesArray) =>
  winningIndexesArray.every(index => movesArray[index] === gamePiece);
// helper function for painting winners game pieces in red
export const paintWinnersPieces = (winningIndexesArray, fieldsArray) =>
  winningIndexesArray.forEach(
    index => (fieldsArray[index].style.color = 'red')
  );

function checkWinner() {
  const fields = Array.from(gameBoard);
  const playedMoves = fields.map(field => field.textContent);

  const winningIndexes = [
    // horizontal win
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // vertical win
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // diagonal win
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < winningIndexes.length; i++) {
    if (test('X', playedMoves, winningIndexes[i])) {
      socket.emit('winner', {
        gamePiece: 'X',
        winningIndexesArray: winningIndexes[i],
        winnersName: parseActivePlayerName(),
      });

      isGameOver = true;
      break;
    }

    if (test('O', playedMoves, winningIndexes[i])) {
      socket.emit('winner', {
        gamePiece: 'O',
        winningIndexesArray: winningIndexes[i],
        winnersName: parseActivePlayerName(),
      });

      isGameOver = true;
      break;
    }
  }

  if (!isGameOver && fields.every(div => div.textContent !== '')) {
    isGameOver = true;
    socket.emit('draw');
    return;
  }
}
export function resetBoard() {
  // clear game board
  clearGameBoard();
  // reset last played gamePiece
  resetLastPlayedPiece();
  // reset active player
  clearActivePlayer();
  // set isGameOver to false
  startGame();
  // deactivate restart button
  restartButton.classList.add('inactive');
  // reset game board font color to black
  gameBoard.forEach(field => (field.style.color = 'black'));
}

export function restartGame() {
  // send restart event to server
  socket.emit('restart game');
}
