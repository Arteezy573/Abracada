const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for games and players
const games = new Map();
const playerSessions = new Map(); // playerId -> { gameId, socketId }

const PORT = process.env.PORT || 5000;

// Utility functions
function broadcastToGame(gameId, event, data) {
  const game = games.get(gameId);
  if (!game) return;
  
  game.players.forEach((player, playerId) => {
    const session = playerSessions.get(playerId);
    if (session && session.socketId) {
      const socket = io.sockets.sockets.get(session.socketId);
      if (socket) {
        socket.emit(event, data);
      }
    }
  });
}

function sendPlayerState(playerId) {
  const session = playerSessions.get(playerId);
  if (!session) return;
  
  const game = games.get(session.gameId);
  if (!game) return;
  
  const socket = io.sockets.sockets.get(session.socketId);
  if (!socket) return;
  
  const playerState = game.getPlayerState(playerId);
  socket.emit('gameState', playerState);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create or join game
  socket.on('createGame', (data) => {
    try {
      const { playerName } = data;
      const gameId = uuidv4();
      const playerId = uuidv4();
      
      const game = new Game(gameId);
      game.addPlayer(playerId, playerName);
      games.set(gameId, game);
      
      playerSessions.set(playerId, {
        gameId,
        socketId: socket.id
      });
      
      socket.join(gameId);
      
      socket.emit('gameCreated', {
        gameId,
        playerId,
        playerState: game.getPlayerState(playerId)
      });
      
      console.log(`Game created: ${gameId}, Player: ${playerName}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('joinGame', (data) => {
    try {
      const { gameId, playerName } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      const playerId = uuidv4();
      game.addPlayer(playerId, playerName);
      
      playerSessions.set(playerId, {
        gameId,
        socketId: socket.id
      });
      
      socket.join(gameId);
      
      // Send initial state to new player
      socket.emit('gameJoined', {
        gameId,
        playerId,
        playerState: game.getPlayerState(playerId)
      });
      
      // Notify all players about the new player
      broadcastToGame(gameId, 'playerJoined', {
        playerName,
        playerCount: game.players.size
      });
      
      // Send updated game state to all players
      game.players.forEach((_, pid) => sendPlayerState(pid));
      
      console.log(`Player ${playerName} joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start game
  socket.on('startGame', (data) => {
    try {
      const { gameId, playerId } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      game.startGame();
      
      broadcastToGame(gameId, 'gameStarted', {
        message: 'Game has started!'
      });
      
      // Send updated game state to all players
      game.players.forEach((_, pid) => sendPlayerState(pid));
      
      console.log(`Game ${gameId} started`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Cast spell
  socket.on('castSpell', (data) => {
    try {
      const { gameId, playerId, spellNumber } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      const result = game.attemptCast(playerId, spellNumber);
      
      // If spell requires target selection, wait for target
      if (result.success && result.effect.requiresTarget) {
        socket.emit('selectTarget', {
          spellNumber,
          effect: result.effect,
          availableTargets: Array.from(game.players.values())
            .filter(p => p.id !== playerId && p.state === 'ACTIVE')
            .map(p => ({ id: p.id, name: p.name }))
        });
      } else {
        // Special handling for Owl spell - send secret info only to caster
        if (result.success && spellNumber === 4 && result.effect.spellTaken) {
          // Send secret card info only to the caster
          socket.emit('owlSpellRevealed', {
            secretSpell: result.effect.spellTaken
          });
          
          // Send public spell result to all players (without secret info)
          const publicResult = { ...result };
          if (publicResult.effect) {
            publicResult.effect = { ...publicResult.effect };
            delete publicResult.effect.spellTaken; // Remove secret info from broadcast
          }
          
          broadcastToGame(gameId, 'spellCast', {
            playerId,
            spellNumber,
            result: publicResult
          });
        } else {
          // Normal spell - broadcast to all players
          broadcastToGame(gameId, 'spellCast', {
            playerId,
            spellNumber,
            result
          });
        }
        
        // Send updated game state to all players
        console.log('Sending updated game state to all players after spell cast');
        game.players.forEach((_, pid) => {
          console.log(`Sending state to player ${pid}, current life: ${game.players.get(pid)?.life}`);
          sendPlayerState(pid);
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Apply targeted spell
  socket.on('applyTargetedSpell', (data) => {
    try {
      const { gameId, playerId, spellNumber, targetId } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      game.applyTargetedEffect(playerId, spellNumber, targetId);
      
      broadcastToGame(gameId, 'targetedSpellApplied', {
        casterId: playerId,
        targetId,
        spellNumber
      });
      
      // Send updated game state to all players
      game.players.forEach((_, pid) => sendPlayerState(pid));
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Continue turn (cast another spell of the same type)
  socket.on('continueTurn', (data) => {
    try {
      const { gameId, playerId } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Player can continue their turn
      socket.emit('turnContinued', {
        message: 'You can cast another spell or end your turn'
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start next round  
  socket.on('startNextRound', (data) => {
    try {
      const { gameId, playerId } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      game.startNextRound();
      
      broadcastToGame(gameId, 'nextRoundStarted', {
        round: game.round
      });
      
      // Send updated game state to all players
      game.players.forEach((_, pid) => sendPlayerState(pid));
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // End turn
  socket.on('endTurn', (data) => {
    try {
      const { gameId, playerId } = data;
      const game = games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      game.nextTurn();
      
      // Check if round should end after turn ends
      game.checkRoundEnd();
      
      broadcastToGame(gameId, 'turnEnded', {
        previousPlayerId: playerId,
        nextPlayerId: game.getCurrentPlayer()?.id
      });
      
      // Send updated game state to all players
      game.players.forEach((_, pid) => sendPlayerState(pid));
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and remove player session
    for (const [playerId, session] of playerSessions.entries()) {
      if (session.socketId === socket.id) {
        const game = games.get(session.gameId);
        if (game) {
          game.removePlayer(playerId);
          
          // If game is empty, remove it
          if (game.players.size === 0) {
            games.delete(session.gameId);
          } else {
            // Notify other players
            broadcastToGame(session.gameId, 'playerLeft', {
              playerId,
              playerCount: game.players.size
            });
          }
        }
        playerSessions.delete(playerId);
        break;
      }
    }
  });
});

// REST API endpoints for game information
app.get('/api/games', (req, res) => {
  const gameList = Array.from(games.values()).map(game => ({
    id: game.id,
    state: game.state,
    playerCount: game.players.size,
    round: game.round
  }));
  res.json(gameList);
});

app.get('/api/games/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game.getGameState());
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };