import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PlayerHand from './PlayerHand';
import SpellCaster from './SpellCaster';
import GameInfo from './GameInfo';
import TargetSelector from './TargetSelector';
import GameResults from './GameResults';
import FaceDownSpells from './FaceDownSpells';

const GameContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MainGameArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PlayersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const GameActions = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
`;

const CurrentPlayerIndicator = styled.div`
  background: ${props => props.isCurrentPlayer ? 
    'linear-gradient(45deg, #00ff88, #00cc66)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.isCurrentPlayer ? '#000' : '#fff'};
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 1.1rem;
  animation: ${props => props.isCurrentPlayer ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(0, 255, 136, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
  }
`;

const WaitingMessage = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  font-size: 1.2rem;
`;

const LeaveButton = styled.button`
  background: linear-gradient(45deg, #ff4444, #cc0000);
  margin-top: 20px;
`;

const OwlRevealModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border: 3px solid #ffd700;
  border-radius: 15px;
  padding: 30px;
  z-index: 2000;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.8);
  animation: owlReveal 0.5s ease;
  
  @keyframes owlReveal {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;

const ConsecutiveCastingInfo = styled.div`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #ffd700;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  text-align: center;
  color: #ffd700;
  font-weight: bold;
`;

function GameBoard({ socket, playerData, gameData, owlSpell, consecutiveCasting, onStartGame, onLeaveGame }) {
  const [targetingSpell, setTargetingSpell] = useState(null);
  const [availableTargets, setAvailableTargets] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleSelectTarget = (data) => {
      setTargetingSpell(data);
      setAvailableTargets(data.availableTargets);
    };

    socket.on('selectTarget', handleSelectTarget);

    return () => {
      socket.off('selectTarget', handleSelectTarget);
    };
  }, [socket]);

  if (!gameData || !playerData) {
    return (
      <WaitingMessage>
        Loading game data...
      </WaitingMessage>
    );
  }

  const isCurrentPlayer = gameData.gameState.currentPlayerId === playerData.playerId;
  const gameInProgress = gameData.gameState.state === 'IN_PROGRESS';
  const gameWaiting = gameData.gameState.state === 'WAITING';

  const handleCastSpell = (spellNumber) => {
    if (socket && isCurrentPlayer) {
      socket.emit('castSpell', {
        gameId: playerData.gameId,
        playerId: playerData.playerId,
        spellNumber: parseInt(spellNumber)
      });
    }
  };

  const handleTargetSelect = (targetId) => {
    if (socket && targetingSpell) {
      socket.emit('applyTargetedSpell', {
        gameId: playerData.gameId,
        playerId: playerData.playerId,
        spellNumber: targetingSpell.spellNumber,
        targetId
      });
      setTargetingSpell(null);
      setAvailableTargets([]);
    }
  };

  const handleEndTurn = () => {
    if (socket && isCurrentPlayer) {
      socket.emit('endTurn', {
        gameId: playerData.gameId,
        playerId: playerData.playerId
      });
    }
  };

  if (gameWaiting) {
    return (
      <WaitingMessage>
        <h2>🎮 Game Lobby</h2>
        <p>Players: {gameData.otherPlayers.length + 1}</p>
        <p>Waiting for more players to join...</p>
        <p>Game ID: <strong>{playerData.gameId}</strong></p>
        
        {gameData.otherPlayers.length >= 1 && (
          <button onClick={onStartGame} style={{ margin: '20px 10px' }}>
            Start Game
          </button>
        )}
        
        <LeaveButton onClick={onLeaveGame}>
          Leave Game
        </LeaveButton>

        <div style={{ marginTop: '30px', textAlign: 'left' }}>
          <h3>Players in lobby:</h3>
          <ul>
            <li>{gameData.player.name} (You)</li>
            {gameData.otherPlayers.map(player => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </div>
      </WaitingMessage>
    );
  }

  return (
    <GameContainer>
      <MainGameArea>
        <GameInfo gameData={gameData} />
        
        <CurrentPlayerIndicator isCurrentPlayer={isCurrentPlayer}>
          {isCurrentPlayer ? 
            '🌟 Your Turn! Cast a spell or end your turn' : 
            `Waiting for ${gameData.otherPlayers.find(p => p.id === gameData.gameState.currentPlayerId)?.name || 'another player'}'s turn...`
          }
        </CurrentPlayerIndicator>

        <PlayersContainer>
          {gameData.otherPlayers.map(player => (
            <PlayerHand 
              key={player.id} 
              player={player} 
              isOtherPlayer={true}
              isCurrentPlayer={player.id === gameData.gameState.currentPlayerId}
            />
          ))}
        </PlayersContainer>

        {targetingSpell && (
          <TargetSelector
            spell={targetingSpell}
            availableTargets={availableTargets}
            onTargetSelect={handleTargetSelect}
            onCancel={() => {
              setTargetingSpell(null);
              setAvailableTargets([]);
            }}
          />
        )}
      </MainGameArea>

      <Sidebar>
        <PlayerHand 
          player={gameData.player} 
          isOtherPlayer={false}
          isCurrentPlayer={isCurrentPlayer}
        />

        <FaceDownSpells 
          faceDownSpellDetails={gameData.player.faceDownSpellDetails}
        />

        <GameActions>
          <h3>🎯 Actions</h3>
          
          {isCurrentPlayer && consecutiveCasting.castCount > 0 && (
            <ConsecutiveCastingInfo>
              🔥 Consecutive Casting: {consecutiveCasting.castCount}/5
              <br />
              Next spell must be ≥ {consecutiveCasting.lastSpellNumber}
            </ConsecutiveCastingInfo>
          )}
          
          {gameInProgress && (
            <>
              <SpellCaster 
                onCastSpell={handleCastSpell}
                disabled={!isCurrentPlayer || !!targetingSpell}
                consecutiveCasting={consecutiveCasting}
              />
              
              {isCurrentPlayer && !targetingSpell && (
                <button 
                  onClick={handleEndTurn}
                  style={{ 
                    marginTop: '15px',
                    background: 'linear-gradient(45deg, #ff8800, #ff6600)'
                  }}
                >
                  End Turn
                </button>
              )}
            </>
          )}

          <LeaveButton onClick={onLeaveGame}>
            Leave Game
          </LeaveButton>
        </GameActions>
      </Sidebar>
      
      {owlSpell && (
        <OwlRevealModal>
          <h2>🦉 Owl Spell Revealed!</h2>
          <p>You secretly took spell <strong>{owlSpell}</strong> from the pool.</p>
          <p><em>This message will disappear in 5 seconds...</em></p>
        </OwlRevealModal>
      )}
      
      <GameResults 
        gameData={gameData}
        onNewGame={() => {
          // Could implement new game functionality
          console.log('New game requested');
        }}
        onLeaveGame={onLeaveGame}
      />
    </GameContainer>
  );
}

export default GameBoard;