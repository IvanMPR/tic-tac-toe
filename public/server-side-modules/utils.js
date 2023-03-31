const playersServer = [];
let activePlayer;
let lastConnectedPlayerId;

function determineGamePiece(playersArray) {
  if (playersArray.length === 0) return 'X';

  const firstPlayerGamePiece = playersArray[0].gamePiece;
  return firstPlayerGamePiece === 'X' ? 'O' : 'X';
}

function changeLastConnectedPlayerId(id) {
  lastConnectedPlayerId = id;
  // return lastConnectedPlayerId;
}

function randomActivePlayer(num) {
  activePlayer = num;
}

function toggleActivePlayer(num) {
  return num === 0 ? 1 : 0;
}

module.exports = {
  playersServer,
  determineGamePiece,
  activePlayer,
  changeLastConnectedPlayerId,
  lastConnectedPlayerId,
  randomActivePlayer,
  toggleActivePlayer,
};
