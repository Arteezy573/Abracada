import React, { useState } from 'react';
import styled from 'styled-components';

const CasterContainer = styled.div`
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
`;

const CasterTitle = styled.h4`
  margin: 0 0 15px 0;
  color: #ffd700;
  text-align: center;
`;

const SpellGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const SpellButton = styled.button`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  padding: 8px;
  background: ${props => getSpellColor(props.spellNumber)};
  border: 2px solid rgba(255,255,255,0.3);
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: #ffd700;
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SpellNumber = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 4px;
`;

const SpellName = styled.div`
  font-size: 0.7rem;
  text-align: center;
  line-height: 1.1;
`;

const QuickCastSection = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.2);
`;

const QuickCastInput = styled.input`
  width: 60px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;

const SpellDescription = styled.div`
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
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

const spellData = {
  1: {
    name: 'Summon Dragon',
    description: 'All other players lose Life Points = dice roll (1-3). Backlash if failed!',
    icon: '🐉'
  },
  2: {
    name: 'Dark Ghost',
    description: 'All other players lose 1 Life Point. You recover 1 Life Point',
    icon: '👻'
  },
  3: {
    name: 'Sweet Dream',
    description: 'Recover Life Points = dice roll (1-3)',
    icon: '💤'
  },
  4: {
    name: 'Owl',
    description: 'Take 1 spell from pool face-down. +1 point per face-down spell at round end',
    icon: '🦉'
  },
  5: {
    name: 'Lightning Storm',
    description: 'Players on your left and right lose 1 Life Point',
    icon: '⚡'
  },
  6: {
    name: 'Storm',
    description: 'Player on your left loses 1 Life Point',
    icon: '🌪️'
  },
  7: {
    name: 'Fireball',
    description: 'Player on your right loses 1 Life Point',
    icon: '🔥'
  },
  8: {
    name: 'Healing',
    description: 'You gain 1 Life Point (max 6)',
    icon: '💚'
  }
};

function SpellCaster({ onCastSpell, disabled, consecutiveCasting }) {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [quickCastValue, setQuickCastValue] = useState('');

  const handleSpellClick = (spellNumber) => {
    // Check consecutive casting rules
    if (consecutiveCasting && consecutiveCasting.castCount > 0) {
      if (spellNumber < consecutiveCasting.lastSpellNumber) {
        alert(`Consecutive spells must be ≥ ${consecutiveCasting.lastSpellNumber}`);
        return;
      }
      if (consecutiveCasting.castCount >= consecutiveCasting.maxCasts) {
        alert('Maximum 5 spells per turn reached');
        return;
      }
    }
    
    setSelectedSpell(spellNumber);
  };

  const handleCastSelected = () => {
    if (selectedSpell && onCastSpell) {
      onCastSpell(selectedSpell);
      setSelectedSpell(null);
    }
  };

  const handleQuickCast = (e) => {
    e.preventDefault();
    const spellNum = parseInt(quickCastValue);
    if (spellNum >= 1 && spellNum <= 8) {
      // Check consecutive casting rules
      if (consecutiveCasting && consecutiveCasting.castCount > 0) {
        if (spellNum < consecutiveCasting.lastSpellNumber) {
          alert(`Consecutive spells must be ≥ ${consecutiveCasting.lastSpellNumber}`);
          return;
        }
        if (consecutiveCasting.castCount >= consecutiveCasting.maxCasts) {
          alert('Maximum 5 spells per turn reached');
          return;
        }
      }
      
      if (onCastSpell) {
        onCastSpell(spellNum);
        setQuickCastValue('');
      }
    }
  };

  const handleQuickCastChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 8)) {
      setQuickCastValue(value);
    }
  };

  return (
    <CasterContainer>
      <CasterTitle>🔮 Cast a Spell</CasterTitle>
      
      {selectedSpell && (
        <SpellDescription>
          <strong>{spellData[selectedSpell].icon} {spellData[selectedSpell].name}:</strong><br/>
          {spellData[selectedSpell].description}
        </SpellDescription>
      )}
      
      <SpellGrid>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(spellNumber => {
          const isDisabledByCasting = consecutiveCasting && consecutiveCasting.castCount > 0 && 
            spellNumber < consecutiveCasting.lastSpellNumber;
          const isMaxCasts = consecutiveCasting && consecutiveCasting.castCount >= consecutiveCasting.maxCasts;
          const isSpellDisabled = disabled || isDisabledByCasting || isMaxCasts;
          
          return (
            <SpellButton
              key={spellNumber}
              spellNumber={spellNumber}
              onClick={() => handleSpellClick(spellNumber)}
              disabled={isSpellDisabled}
              style={{
                border: selectedSpell === spellNumber ? 
                  '3px solid #ffd700' : 
                  (isDisabledByCasting ? '2px solid #ff4444' : '2px solid rgba(255,255,255,0.3)'),
                opacity: isSpellDisabled ? 0.5 : 1
              }}
            >
              <SpellNumber>{spellNumber}</SpellNumber>
              <SpellName>{spellData[spellNumber].name}</SpellName>
            </SpellButton>
          );
        })}
      </SpellGrid>
      
      {selectedSpell && (
        <button 
          onClick={handleCastSelected}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'linear-gradient(45deg, #00ff88, #00cc66)',
            color: '#000',
            fontSize: '1.1rem',
            padding: '12px'
          }}
        >
          Cast {spellData[selectedSpell].name}! 🎯
        </button>
      )}
      
      <QuickCastSection>
        <span>Quick Cast:</span>
        <form onSubmit={handleQuickCast} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <QuickCastInput
            type="text"
            placeholder="1-8"
            value={quickCastValue}
            onChange={handleQuickCastChange}
            disabled={disabled}
            maxLength="1"
          />
          <button 
            type="submit" 
            disabled={disabled || !quickCastValue}
            style={{ padding: '8px 12px' }}
          >
            Cast!
          </button>
        </form>
      </QuickCastSection>
    </CasterContainer>
  );
}

export default SpellCaster;