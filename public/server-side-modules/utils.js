const playersServer = [];

function determineGamePiece(playersArray) {
  if (playersArray.length === 0) return 'X';

  const firstPlayerGamePiece = playersArray[0].gamePiece;
  return firstPlayerGamePiece === 'X' ? 'O' : 'X';
}

module.exports = {
  playersServer,
  determineGamePiece,
};
