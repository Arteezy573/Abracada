import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const Title = styled.h3`
  margin: 0 0 15px 0;
  color: #ffd700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const SpellsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
`;

const SpellCard = styled.div`
  background: ${props => getSpellColor(props.spellNumber)};
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.05);
    border-color: #ffd700;
  }
`;

const SpellNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 8px;
`;

const SpellName = styled.div`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 8px;
`;

const SpellDescription = styled.div`
  font-size: 0.8rem;
  line-height: 1.3;
  opacity: 0.9;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 20px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border: 3px solid #ffd700;
  border-radius: 15px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const CloseButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  margin-top: 15px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function getSpellColor(spellNumber) {
  const colors = {
    1: 'linear-gradient(45deg, #ff6b6b, #ee5a52)', // Red - Summon Dragon
    2: 'linear-gradient(45deg, #4ecdc4, #44a08d)', // Teal - Dark Ghost  
    3: 'linear-gradient(45deg, #9b59b6, #8e44ad)', // Purple - Sweet Dream
    4: 'linear-gradient(45deg, #95a5a6, #7f8c8d)', // Gray - Owl
    5: 'linear-gradient(45deg, #ff9500, #ff6347)', // Orange - Lightning Storm
    6: 'linear-gradient(45deg, #74b9ff, #0984e3)', // Blue - Storm
    7: 'linear-gradient(45deg, #6c5ce7, #a29bfe)', // Light Purple - Fireball
    8: 'linear-gradient(45deg, #2d3436, #636e72)'  // Dark - Healing
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

function FaceDownSpells({ faceDownSpellDetails }) {
  const [selectedSpell, setSelectedSpell] = useState(null);

  if (!faceDownSpellDetails || faceDownSpellDetails.length === 0) {
    return (
      <Container>
        <Title>
          🦉 Face-Down Spells
        </Title>
        <EmptyMessage>
          You haven't collected any face-down spells from Owl yet.
        </EmptyMessage>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Title>
          🦉 Face-Down Spells ({faceDownSpellDetails.length})
        </Title>
        <SpellsGrid>
          {faceDownSpellDetails.map((spellNumber, index) => (
            <SpellCard 
              key={index}
              spellNumber={spellNumber}
              onClick={() => setSelectedSpell(spellNumber)}
            >
              <SpellNumber>{spellNumber}</SpellNumber>
              <SpellName>{spellData[spellNumber]?.name || 'Unknown Spell'}</SpellName>
              <SpellDescription>Click to view details</SpellDescription>
            </SpellCard>
          ))}
        </SpellsGrid>
      </Container>

      {selectedSpell && (
        <Modal onClick={() => setSelectedSpell(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <SpellNumber style={{ color: '#ffd700' }}>
              {spellData[selectedSpell]?.icon} Spell {selectedSpell}
            </SpellNumber>
            <SpellName style={{ color: '#ffd700', fontSize: '1.2rem', margin: '10px 0' }}>
              {spellData[selectedSpell]?.name}
            </SpellName>
            <SpellDescription style={{ color: 'white', fontSize: '1rem', marginBottom: '20px' }}>
              {spellData[selectedSpell]?.description}
            </SpellDescription>
            <CloseButton onClick={() => setSelectedSpell(null)}>
              Close
            </CloseButton>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default FaceDownSpells;