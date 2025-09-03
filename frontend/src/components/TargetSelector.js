import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
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
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  border: 2px solid rgba(255,255,255,0.2);
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const SpellInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  border: 2px solid #ffd700;
`;

const SpellTitle = styled.h2`
  margin: 0 0 10px 0;
  color: #ffd700;
  font-size: 1.8rem;
`;

const SpellDescription = styled.p`
  margin: 0;
  color: white;
  font-size: 1.1rem;
  line-height: 1.4;
`;

const TargetsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const TargetButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: 2px solid rgba(255,255,255,0.3);
  color: white;
  padding: 15px;
  border-radius: 10px;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #ffd700;
    background: linear-gradient(45deg, #764ba2, #667eea);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const CancelButton = styled.button`
  background: linear-gradient(45deg, #ff4444, #cc0000);
`;

const spellData = {
  1: { name: 'Summon Dragon', description: 'All other players lose Life Points = dice roll (1-3)', icon: '🐉' },
  2: { name: 'Dark Ghost', description: 'All other players lose 1 Life Point. You recover 1 Life Point', icon: '👻' },
  3: { name: 'Sweet Dream', description: 'Recover Life Points = dice roll (1-3)', icon: '💤' },
  4: { name: 'Owl', description: 'Take 1 spell from pool face-down. +1 point per face-down spell at round end', icon: '🦉' },
  5: { name: 'Lightning Storm', description: 'Players on your left and right lose 1 Life Point', icon: '⚡' },
  6: { name: 'Storm', description: 'Player on your left loses 1 Life Point', icon: '🌪️' },
  7: { name: 'Fireball', description: 'Player on your right loses 1 Life Point', icon: '🔥' },
  8: { name: 'Healing', description: 'You gain 1 Life Point (max 6)', icon: '💚' }
};

function TargetSelector({ spell, availableTargets, onTargetSelect, onCancel }) {
  if (!spell) return null;

  const spellInfo = spellData[spell.spellNumber];

  return (
    <ModalOverlay>
      <ModalContent>
        <SpellInfo>
          <SpellTitle>
            {spellInfo.icon} {spellInfo.name}
          </SpellTitle>
          <SpellDescription>
            {spellInfo.description}
          </SpellDescription>
        </SpellInfo>

        <h3 style={{ marginBottom: '20px', color: '#ffd700' }}>
          Choose your target:
        </h3>

        <TargetsContainer>
          {availableTargets.map(target => (
            <TargetButton
              key={target.id}
              onClick={() => onTargetSelect(target.id)}
            >
              🧙 {target.name}
            </TargetButton>
          ))}
        </TargetsContainer>

        <ActionButtons>
          <CancelButton onClick={onCancel}>
            Cancel Spell
          </CancelButton>
        </ActionButtons>
      </ModalContent>
    </ModalOverlay>
  );
}

export default TargetSelector;