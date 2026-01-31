const Game = require('./game');
const { GAME_STATES, PLAYER_STATES, GAME_CONFIG } = require('../shared/types');

describe('Game Class', () => {
  describe('Game initialization and player management', () => {
    test('should create a game with a valid gameId', () => {
      const game = new Game('test-game-id');
      expect(game.id).toBe('test-game-id');
      expect(game.state).toBe(GAME_STATES.WAITING);
      expect(game.players.size).toBe(0);
    });

    test('should add players to game', () => {
      const game = new Game();
      const player1 = game.addPlayer('player1', 'Alice');
      const player2 = game.addPlayer('player2', 'Bob');
      
      expect(game.players.size).toBe(2);
      expect(player1.name).toBe('Alice');
      expect(player1.life).toBe(GAME_CONFIG.STARTING_LIFE);
      expect(player1.points).toBe(0);
      expect(player2.name).toBe('Bob');
    });

    test('should prevent adding more than MAX_PLAYERS', () => {
      const game = new Game();
      for (let i = 0; i < GAME_CONFIG.MAX_PLAYERS; i++) {
        game.addPlayer(`player${i}`, `Player${i}`);
      }
      
      expect(() => {
        game.addPlayer('player7', 'Player7');
      }).toThrow('Game is full');
    });

    test('should prevent joining game in progress', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      expect(() => {
        game.addPlayer('player3', 'Charlie');
      }).toThrow('Cannot join game in progress');
    });

    test('should remove players from game', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      
      game.removePlayer('player1');
      expect(game.players.size).toBe(1);
      expect(game.players.has('player1')).toBe(false);
    });

    test('should set game to GAME_END when all players removed', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.removePlayer('player1');
      
      expect(game.state).toBe(GAME_STATES.GAME_END);
    });
  });

  describe('Game start and spell pool initialization', () => {
    test('should start game with minimum players', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      
      game.startGame();
      expect(game.state).toBe(GAME_STATES.IN_PROGRESS);
    });

    test('should not start game without minimum players', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      
      expect(() => {
        game.startGame();
      }).toThrow(`Need at least ${GAME_CONFIG.MIN_PLAYERS} players to start`);
    });

    test('should initialize spell pool with correct distribution', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      
      game.startGame();
      
      // Total spells should be 36 - 4 (secret) - 10 (dealt to 2 players)
      const totalSpells = game.spellPool.length + game.secretPool.length + 
                         Array.from(game.players.values()).reduce((sum, p) => sum + p.hand.length, 0);
      expect(totalSpells).toBe(GAME_CONFIG.TOTAL_SPELLS);
    });

    test('should move SECRET_POOL_SIZE spells to secret pool', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      
      game.startGame();
      expect(game.secretPool.length).toBe(GAME_CONFIG.SECRET_POOL_SIZE);
    });

    test('should deal HAND_SIZE cards to each player', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      
      game.startGame();
      
      game.players.forEach(player => {
        expect(player.hand.length).toBe(GAME_CONFIG.HAND_SIZE);
      });
    });
  });

  describe('Spell casting mechanics', () => {
    test('should successfully cast a spell player has', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const initialHandSize = player1.hand.length;
      const spellInHand = player1.hand[0];
      
      const result = game.attemptCast('player1', spellInHand);
      
      expect(result.success).toBe(true);
      expect(player1.castSpells).toContain(spellInHand);
      expect(player1.hand.length).toBe(initialHandSize - 1);
    });

    test('should fail cast and apply backlash if player does not have spell', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const initialLife = player1.life;
      
      // Find a spell number not in player's hand
      let spellNotInHand = 1;
      while (player1.hand.includes(spellNotInHand) && spellNotInHand <= 8) {
        spellNotInHand++;
      }
      
      const result = game.attemptCast('player1', spellNotInHand);
      
      expect(result.success).toBe(false);
      expect(player1.life).toBeLessThan(initialLife);
      expect(result.damage).toBeGreaterThan(0);
    });

    test('should allow multiple consecutive casts in one turn', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const spellInHand = player1.hand[0];
      
      const result1 = game.attemptCast('player1', spellInHand);
      expect(result1.success).toBe(true);
      expect(result1.castCount).toBe(1);
      
      // If player has another spell they can cast
      if (player1.hand.length > 0) {
        const nextSpell = player1.hand.find(s => s >= spellInHand);
        if (nextSpell) {
          const result2 = game.attemptCast('player1', nextSpell);
          expect(result2.success).toBe(true);
          expect(result2.castCount).toBe(2);
        }
      }
    });

    test('should enforce turn restrictions - subsequent spells must be >= previous', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      
      // Manually set up player hand for testing
      game.startGame();
      const player1 = game.players.get('player1');
      player1.hand = [3, 5, 7]; // Give specific spells
      
      // Cast spell 5 first
      game.attemptCast('player1', 5);
      
      // Try to cast spell 3 (lower than 5) - should fail with error
      expect(() => {
        game.attemptCast('player1', 3);
      }).toThrow('Subsequent spells must have number >= previous spell');
    });

    test('should limit maximum casts per turn to 5', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [1, 2, 3, 4, 5, 6]; // Give enough spells
      
      // Cast 5 spells
      game.attemptCast('player1', 1);
      game.attemptCast('player1', 2);
      game.attemptCast('player1', 3);
      game.attemptCast('player1', 4);
      game.attemptCast('player1', 5);
      
      // 6th cast should fail
      expect(() => {
        game.attemptCast('player1', 6);
      }).toThrow('Maximum 5 spells per turn');
    });

    test('should not allow casting when not your turn', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player2 = game.players.get('player2');
      const spellInHand = player2.hand[0];
      
      expect(() => {
        game.attemptCast('player2', spellInHand);
      }).toThrow('Not your turn');
    });

    test('should replenish hand to 5 cards after failed cast', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      
      // Remove a card so hand is not full
      player1.hand.pop();
      const initialHandSize = player1.hand.length;
      
      // Find a spell not in hand and attempt to cast it (will fail)
      let spellNotInHand = 1;
      while (player1.hand.includes(spellNotInHand) && spellNotInHand <= 8) {
        spellNotInHand++;
      }
      
      game.attemptCast('player1', spellNotInHand);
      
      // Hand should be replenished (if pool has cards)
      expect(player1.hand.length).toBeGreaterThanOrEqual(initialHandSize);
    });
  });

  describe('Individual spell effects', () => {
    test('Spell 1 (Summon Dragon) - should damage all other players with dice roll', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      const player3 = game.players.get('player3');
      
      player1.hand = [1]; // Give Summon Dragon
      const initialLife2 = player2.life;
      const initialLife3 = player3.life;
      
      const result = game.attemptCast('player1', 1);
      
      expect(result.success).toBe(true);
      expect(result.effect.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.effect.diceRoll).toBeLessThanOrEqual(3);
      expect(player2.life).toBe(initialLife2 - result.effect.diceRoll);
      expect(player3.life).toBe(initialLife3 - result.effect.diceRoll);
    });

    test('Spell 1 (Summon Dragon) - should have backlash damage on failed cast', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [2, 3, 4]; // No Summon Dragon
      const initialLife = player1.life;
      
      const result = game.attemptCast('player1', 1);
      
      expect(result.success).toBe(false);
      expect(result.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.diceRoll).toBeLessThanOrEqual(3);
      expect(player1.life).toBe(initialLife - result.diceRoll);
    });

    test('Spell 2 (Dark Ghost) - should damage all others and heal caster', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      const player3 = game.players.get('player3');
      
      player1.hand = [2]; // Give Dark Ghost
      player1.life = 5; // Set to less than max
      const initialLife2 = player2.life;
      const initialLife3 = player3.life;
      
      const result = game.attemptCast('player1', 2);
      
      expect(result.success).toBe(true);
      expect(player1.life).toBe(6); // Healed by 1
      expect(player2.life).toBe(initialLife2 - 1);
      expect(player3.life).toBe(initialLife3 - 1);
    });

    test('Spell 3 (Sweet Dream) - should heal caster by dice roll', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [3]; // Give Sweet Dream
      player1.life = 3; // Set to less than max
      
      const result = game.attemptCast('player1', 3);
      
      expect(result.success).toBe(true);
      expect(result.effect.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.effect.diceRoll).toBeLessThanOrEqual(3);
      expect(player1.life).toBe(Math.min(6, 3 + result.effect.diceRoll));
    });

    test('Spell 4 (Owl) - should draw face-down spell from pool', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [4]; // Give Owl
      const initialPoolSize = game.spellPool.length;
      
      const result = game.attemptCast('player1', 4);
      
      expect(result.success).toBe(true);
      if (initialPoolSize > 0) {
        expect(player1.faceDownSpells.length).toBe(1);
        expect(game.spellPool.length).toBe(initialPoolSize - 1);
      }
    });

    test('Spell 5 (Lightning Storm) - should damage left and right players', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      const player3 = game.players.get('player3');
      
      player1.hand = [5]; // Give Lightning Storm
      const initialLife2 = player2.life;
      const initialLife3 = player3.life;
      
      const result = game.attemptCast('player1', 5);
      
      expect(result.success).toBe(true);
      // In a 3-player game, left and right should be damaged
      expect(player2.life).toBeLessThan(initialLife2);
      expect(player3.life).toBeLessThan(initialLife3);
    });

    test('Spell 6 (Storm) - should damage left player', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player3 = game.players.get('player3');
      
      player1.hand = [6]; // Give Storm
      const initialLife = player3.life;
      
      const result = game.attemptCast('player1', 6);
      
      expect(result.success).toBe(true);
      expect(player3.life).toBe(initialLife - 1);
    });

    test('Spell 7 (Fireball) - should damage right player', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      player1.hand = [7]; // Give Fireball
      const initialLife = player2.life;
      
      const result = game.attemptCast('player1', 7);
      
      expect(result.success).toBe(true);
      expect(player2.life).toBe(initialLife - 1);
    });

    test('Spell 8 (Healing) - should heal caster by 1 (max 6)', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [8]; // Give Healing
      player1.life = 4;
      
      const result = game.attemptCast('player1', 8);
      
      expect(result.success).toBe(true);
      expect(player1.life).toBe(5);
    });

    test('Healing should not exceed max life of 6', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [8, 8]; // Give multiple Healing spells
      player1.life = 6; // Already at max
      
      const result = game.attemptCast('player1', 8);
      
      expect(result.success).toBe(true);
      expect(player1.life).toBe(6); // Should stay at max
    });
  });

  describe('Player health and elimination', () => {
    test('should reduce player life when damaged', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const initialLife = player1.life;
      
      game.damagePlayer('player1', 2);
      
      expect(player1.life).toBe(initialLife - 2);
    });

    test('should eliminate player at 0 life', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      
      game.damagePlayer('player1', 10); // More than max life
      
      expect(player1.life).toBe(0);
      expect(player1.state).toBe(PLAYER_STATES.ELIMINATED);
    });

    test('should heal player up to max life', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.life = 3;
      
      game.healPlayer('player1', 2);
      expect(player1.life).toBe(5);
      
      game.healPlayer('player1', 5);
      expect(player1.life).toBe(GAME_CONFIG.MAX_LIFE); // Should cap at 6
    });

    test('should track who eliminated a player', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player2 = game.players.get('player2');
      
      game.damagePlayer('player2', 10, 'player1');
      
      expect(player2.eliminatedBy).toBe('player1');
      expect(player2.eliminatedByType).toBe('KILLED');
    });

    test('should track self-elimination as SUICIDE', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      
      game.damagePlayer('player1', 10, 'player1');
      
      expect(player1.eliminatedByType).toBe('SUICIDE');
    });
  });

  describe('Round end conditions', () => {
    test('should end round when only 1 player alive', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      // Eliminate 2 players
      game.damagePlayer('player2', 10, 'player1');
      game.checkRoundEnd();
      
      expect(game.state).toBe(GAME_STATES.ROUND_END);
    });

    test('should end round when a player has empty hand', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = []; // Empty hand
      
      game.checkRoundEnd();
      
      expect(game.state).toBe(GAME_STATES.ROUND_END);
      expect(game.roundEndReason).toBe('EMPTY_HAND');
    });

    test('should award 3 points to killer and 1 point to survivors when player is killed', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      const player3 = game.players.get('player3');
      
      // Player 1 kills Player 3
      game.damagePlayer('player3', 10, 'player1');
      game.checkRoundEnd();
      
      expect(player1.points).toBe(3); // Killer gets 3 points
      expect(player2.points).toBe(1); // Survivor gets 1 point
      expect(player3.points).toBe(0); // Dead player gets 0 points
    });

    test('should award 1 point to all others when player dies by suicide', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      const player3 = game.players.get('player3');
      
      // Player 1 commits suicide (e.g., backlash)
      game.damagePlayer('player1', 10, 'player1');
      game.checkRoundEnd();
      
      expect(player1.points).toBe(0); // Dead player gets 0 points
      expect(player2.points).toBe(1); // Others get 1 point each
      expect(player3.points).toBe(1);
    });

    test('should award 3 points to player who empties hand', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = []; // Empty hand
      
      game.checkRoundEnd();
      
      expect(player1.points).toBe(3);
    });
  });

  describe('Game end and victory', () => {
    test('should end game when player reaches 8 points', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.points = 8;
      player1.hand = []; // Trigger round end
      
      game.checkRoundEnd();
      
      expect(game.state).toBe(GAME_STATES.GAME_END);
    });

    test('should determine single winner with highest points', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      player1.points = 10;
      player2.points = 5;
      
      game.determineGameWinner([player1, player2]);
      
      expect(game.state).toBe(GAME_STATES.GAME_END);
      expect(game.winner).toBe(player1);
      expect(game.winnerType).toBe('SINGLE');
    });

    test('should handle tied winners', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      player1.points = 10;
      player2.points = 10;
      
      game.determineGameWinner([player1, player2]);
      
      expect(game.state).toBe(GAME_STATES.GAME_END);
      expect(game.winners).toHaveLength(2);
      expect(game.winnerType).toBe('TIED');
    });
  });

  describe('Turn management', () => {
    test('should track current player correctly', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const currentPlayer = game.getCurrentPlayer();
      expect(currentPlayer).toBeDefined();
      expect(game.currentPlayerIndex).toBe(0);
    });

    test('should advance to next turn correctly', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const firstPlayer = game.getCurrentPlayer();
      game.nextTurn();
      const secondPlayer = game.getCurrentPlayer();
      
      expect(secondPlayer.id).not.toBe(firstPlayer.id);
      expect(game.currentPlayerIndex).toBe(1);
    });

    test('should skip eliminated players in turn order', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player2 = game.players.get('player2');
      player2.state = PLAYER_STATES.ELIMINATED;
      
      game.nextTurn(); // Should skip player2
      const currentPlayer = game.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('player2');
    });

    test('should handle skip turn mechanic', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.addPlayer('player3', 'Charlie');
      game.startGame();
      
      const player2 = game.players.get('player2');
      player2.skipNextTurn = true;
      
      game.nextTurn(); // Move to player2
      expect(player2.skipNextTurn).toBe(false);
      // Should skip player2's turn
      const currentPlayer = game.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('player2');
    });

    test('should reset turn state for new player', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [1, 2];
      
      game.attemptCast('player1', 1);
      expect(game.currentTurn.castCount).toBe(1);
      
      game.nextTurn();
      expect(game.currentTurn.castCount).toBe(0);
      expect(game.currentTurn.playerId).toBe('player2');
    });
  });

  describe('Next round preparation', () => {
    test('should start next round correctly', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      // End current round
      const player1 = game.players.get('player1');
      player1.hand = [];
      game.checkRoundEnd();
      
      expect(game.state).toBe(GAME_STATES.ROUND_END);
      expect(game.round).toBe(1);
      
      game.startNextRound();
      
      expect(game.state).toBe(GAME_STATES.IN_PROGRESS);
      expect(game.round).toBe(2);
    });

    test('should reset player states for next round', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      // Damage players and mark one as eliminated
      player1.life = 3;
      player2.life = 0;
      player2.state = PLAYER_STATES.ELIMINATED;
      player2.eliminatedBy = 'player1';
      player1.castSpells = [1, 2, 3];
      
      // End round and start next
      player1.hand = [];
      game.checkRoundEnd();
      game.startNextRound();
      
      // All players should be reset
      expect(player1.life).toBe(GAME_CONFIG.STARTING_LIFE);
      expect(player2.life).toBe(GAME_CONFIG.STARTING_LIFE);
      expect(player1.state).toBe(PLAYER_STATES.ACTIVE);
      expect(player2.state).toBe(PLAYER_STATES.ACTIVE);
      expect(player1.castSpells).toHaveLength(0);
      expect(player2.eliminatedBy).toBeUndefined();
    });

    test('should not start next round if not in ROUND_END state', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      expect(() => {
        game.startNextRound();
      }).toThrow('Cannot start next round - game is not in round end state');
    });
  });

  describe('Game state serialization', () => {
    test('should return complete game state', () => {
      const game = new Game('test-game');
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const gameState = game.getGameState();
      
      expect(gameState.id).toBe('test-game');
      expect(gameState.state).toBe(GAME_STATES.IN_PROGRESS);
      expect(gameState.round).toBe(1);
      expect(gameState.spellPoolSize).toBeGreaterThan(0);
      expect(gameState.currentPlayerId).toBe('player1');
    });

    test('should return player-specific state with hidden own hand', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const playerState = game.getPlayerState('player1');
      
      expect(playerState.player.id).toBe('player1');
      expect(playerState.player.hand).toHaveLength(0); // Own hand is hidden
      expect(playerState.player.handSize).toBe(GAME_CONFIG.HAND_SIZE);
      expect(playerState.otherPlayers).toHaveLength(1);
      expect(playerState.otherPlayers[0].hand.length).toBe(GAME_CONFIG.HAND_SIZE); // Others' hands visible
    });
  });

  describe('Edge cases and special scenarios', () => {
    test('Owl spell should handle empty spell pool gracefully', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      player1.hand = [4]; // Give Owl
      game.spellPool = []; // Empty the pool
      
      const result = game.attemptCast('player1', 4);
      
      expect(result.success).toBe(true);
      expect(result.effect.spellTaken).toBeNull();
      expect(result.effect.message).toBe('No spells remaining in pool');
    });

    test('should award points when spell pool exhausted and player has empty hand', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      // Empty spell pool and empty player1's hand
      game.spellPool = [];
      player1.hand = [];
      player2.hand = [1, 2];
      
      game.checkRoundEnd();
      
      expect(game.state).toBe(GAME_STATES.ROUND_END);
      expect(player1.points).toBe(3); // First to empty hand gets 3 points
    });

    test('applyTargetedEffect should throw error for invalid target', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      expect(() => {
        game.applyTargetedEffect('player1', 1, 'invalid-player-id');
      }).toThrow('Invalid target');
    });

    test('applyTargetedEffect should throw error for eliminated target', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player2 = game.players.get('player2');
      player2.state = PLAYER_STATES.ELIMINATED;
      
      expect(() => {
        game.applyTargetedEffect('player1', 1, 'player2');
      }).toThrow('Invalid target');
    });

    test('should not throw error when game is in GAME_END state', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      game.state = GAME_STATES.GAME_END;
      
      expect(() => {
        game.attemptCast('player1', 1);
      }).toThrow('Game is not in progress');
    });

    test('should handle two-player game with positional spells', () => {
      const game = new Game();
      game.addPlayer('player1', 'Alice');
      game.addPlayer('player2', 'Bob');
      game.startGame();
      
      const player1 = game.players.get('player1');
      const player2 = game.players.get('player2');
      
      // In a 2-player game, left and right point to the same player
      player1.hand = [5]; // Lightning Storm
      const initialLife = player2.life;
      
      const result = game.attemptCast('player1', 5);
      
      expect(result.success).toBe(true);
      // Player 2 is both left and right, but should only be damaged once
      expect(player2.life).toBeLessThan(initialLife);
    });
  });
});
