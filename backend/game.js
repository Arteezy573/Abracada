const { v4: uuidv4 } = require('uuid');
const { SPELLS, GAME_STATES, PLAYER_STATES, GAME_CONFIG, DICE_CONFIG } = require('../shared/types');

class Game {
  constructor(gameId) {
    this.id = gameId || uuidv4();
    this.state = GAME_STATES.WAITING;
    this.players = new Map();
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.spellPool = [];
    this.secretPool = []; // Hidden spells not available to players
    this.lastAction = null;
    this.createdAt = new Date();
    // Turn state for consecutive casting
    this.currentTurn = {
      playerId: null,
      castCount: 0,
      lastSpellNumber: 0,
      maxCasts: 5
    };
  }

  // Player management
  addPlayer(playerId, playerName) {
    if (this.players.size >= GAME_CONFIG.MAX_PLAYERS) {
      throw new Error('Game is full');
    }
    
    if (this.state !== GAME_STATES.WAITING) {
      throw new Error('Cannot join game in progress');
    }

    const player = {
      id: playerId,
      name: playerName,
      life: GAME_CONFIG.STARTING_LIFE,
      points: 0,
      hand: [], // Spells they own (hidden from them)
      castSpells: [], // Spells they've successfully cast this round
      faceDownSpells: [], // Owl cards collected (face-down spells)
      state: PLAYER_STATES.ACTIVE,
      skipNextTurn: false
    };

    this.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.players.size === 0) {
      this.state = GAME_STATES.GAME_END;
    }
  }

  // Game initialization
  startGame() {
    if (this.players.size < GAME_CONFIG.MIN_PLAYERS) {
      throw new Error(`Need at least ${GAME_CONFIG.MIN_PLAYERS} players to start`);
    }

    this.state = GAME_STATES.IN_PROGRESS;
    this.initializeSpellPool();
    this.dealInitialHands();
    this.currentPlayerIndex = 0;
  }

  initializeSpellPool() {
    this.spellPool = [];
    this.secretPool = [];
    
    // Create spell deck with specific distribution (36 total spells)
    GAME_CONFIG.SPELL_DISTRIBUTION.forEach((count, index) => {
      const spellType = index + 1; // Spell types are 1-8
      for (let copy = 0; copy < count; copy++) {
        this.spellPool.push(spellType);
      }
    });
    
    // Shuffle the complete deck
    this.shuffleArray(this.spellPool);
    
    // Move SECRET_POOL_SIZE spells to secret pool (not available to players)
    for (let i = 0; i < GAME_CONFIG.SECRET_POOL_SIZE; i++) {
      if (this.spellPool.length > 0) {
        this.secretPool.push(this.spellPool.pop());
      }
    }
  }

  dealInitialHands() {
    const playerArray = Array.from(this.players.values());
    
    // Deal HAND_SIZE cards to each player
    playerArray.forEach(player => {
      player.hand = [];
      for (let i = 0; i < GAME_CONFIG.HAND_SIZE && this.spellPool.length > 0; i++) {
        player.hand.push(this.spellPool.pop());
      }
    });
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Dice rolling function (1-3)
  rollDice() {
    return Math.floor(Math.random() * (DICE_CONFIG.MAX_ROLL - DICE_CONFIG.MIN_ROLL + 1)) + DICE_CONFIG.MIN_ROLL;
  }

  // Replenish player hand to 5 cards after failed cast
  replenishPlayerHand(playerId) {
    const player = this.players.get(playerId);
    if (!player) return 0;

    let cardsDrawn = 0;
    while (player.hand.length < GAME_CONFIG.HAND_SIZE && this.spellPool.length > 0) {
      player.hand.push(this.spellPool.pop());
      cardsDrawn++;
    }
    return cardsDrawn;
  }

  // Helper methods for positional targeting
  getLeftPlayer(currentPlayerId) {
    const playerArray = Array.from(this.players.values()).filter(p => p.state === PLAYER_STATES.ACTIVE);
    const currentIndex = playerArray.findIndex(p => p.id === currentPlayerId);
    const leftIndex = (currentIndex - 1 + playerArray.length) % playerArray.length;
    return playerArray[leftIndex];
  }

  getRightPlayer(currentPlayerId) {
    const playerArray = Array.from(this.players.values()).filter(p => p.state === PLAYER_STATES.ACTIVE);
    const currentIndex = playerArray.findIndex(p => p.id === currentPlayerId);
    const rightIndex = (currentIndex + 1) % playerArray.length;
    return playerArray[rightIndex];
  }

  // Turn management
  getCurrentPlayer() {
    const playerArray = Array.from(this.players.values());
    return playerArray[this.currentPlayerIndex];
  }

  nextTurn() {
    const playerArray = Array.from(this.players.values());
    
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerArray.length;
    } while (playerArray[this.currentPlayerIndex].state === PLAYER_STATES.ELIMINATED);
    
    const currentPlayer = this.getCurrentPlayer();
    
    // Reset turn state for new player
    this.currentTurn = {
      playerId: currentPlayer.id,
      castCount: 0,
      lastSpellNumber: 0,
      maxCasts: 5
    };
    
    // Handle skip turn effect
    if (currentPlayer.skipNextTurn) {
      currentPlayer.skipNextTurn = false;
      this.nextTurn(); // Skip this player's turn
    }
  }

  // Spell casting logic
  attemptCast(playerId, spellNumber) {
    if (this.state !== GAME_STATES.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Initialize turn state if needed
    if (this.currentTurn.playerId !== playerId) {
      this.currentTurn = {
        playerId,
        castCount: 0,
        lastSpellNumber: 0,
        maxCasts: 5
      };
    }

    // Check casting rules for consecutive casts
    if (this.currentTurn.castCount > 0) {
      if (spellNumber < this.currentTurn.lastSpellNumber) {
        throw new Error('Subsequent spells must have number >= previous spell');
      }
      if (this.currentTurn.castCount >= this.currentTurn.maxCasts) {
        throw new Error('Maximum 5 spells per turn');
      }
    }

    const player = this.players.get(playerId);
    
    // Check if player has this spell
    const spellIndex = player.hand.findIndex(spell => spell === spellNumber);
    
    if (spellIndex === -1) {
      // Failed cast - apply backlash
      let backlashDamage = 1; // Default backlash
      let diceRoll = null;
      
      // Special backlash for Summon Dragon (spell 1)
      if (spellNumber === 1) {
        diceRoll = this.rollDice();
        backlashDamage = diceRoll;
      }
      
      this.damagePlayer(playerId, backlashDamage, playerId); // Self-inflicted damage
      
      // Replenish hand after failed cast
      const cardsDrawn = this.replenishPlayerHand(playerId);
      
      this.lastAction = {
        type: 'FAILED_CAST',
        playerId,
        spellNumber,
        damage: backlashDamage,
        diceRoll,
        isBacklash: spellNumber === 1,
        cardsDrawn
      };
      
      this.nextTurn();
      this.checkRoundEnd();
      return { success: false, damage: backlashDamage, diceRoll, cardsDrawn };
    } else {
      // Successful cast - remove spell and apply effect
      const castSpell = player.hand.splice(spellIndex, 1)[0];
      player.castSpells.push(castSpell);
      
      // Update turn state
      this.currentTurn.castCount++;
      this.currentTurn.lastSpellNumber = spellNumber;
      
      const spellEffect = this.applySpellEffect(playerId, spellNumber);
      this.lastAction = {
        type: 'SUCCESSFUL_CAST',
        playerId,
        spellNumber,
        effect: spellEffect,
        castCount: this.currentTurn.castCount,
        canContinue: this.currentTurn.castCount < this.currentTurn.maxCasts
      };
      
      this.checkRoundEnd();
      return { 
        success: true, 
        effect: spellEffect, 
        castCount: this.currentTurn.castCount,
        canContinue: this.currentTurn.castCount < this.currentTurn.maxCasts,
        lastSpellNumber: this.currentTurn.lastSpellNumber
      };
    }
  }

  applySpellEffect(casterId, spellNumber) {
    const spell = SPELLS[spellNumber];
    const caster = this.players.get(casterId);
    const effect = { type: spell.effect };

    switch (spell.effect) {
      case 'SUMMON_DRAGON':
        // All other players lose Life Points equal to dice roll
        const diceRoll = this.rollDice();
        const targets = [];
        this.players.forEach(player => {
          if (player.id !== casterId && player.state === PLAYER_STATES.ACTIVE) {
            this.damagePlayer(player.id, diceRoll, casterId);
            targets.push(player.id);
          }
        });
        effect.targets = targets;
        effect.damage = diceRoll;
        effect.diceRoll = diceRoll;
        break;
        
      case 'DARK_GHOST':
        // All other players lose 1 Life Point, caster recovers 1 Life Point
        const ghostTargets = [];
        this.players.forEach(player => {
          if (player.id !== casterId && player.state === PLAYER_STATES.ACTIVE) {
            this.damagePlayer(player.id, 1, casterId);
            ghostTargets.push(player.id);
          }
        });
        this.healPlayer(casterId, 1);
        effect.targets = ghostTargets;
        effect.damage = 1;
        effect.heal = 1;
        break;
        
      case 'SWEET_DREAM':
        // Recover Life Points equal to dice roll
        const healRoll = this.rollDice();
        this.healPlayer(casterId, healRoll);
        effect.heal = healRoll;
        effect.diceRoll = healRoll;
        break;
        
      case 'OWL':
        // Secretly look at 1 card from spell pool, place face-down
        if (this.spellPool.length > 0) {
          const secretSpell = this.spellPool.pop();
          caster.faceDownSpells.push(secretSpell);
          effect.spellTaken = secretSpell;
          effect.spellsRemaining = this.spellPool.length;
        } else {
          effect.spellTaken = null;
          effect.message = 'No spells remaining in pool';
        }
        break;
        
      case 'LIGHTNING_STORM':
        // Players on left and right lose 1 Life Point
        const leftPlayer = this.getLeftPlayer(casterId);
        const rightPlayer = this.getRightPlayer(casterId);
        
        const stormTargets = [];
        if (leftPlayer && leftPlayer.id !== casterId) {
          this.damagePlayer(leftPlayer.id, 1, casterId);
          stormTargets.push(leftPlayer.id);
        }
        if (rightPlayer && rightPlayer.id !== casterId && rightPlayer.id !== leftPlayer.id) {
          this.damagePlayer(rightPlayer.id, 1, casterId);
          stormTargets.push(rightPlayer.id);
        }
        
        effect.targets = stormTargets;
        effect.damage = 1;
        break;
        
      case 'STORM':
        // Player on left loses 1 Life Point
        const leftTarget = this.getLeftPlayer(casterId);
        if (leftTarget && leftTarget.id !== casterId) {
          this.damagePlayer(leftTarget.id, 1, casterId);
          effect.target = leftTarget.id;
          effect.damage = 1;
        } else {
          effect.message = 'No valid left target';
        }
        break;
        
      case 'FIREBALL':
        // Player on right loses 1 Life Point
        const rightTarget = this.getRightPlayer(casterId);
        if (rightTarget && rightTarget.id !== casterId) {
          this.damagePlayer(rightTarget.id, 1, casterId);
          effect.target = rightTarget.id;
          effect.damage = 1;
        } else {
          effect.message = 'No valid right target';
        }
        break;
        
      case 'HEALING':
        // Gain 1 Life Point (max 6)
        this.healPlayer(casterId, 1);
        effect.heal = 1;
        break;
    }

    return effect;
  }

  // Apply targeted spell effects
  applyTargetedEffect(casterId, spellNumber, targetId) {
    const spell = SPELLS[spellNumber];
    const target = this.players.get(targetId);
    
    if (!target || target.state === PLAYER_STATES.ELIMINATED) {
      throw new Error('Invalid target');
    }

    switch (spell.effect) {
      case 'DAMAGE_SINGLE':
        this.damagePlayer(targetId, spell.damage, casterId);
        break;
        
      case 'DRAIN_LIFE':
        this.damagePlayer(targetId, spell.damage, casterId);
        this.healPlayer(casterId, spell.heal);
        break;
        
      case 'SKIP_TURN':
        target.skipNextTurn = true;
        break;
    }
  }

  // Player health management
  damagePlayer(playerId, damage, causedBy = null) {
    const player = this.players.get(playerId);
    if (!player) return 0;
    
    console.log(`Damaging player ${playerId} (${player.name}) for ${damage} damage. Life before: ${player.life}`);
    player.life = Math.max(0, player.life - damage);
    console.log(`Life after: ${player.life}`);
    
    if (player.life === 0) {
      player.state = PLAYER_STATES.ELIMINATED;
      player.eliminatedBy = causedBy; // Track who eliminated this player
      player.eliminatedByType = causedBy === playerId ? 'SUICIDE' : 'KILLED';
      
      // Set last action to show elimination
      this.lastAction = {
        type: 'PLAYER_ELIMINATED',
        playerId: player.id,
        playerName: player.name,
        eliminatedByType: player.eliminatedByType,
        killerName: causedBy !== playerId ? this.players.get(causedBy)?.name : null
      };
    }
    
    return damage;
  }

  healPlayer(playerId, healAmount) {
    const player = this.players.get(playerId);
    player.life = Math.min(GAME_CONFIG.MAX_LIFE, player.life + healAmount);
  }

  // Round and game end logic
  checkRoundEnd() {
    const alivePlayers = Array.from(this.players.values())
      .filter(player => player.state === PLAYER_STATES.ACTIVE);
    const eliminatedThisRound = Array.from(this.players.values())
      .filter(player => player.state === PLAYER_STATES.ELIMINATED && player.eliminatedBy !== undefined);
    
    // Check if someone died this turn
    if (eliminatedThisRound.length > 0) {
      this.endRound();
      return;
    }
    
    // Check if any player has empty hand (round ends immediately)
    const emptyHandPlayers = alivePlayers.filter(p => p.hand.length === 0);
    if (emptyHandPlayers.length > 0) {
      this.roundEndReason = 'EMPTY_HAND';
      this.emptyHandPlayer = emptyHandPlayers[0]; // First player to empty hand
      this.endRound();
      return;
    }
    
    // Check if only one player remains
    if (alivePlayers.length <= 1) {
      this.endRound();
    }
  }

  endRound() {
    this.state = GAME_STATES.ROUND_END;
    
    const alivePlayers = Array.from(this.players.values())
      .filter(player => player.state === PLAYER_STATES.ACTIVE);
    const eliminatedThisRound = Array.from(this.players.values())
      .filter(player => player.state === PLAYER_STATES.ELIMINATED && player.eliminatedBy !== undefined);
    
    // Award points based on victory conditions
    if (eliminatedThisRound.length > 0) {
      // Someone died this round
      eliminatedThisRound.forEach(deadPlayer => {
        if (deadPlayer.eliminatedByType === 'SUICIDE') {
          // Magic backfire - other players get 1 point each
          this.players.forEach(player => {
            if (player.id !== deadPlayer.id) {
              player.points += 1;
            }
          });
        } else {
          // Player death - killer gets 3 points, survivors get 1 point
          const killer = this.players.get(deadPlayer.eliminatedBy);
          if (killer) {
            killer.points += 3;
          }
          alivePlayers.forEach(player => {
            if (player.id !== deadPlayer.eliminatedBy) {
              player.points += 1;
            }
          });
        }
      });
    } else if (this.roundEndReason === 'EMPTY_HAND' && this.emptyHandPlayer) {
      // Player emptied their hand - they get 3 points
      this.emptyHandPlayer.points += 3;
    } else if (this.spellPool.length === 0) {
      // Spell cards exhausted - first to empty hand gets 3 points
      const emptyHandPlayers = alivePlayers.filter(p => p.hand.length === 0);
      if (emptyHandPlayers.length > 0) {
        emptyHandPlayers[0].points += 3; // First player to empty hand
      }
    }
    
    // Check for game winner(s)
    const playersAt8Plus = Array.from(this.players.values())
      .filter(player => player.points >= GAME_CONFIG.WINNING_POINTS);
    
    if (playersAt8Plus.length > 0) {
      this.determineGameWinner(playersAt8Plus);
    } else {
      // Stay in ROUND_END state - don't automatically start next round
      // The frontend/server should call startNextRound() when ready
    }
  }

  determineGameWinner(playersAt8Plus) {
    this.state = GAME_STATES.GAME_END;
    
    // Find the highest total points
    const maxPoints = Math.max(...playersAt8Plus.map(p => p.points));
    const leadingPlayers = playersAt8Plus.filter(p => p.points === maxPoints);
    
    if (leadingPlayers.length === 1) {
      // Single winner
      this.winner = leadingPlayers[0];
      this.winnerType = 'SINGLE';
    } else {
      // Multiple players tied at 8+ points
      // Check who got more points THIS ROUND
      const roundPointsGained = {}; // We'd need to track this during the round
      
      // For now, if tied, they all win together
      this.winners = leadingPlayers;
      this.winnerType = 'TIED';
    }
  }

  // Method to start the next round (called manually)
  startNextRound() {
    if (this.state !== GAME_STATES.ROUND_END) {
      throw new Error('Cannot start next round - game is not in round end state');
    }
    
    this.prepareNextRound();
  }

  prepareNextRound() {
    this.round++;
    this.state = GAME_STATES.IN_PROGRESS;
    
    // Clear round end tracking
    this.roundEndReason = null;
    this.emptyHandPlayer = null;
    
    // Reset players for next round
    this.players.forEach(player => {
      player.life = GAME_CONFIG.STARTING_LIFE;
      player.state = PLAYER_STATES.ACTIVE;
      player.skipNextTurn = false;
      player.castSpells = [];
      player.faceDownSpells = []; // Reset face-down spells for new round
      // Clear elimination tracking
      delete player.eliminatedBy;
      delete player.eliminatedByType;
    });
    
    this.initializeSpellPool();
    this.dealInitialHands();
    this.currentPlayerIndex = 0;
  }

  // Game state serialization for clients
  getGameState() {
    return {
      id: this.id,
      state: this.state,
      round: this.round,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.id,
      spellPoolSize: this.spellPool.length,
      secretPoolSize: this.secretPool.length,
      totalSpellsRemaining: this.spellPool.length + this.secretPool.length,
      lastAction: this.lastAction,
      roundEndReason: this.roundEndReason,
      emptyHandPlayerName: this.emptyHandPlayer?.name,
      winner: this.winner,
      winners: this.winners,
      winnerType: this.winnerType
    };
  }

  getPlayerState(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    // Player sees everyone else's hands, but not their own
    const otherPlayers = Array.from(this.players.values())
      .filter(p => p.id !== playerId)
      .map(p => ({
        id: p.id,
        name: p.name,
        life: p.life,
        points: p.points,
        hand: p.hand, // Other players' hands are visible
        castSpells: p.castSpells.length,
        faceDownSpells: p.faceDownSpells.length, // Number of face-down spells (Owl cards)
        state: p.state
      }));

    return {
      player: {
        id: player.id,
        name: player.name,
        life: player.life,
        points: player.points,
        hand: [], // Own hand is hidden
        handSize: player.hand.length,
        castSpells: player.castSpells.length,
        faceDownSpells: player.faceDownSpells.length, // Number of face-down spells (Owl cards)
        faceDownSpellDetails: player.faceDownSpells, // Actual spell numbers for the player to see
        state: player.state
      },
      otherPlayers,
      gameState: this.getGameState()
    };
  }
}

module.exports = Game;