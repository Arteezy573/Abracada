import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  font-family: 'Arial', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #ffd700, #ffed4a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'game'
  const [playerData, setPlayerData] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [owlSpell, setOwlSpell] = useState(null);
  const [consecutiveCasting, setConsecutiveCasting] = useState({
    canCast: true,
    castCount: 0,
    lastSpellNumber: 0,
    maxCasts: 5
  });

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('gameCreated', (data) => {
      setPlayerData(data);
      setGameData(data.playerState);
      setGameState('game');
    });

    newSocket.on('gameJoined', (data) => {
      setPlayerData(data);
      setGameData(data.playerState);
      setGameState('game');
    });

    newSocket.on('gameState', (data) => {
      console.log('Received gameState update:', data);
      console.log('Player life in update:', data.player?.life);
      setGameData(data);
    });

    newSocket.on('gameStarted', (data) => {
      console.log('Game started:', data.message);
    });

    newSocket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
    });

    newSocket.on('playerLeft', (data) => {
      console.log('Player left:', data);
    });

    newSocket.on('spellCast', (data) => {
      console.log('Spell cast:', data);
      
      // Update consecutive casting state
      if (data.result.success && data.playerId === playerData?.playerId) {
        setConsecutiveCasting({
          canCast: data.result.canContinue || false,
          castCount: data.result.castCount || 0,
          lastSpellNumber: data.result.lastSpellNumber || 0,
          maxCasts: 5
        });
      }
    });

    newSocket.on('owlSpellRevealed', (data) => {
      console.log('Owl spell revealed:', data);
      setOwlSpell(data.secretSpell);
      // Clear after 5 seconds
      setTimeout(() => setOwlSpell(null), 5000);
    });

    newSocket.on('targetedSpellApplied', (data) => {
      console.log('Targeted spell applied:', data);
    });

    newSocket.on('turnEnded', (data) => {
      console.log('Turn ended:', data);
      // Reset consecutive casting when turn ends
      setConsecutiveCasting({
        canCast: true,
        castCount: 0,
        lastSpellNumber: 0,
        maxCasts: 5
      });
    });

    newSocket.on('selectTarget', (data) => {
      // This will be handled by GameBoard component
      console.log('Select target:', data);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => newSocket.close();
  }, []);

  const createGame = (playerName) => {
    if (socket) {
      socket.emit('createGame', { playerName });
    }
  };

  const joinGame = (gameId, playerName) => {
    if (socket) {
      socket.emit('joinGame', { gameId, playerName });
    }
  };

  const startGame = () => {
    if (socket && playerData) {
      socket.emit('startGame', {
        gameId: playerData.gameId,
        playerId: playerData.playerId
      });
    }
  };

  const leaveGame = () => {
    setGameState('lobby');
    setPlayerData(null);
    setGameData(null);
  };

  return (
    <AppContainer>
      <Title>🎭 Abracada 🔮</Title>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ff4444', 
          padding: '10px', 
          borderRadius: '5px', 
          margin: '10px 0',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {gameState === 'lobby' ? (
        <Lobby 
          onCreateGame={createGame}
          onJoinGame={joinGame}
        />
      ) : (
        <GameBoard 
          socket={socket}
          playerData={playerData}
          gameData={gameData}
          owlSpell={owlSpell}
          consecutiveCasting={consecutiveCasting}
          onStartGame={startGame}
          onLeaveGame={leaveGame}
        />
      )}
    </AppContainer>
  );
}

export default App;