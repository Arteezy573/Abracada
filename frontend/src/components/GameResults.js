import React from 'react';
import styled from 'styled-components';

const ResultsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ResultsContent = styled.div`
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  border: 3px solid #ffd700;
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const GameOverTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #ffd700, #ffed4a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WinnerSection = styled.div`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
`;

const PlayerScores = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
`;

const ScoreRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerName = styled.span`
  font-weight: bold;
  color: ${props => props.isWinner ? '#ffd700' : '#ffffff'};
`;

const PlayerPoints = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.isWinner ? '#ffd700' : '#ffffff'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
`;

function GameResults({ gameData, onNewGame, onLeaveGame }) {
  if (!gameData || gameData.gameState.state !== 'GAME_END') {
    return null;
  }

  const { gameState, player, otherPlayers } = gameData;
  const allPlayers = [player, ...otherPlayers].sort((a, b) => b.points - a.points);
  
  const getWinnerText = () => {
    if (gameState.winnerType === 'SINGLE') {
      const winner = gameState.winner;
      return `🎉 ${winner.name} Wins! 🎉`;
    } else if (gameState.winnerType === 'TIED') {
      const winners = gameState.winners || [];
      if (winners.length === 2) {
        return `🎉 ${winners.map(w => w.name).join(' and ')} Win Together! 🎉`;
      } else {
        return `🎉 ${winners.map(w => w.name).join(', ')} All Win Together! 🎉`;
      }
    }
    return '🎉 Game Complete! 🎉';
  };

  const isPlayerWinner = (playerId) => {
    if (gameState.winnerType === 'SINGLE') {
      return gameState.winner?.id === playerId;
    } else if (gameState.winnerType === 'TIED') {
      return gameState.winners?.some(w => w.id === playerId);
    }
    return false;
  };

  return (
    <ResultsModal>
      <ResultsContent>
        <GameOverTitle>Game Over!</GameOverTitle>
        
        <WinnerSection>
          <h2>{getWinnerText()}</h2>
          {gameState.winnerType === 'TIED' && (
            <p>Multiple players reached 8 points simultaneously!</p>
          )}
        </WinnerSection>

        <PlayerScores>
          <h3>Final Scores</h3>
          {allPlayers.map(playerData => (
            <ScoreRow key={playerData.id}>
              <PlayerName isWinner={isPlayerWinner(playerData.id)}>
                {isPlayerWinner(playerData.id) && '👑 '}
                {playerData.name}
                {playerData.id === player.id && ' (You)'}
              </PlayerName>
              <PlayerPoints isWinner={isPlayerWinner(playerData.id)}>
                {playerData.points} points
              </PlayerPoints>
            </ScoreRow>
          ))}
        </PlayerScores>

        <div style={{ fontSize: '0.9rem', color: '#ccc', margin: '20px 0' }}>
          <p><strong>Victory Conditions:</strong></p>
          <p>• First to 8 points wins</p>
          <p>• Kill opponent: +3 points (survivors: +1)</p> 
          <p>• Suicide/backfire: Others get +1 point</p>
          <p>• Empty hand when spells exhausted: +3 points</p>
        </div>

        <ActionButtons>
          <button onClick={onNewGame}>
            🔄 New Game
          </button>
          <button 
            onClick={onLeaveGame}
            style={{ background: 'linear-gradient(45deg, #ff4444, #cc0000)' }}
          >
            🚪 Leave Game
          </button>
        </ActionButtons>
      </ResultsContent>
    </ResultsModal>
  );
}

export default GameResults;