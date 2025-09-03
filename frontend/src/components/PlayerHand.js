import React from 'react';
import styled from 'styled-components';

const PlayerContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  border: ${props => props.isCurrentPlayer ? '3px solid #00ff88' : '2px solid rgba(255,255,255,0.2)'};
  box-shadow: ${props => props.isCurrentPlayer ? '0 0 20px rgba(0, 255, 136, 0.3)' : '0 4px 8px rgba(0,0,0,0.2)'};
  transition: all 0.3s ease;
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const PlayerName = styled.h3`
  margin: 0;
  color: ${props => props.isCurrentPlayer ? '#00ff88' : '#ffd700'};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlayerStats = styled.div`
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 5px;
  }
`;

const StatItem = styled.span`
  background: rgba(0,0,0,0.3);
  padding: 5px 10px;
  border-radius: 15px;
  white-space: nowrap;
`;

const SpellHand = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  min-height: 60px;
  align-items: center;
`;

const SpellTile = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  background: ${props => getSpellColor(props.spellNumber)};
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const HiddenHand = styled.div`
  background: rgba(0,0,0,0.3);
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  font-style: italic;
  color: #ccc;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusIndicator = styled.div`
  font-size: 0.8rem;
  color: ${props => {
    switch(props.state) {
      case 'ELIMINATED': return '#ff4444';
      case 'SKIPPED': return '#ffaa00';
      default: return '#00ff88';
    }
  }};
  font-weight: bold;
`;

function getSpellColor(spellNumber) {
  const colors = {
    1: 'linear-gradient(45deg, #ff6b6b, #ee5a52)', // Red - Magic Missile
    2: 'linear-gradient(45deg, #4ecdc4, #44a08d)', // Teal - Lightning Bolt  
    3: 'linear-gradient(45deg, #9b59b6, #8e44ad)', // Purple - Drain Life
    4: 'linear-gradient(45deg, #95a5a6, #7f8c8d)', // Gray - Stone Skin
    5: 'linear-gradient(45deg, #ff9500, #ff6347)', // Orange - Fireball
    6: 'linear-gradient(45deg, #74b9ff, #0984e3)', // Blue - Blizzard
    7: 'linear-gradient(45deg, #6c5ce7, #a29bfe)', // Light Purple - Earthquake
    8: 'linear-gradient(45deg, #2d3436, #636e72)'  // Dark - Dark Ritual
  };
  return colors[spellNumber] || 'linear-gradient(45deg, #ddd, #bbb)';
}

function getSpellName(spellNumber) {
  const spells = {
    1: 'Summon Dragon',
    2: 'Dark Ghost',
    3: 'Sweet Dream',
    4: 'Owl',
    5: 'Lightning Storm',
    6: 'Storm',
    7: 'Fireball',
    8: 'Healing'
  };
  return spells[spellNumber] || 'Unknown Spell';
}

function PlayerHand({ player, isOtherPlayer, isCurrentPlayer }) {
  const renderSpellHand = () => {
    if (isOtherPlayer) {
      // Show other players' hands (visible to everyone except the owner)
      return (
        <SpellHand>
          {player.hand.map((spellNumber, index) => (
            <SpellTile 
              key={index} 
              spellNumber={spellNumber}
              title={`${spellNumber} - ${getSpellName(spellNumber)}`}
            >
              {spellNumber}
            </SpellTile>
          ))}
        </SpellHand>
      );
    } else {
      // Hide own hand
      return (
        <HiddenHand>
          🔮 Your hand is hidden from you<br/>
          ({player.handSize || 0} spell{(player.handSize || 0) !== 1 ? 's' : ''} remaining)
        </HiddenHand>
      );
    }
  };

  const getPlayerStatusIcon = () => {
    if (player.state === 'ELIMINATED') return '💀';
    if (isCurrentPlayer) return '⭐';
    return '🧙';
  };

  const getPlayerStatusText = () => {
    switch(player.state) {
      case 'ELIMINATED': return 'Eliminated';
      case 'SKIPPED': return 'Turn Skipped';
      default: return 'Active';
    }
  };

  return (
    <PlayerContainer isCurrentPlayer={isCurrentPlayer}>
      <PlayerHeader>
        <PlayerName isCurrentPlayer={isCurrentPlayer}>
          {getPlayerStatusIcon()} {player.name}
          {isOtherPlayer ? '' : ' (You)'}
        </PlayerName>
        
        <PlayerStats>
          <StatItem>❤️ {player.life}</StatItem>
          <StatItem>⭐ {player.points} pts</StatItem>
          <StatItem>🔮 {player.castSpells || 0} cast</StatItem>
          {player.faceDownSpells > 0 && <StatItem>🦉 {player.faceDownSpells} owl</StatItem>}
        </PlayerStats>
      </PlayerHeader>

      <StatusIndicator state={player.state}>
        Status: {getPlayerStatusText()}
      </StatusIndicator>

      {renderSpellHand()}
    </PlayerContainer>
  );
}

export default PlayerHand;