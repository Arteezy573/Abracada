// Game constants and types
const SPELLS = {
  1: {
    name: "Summon Dragon",
    description: "All other players lose Life Points equal to dice roll (1-3). Backlash: If failed, you lose Life Points equal to dice roll",
    effect: "SUMMON_DRAGON",
    hasBacklash: true
  },
  2: {
    name: "Dark Ghost",
    description: "All other players lose 1 Life Point. You recover 1 Life Point",
    effect: "DARK_GHOST",
    damage: 1,
    heal: 1
  },
  3: {
    name: "Sweet Dream",
    description: "Recover Life Points equal to dice roll (1-3)",
    effect: "SWEET_DREAM"
  },
  4: {
    name: "Owl",
    description: "Secretly look at 1 card from spell pool, place it face-down. +1 point per face-down spell at round end",
    effect: "OWL"
  },
  5: {
    name: "Lightning Storm",
    description: "Players on your left and right lose 1 Life Point",
    effect: "LIGHTNING_STORM",
    damage: 1
  },
  6: {
    name: "Storm",
    description: "Player on your left loses 1 Life Point",
    effect: "STORM",
    damage: 1
  },
  7: {
    name: "Fireball",
    description: "Player on your right loses 1 Life Point",
    effect: "FIREBALL",
    damage: 1
  },
  8: {
    name: "Healing",
    description: "You gain 1 Life Point (max 6)",
    effect: "HEALING",
    heal: 1
  }
};

const GAME_STATES = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS', 
  ROUND_END: 'ROUND_END',
  GAME_END: 'GAME_END'
};

const PLAYER_STATES = {
  ACTIVE: 'ACTIVE',
  ELIMINATED: 'ELIMINATED',
  SKIPPED: 'SKIPPED'
};

// Default game settings  
const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  STARTING_LIFE: 6,
  MAX_LIFE: 6, // Maximum life points for healing effects
  WINNING_POINTS: 8,
  HAND_SIZE: 5,
  TOTAL_SPELLS: 36, // Total spells in the game (1+2+3+4+5+6+7+8=36)
  SECRET_POOL_SIZE: 4, // Number of spells moved to secret pool before dealing
  SPELL_DISTRIBUTION: [1, 2, 3, 4, 5, 6, 7, 8] // Number of each spell type 1-8
};

// Dice configuration
const DICE_CONFIG = {
  MIN_ROLL: 1,
  MAX_ROLL: 3 // Dice only rolls 1-3
};

module.exports = {
  SPELLS,
  GAME_STATES,
  PLAYER_STATES,
  GAME_CONFIG,
  DICE_CONFIG
};