import React from 'react';
import styled from 'styled-components';

const InfoContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const InfoSection = styled.div`
  text-align: center;
`;

const InfoTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #ffd700;
  font-size: 1.1rem;
`;

const InfoValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
`;

const GameStateIndicator = styled.div`
  background: ${props => getStateColor(props.state)};
  color: ${props => props.state === 'IN_PROGRESS' ? '#000' : '#fff'};
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  display: inline-block;
`;

const LastActionContainer = styled.div`
  grid-column: 1 / -1;
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  border-left: 4px solid #ffd700;
`;

const LastActionText = styled.div`
  font-style: italic;
  color: #ccc;
`;

function getStateColor(state) {
  switch(state) {
    case 'WAITING': return 'linear-gradient(45deg, #ffaa00, #ff8800)';
    case 'IN_PROGRESS': return 'linear-gradient(45deg, #00ff88, #00cc66)';
    case 'ROUND_END': return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    case 'GAME_END': return 'linear-gradient(45deg, #9b59b6, #8e44ad)';
    default: return 'linear-gradient(45deg, #95a5a6, #7f8c8d)';
  }
}

function getStateText(state) {
  switch(state) {
    case 'WAITING': return 'Waiting for Players';
    case 'IN_PROGRESS': return 'Game in Progress';
    case 'ROUND_END': return 'Round Ended';
    case 'GAME_END': return 'Game Ended';
    default: return 'Unknown State';
  }
}

function formatLastAction(lastAction) {
  if (!lastAction) return null;

  switch(lastAction.type) {
    case 'SUCCESSFUL_CAST':
      const spellNames = {
        1: 'Summon Dragon', 2: 'Dark Ghost', 3: 'Sweet Dream', 4: 'Owl',
        5: 'Lightning Storm', 6: 'Storm', 7: 'Fireball', 8: 'Healing'
      };
      let message = `Successfully cast ${spellNames[lastAction.spellNumber]} (${lastAction.spellNumber})`;
      if (lastAction.diceRoll) {
        message += ` - Rolled ${lastAction.diceRoll}`;
      }
      return message;
    
    case 'FAILED_CAST':
      let failMessage = `Failed to cast ${lastAction.spellNumber}`;
      if (lastAction.isBacklash) {
        failMessage += ` - Dragon backlash: Lost ${lastAction.damage} life (rolled ${lastAction.diceRoll})`;
      } else {
        failMessage += ` - Lost ${lastAction.damage} life`;
      }
      if (lastAction.cardsDrawn > 0) {
        failMessage += ` - Drew ${lastAction.cardsDrawn} card${lastAction.cardsDrawn !== 1 ? 's' : ''}`;
      }
      return failMessage;
    
    case 'PLAYER_ELIMINATED':
      if (lastAction.eliminatedByType === 'SUICIDE') {
        return `${lastAction.playerName} eliminated themselves - All other players gain 1 point`;
      } else {
        return `${lastAction.playerName} was eliminated by ${lastAction.killerName} - Killer gains 3 points, survivors gain 1 point`;
      }
    
    case 'ROUND_END_EXHAUSTION':
      return `${lastAction.playerName} emptied their hand when spells were exhausted - Gains 3 points`;
    
    case 'ROUND_END_SURVIVAL':
      return 'Round ended - Points awarded for survival and eliminations';
    
    default:
      return 'Unknown action';
  }
}

function GameInfo({ gameData }) {
  const { gameState, player, otherPlayers } = gameData;
  const totalPlayers = otherPlayers.length + 1;
  const alivePlayers = otherPlayers.filter(p => p.state === 'ACTIVE').length + 
    (player.state === 'ACTIVE' ? 1 : 0);

  const leadingPlayer = [player, ...otherPlayers].reduce((leader, current) => 
    current.points > leader.points ? current : leader
  );

  return (
    <InfoContainer>
      <InfoSection>
        <InfoTitle>🎮 Game State</InfoTitle>
        <GameStateIndicator state={gameState.state}>
          {getStateText(gameState.state)}
        </GameStateIndicator>
      </InfoSection>

      <InfoSection>
        <InfoTitle>🏁 Round</InfoTitle>
        <InfoValue>{gameState.round}</InfoValue>
      </InfoSection>

      <InfoSection>
        <InfoTitle>👥 Players</InfoTitle>
        <InfoValue>{alivePlayers} / {totalPlayers}</InfoValue>
      </InfoSection>

      <InfoSection>
        <InfoTitle>🔮 Available Spells</InfoTitle>
        <InfoValue>{gameState.spellPoolSize}</InfoValue>
      </InfoSection>

      <InfoSection>
        <InfoTitle>🔒 Secret Pool</InfoTitle>
        <InfoValue>{gameState.secretPoolSize || 0}</InfoValue>
      </InfoSection>

      <InfoSection>
        <InfoTitle>👑 Leading</InfoTitle>
        <InfoValue style={{ fontSize: '1.2rem' }}>
          {leadingPlayer.name === player.name ? 'You!' : leadingPlayer.name}
          <br />
          <span style={{ fontSize: '0.8rem', color: '#ffd700' }}>
            {leadingPlayer.points} points
          </span>
        </InfoValue>
      </InfoSection>

      <InfoSection>
        <InfoTitle>🎯 Target Score</InfoTitle>
        <InfoValue>8 Points</InfoValue>
      </InfoSection>

      {gameState.lastAction && (
        <LastActionContainer>
          <InfoTitle>📝 Last Action</InfoTitle>
          <LastActionText>
            {formatLastAction(gameState.lastAction)}
          </LastActionText>
        </LastActionContainer>
      )}
    </InfoContainer>
  );
}

export default GameInfo;