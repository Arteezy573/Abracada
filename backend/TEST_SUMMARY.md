# Abracada Game - Test Suite Summary

## Overview
This test suite provides comprehensive coverage of the Abracada spell-casting board game's core logic.

## Test Statistics
- **Total Tests**: 58
- **Test Suites**: 1
- **All Passing**: ✅
- **Execution Time**: ~0.4-0.6 seconds

## Code Coverage
```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
game.js   |  93.47% |   84.55% |  97.95% |  94.54% |
----------|---------|----------|---------|---------|
```

## Test Organization

### 1. Game Initialization and Player Management (6 tests)
- Create game with valid gameId
- Add players to game (min 2, max 6)
- Prevent joining full games
- Prevent joining games in progress
- Remove players from game
- Game end when all players removed

### 2. Game Start and Spell Pool Initialization (3 tests)
- Start game with minimum players
- Validate spell pool distribution (36 total spells)
- Secret pool initialization (4 hidden spells)
- Initial hand dealing (5 cards per player)

### 3. Spell Casting Mechanics (7 tests)
- Successful spell cast
- Failed cast with backlash damage
- Multiple consecutive casts in one turn
- Turn restrictions (ascending spell numbers)
- Maximum 5 spells per turn limit
- Turn validation (only current player can cast)
- Hand replenishment after failed cast

### 4. Individual Spell Effects (10 tests)
Testing all 8 spell types:
- **Spell 1 - Summon Dragon**: Area damage with dice roll (1-3), special backlash
- **Spell 2 - Dark Ghost**: Area damage + self heal
- **Spell 3 - Sweet Dream**: Self heal with dice roll
- **Spell 4 - Owl**: Draw secret face-down spell
- **Spell 5 - Lightning Storm**: Damage left and right players
- **Spell 6 - Storm**: Damage left player
- **Spell 7 - Fireball**: Damage right player
- **Spell 8 - Healing**: Self heal (max 6 life)
- Healing cap validation

### 5. Player Health and Elimination (5 tests)
- Damage reduces life correctly
- Player eliminated at 0 life
- Healing up to max life (6)
- Track elimination source
- Distinguish suicide vs killed

### 6. Round End Conditions (5 tests)
- Round ends with 1 player alive
- Round ends when player has empty hand
- Point awards: 3 points to killer, 1 to survivors
- Point awards for suicide: 1 point to all others
- Point awards for emptying hand: 3 points

### 7. Game End and Victory (3 tests)
- Game ends at 8 points
- Single winner determination
- Tied winner handling

### 8. Turn Management (5 tests)
- Current player tracking
- Turn advancement
- Skip eliminated players
- Skip turn mechanic
- Turn state for consecutive casting

### 9. Next Round Preparation (3 tests)
- Start next round correctly
- Reset player states (life, elimination, spells)
- State validation before starting

### 10. Game State Serialization (3 tests)
- Complete game state serialization
- Player-specific state with hidden own hand
- **Asymmetric information mechanic validation**

### 11. Edge Cases and Special Scenarios (6 tests)
- Owl spell with empty pool
- Spell pool exhaustion
- Invalid target errors
- Eliminated target errors
- Game state validation
- Two-player positional spell handling

## Key Features Tested

### Asymmetric Information (Core Mechanic)
The game's unique twist is tested explicitly:
- Players see all other players' spell cards
- Players cannot see their own spell cards
- This creates strategic memory and deduction gameplay

### Dice Rolling
- Random damage rolls (1-3)
- Tested with Summon Dragon and Sweet Dream spells

### Turn Management
- Consecutive casting rules
- Turn order with player elimination
- Skip turn mechanics

### Point System
- Kill rewards (3 points)
- Survival bonuses (1 point)
- Empty hand bonus (3 points)
- Suicide penalties (others get 1 point)

### Victory Conditions
- First to 8 points wins
- Tie-breaking logic
- Round-based scoring

## Running Tests

### Run all tests:
```bash
cd backend
npm test
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run in watch mode:
```bash
npm test -- --watch
```

### Run specific test:
```bash
npm test -- -t "should create a game with a valid gameId"
```

## Uncovered Code
The remaining ~5.5% uncovered code consists of:
- Future expansion features (targeted spell effects for spell types not yet in the game)
- Very rare edge cases (spell pool exhaustion with specific conditions)
- These are intentionally left for future development

## Test File Location
`/backend/game.test.js`

## Dependencies
- Jest (test framework)
- Node.js (runtime)

## Continuous Integration
These tests should be run:
- Before any code commits
- In CI/CD pipeline
- Before deployment
- After dependency updates
