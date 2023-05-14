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
const scoreSpans = document.querySelectorAll('.score-span');

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
function gameOverWithDraw() {
  isGameOver = true;
  renderInfoMessage('Draw!');
  restartButton.classList.remove('inactive');
  restartButton.classList.add('active');
  // restartButton.textContent = 'Restart';
  playersNames.forEach(playerName =>
    playerName.classList.remove('active-player')
  );
}
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
  if (gamePiece === lastPlacedPiece) {
    console.log('SAME PLAYER');
    return;
  }
  // probably not necessary, prevents opposite tab wrong player input. (most likely this is possible only in development mode when two browser windows are open one to another, and player can intentionally try to click on the opposite player turn)
  if (!regex.test(activeName)) {
    console.log('INVALID PLAYER');
    return;
  }
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
// helper function for updating the score
// export const updateScore = winnerPiece => {
//   const [player] = playersClient.filter(
//     player => player.gamePiece === winnerPiece
//   );
//   player.score += 1;
//   console.log(player, 'from updateScore...');
// };
// helper function for rendering the score
// export const renderScore = playersArray =>
// console.log(playersClient, 'from renderScore...');
// playersArray.forEach(
//   (player, i) => (scoreSpans[i].textContent = player.score)
// );

// helper functions for manipulating state variable from app.js
export const startGame = () => (isGameOver = false);
export const endGame = () => (isGameOver = true);
// helper fn for emitting winner data

const sendWinnerData = (gamePiece, winnerIndexesArray) => {
  const index = playersClient.findIndex(
    player => player.gamePiece === gamePiece
  );
  if (index !== -1) {
    playersClient[index].paintIndexesArray = winnerIndexesArray;
    playersClient[index].score += 1;
    // change state variable
    // isGameOver = true;

    // gameWinnerSound();

    // socket.emit(eventToEmit, gamePiece, playersClient[index]);

    // activateRestartButton();
  }
};
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
      console.log(test('X', playedMoves, winningIndexes[i]));
      socket.emit('winner', {
        gamePiece: 'X',
        winningIndexesArray: winningIndexes[i],
        winnersName: parseActivePlayerName(),
      });

      console.log('winner X');
      isGameOver = true;
      break;
    }

    if (test('O', playedMoves, winningIndexes[i])) {
      console.log(test('O', playedMoves, winningIndexes[i]));
      socket.emit('winner', {
        gamePiece: 'O',
        winningIndexesArray: winningIndexes[i],
        winnersName: parseActivePlayerName(),
      });

      console.log('winner O');
      isGameOver = true;
      break;
    }

    if (
      (!test('X', playedMoves, winningIndexes[i]) ||
        !test('O', playedMoves, winningIndexes[i])) &&
      fields.every(div => div.textContent !== '')
    ) {
      console.log(
        test('X', playedMoves, winningIndexes[i]),
        test('O', playedMoves, winningIndexes[i]),
        'from checkWinner'
      );
      // gameOverWithDraw();
      // clearActivePlayer();
      isGameOver = true;
      socket.emit('draw');
      console.log('DRAW');
      break;
    }

    console.log('next round');
  }
}
export function resetBoard() {
  // clear game board
  clearGameBoard();
  // reset last played gamePiece
  resetLastPlayedPiece();
  // update score
  // setTimeout(() => {
  //   renderScore(playersClient);
  // }, 300);
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
