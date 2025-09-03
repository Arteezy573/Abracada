# 🎭 Abracada - Spell Casting Board Game

A magical multiplayer board game where you can see everyone else's spells... but not your own! Built with React and Node.js with real-time multiplayer support.

## 🎯 Game Overview

**Abracada** is a strategic spell-casting game with asymmetric information. Players are apprentice wizards competing to become the next Court Magician by casting spells and surviving rounds.

### 🧙 The Twist
- You can see all other players' spell tiles
- You **cannot** see your own spell tiles
- Success depends on memory, deduction, and strategic thinking

### 🏆 How to Win
- First player to reach **8 points** wins
- Earn points by:
  - Successfully casting spells (1 point per spell)
  - Surviving rounds (2 points for survivors)

## 🔮 Spell Types & Distribution

1. **🐉 Summon Dragon (1 card)** - All other players lose Life Points = dice roll (1-3). **Backlash**: If failed cast, you lose Life Points = dice roll
2. **👻 Dark Ghost (2 cards)** - All other players lose 1 Life Point. You recover 1 Life Point  
3. **💤 Sweet Dream (3 cards)** - Recover Life Points = dice roll (1-3)
4. **🦉 Owl (4 cards)** - Secretly take 1 spell from pool face-down. +1 point per face-down spell at round end
5. **⚡ Lightning Storm (5 cards)** - Players on your left and right lose 1 Life Point
6. **🌪️ Storm (6 cards)** - Player on your left loses 1 Life Point
7. **🔥 Fireball (7 cards)** - Player on your right loses 1 Life Point
8. **💚 Healing (8 cards)** - You gain 1 Life Point (maximum 6 Life Points)

**Special Mechanics:**
- 🎲 **Dice rolls**: Only result in 1, 2, or 3
- ❤️ **Life cap**: Maximum 6 Life Points (healing cannot exceed this)
- 🔒 **Secret Pool**: 4 spells are randomly hidden before dealing (unavailable to all players)

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. **Clone/download the project**
2. **Install dependencies**:
   ```bash
   npm run install-all
   ```

### Running the Game
1. **Start both server and client**:
   ```bash
   npm run dev
   ```
   
   Or run them separately:
   ```bash
   # Terminal 1 - Backend
   npm run backend
   
   # Terminal 2 - Frontend  
   npm run frontend
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Create or join a game**:
   - Enter your player name
   - Create a new game or join with a game ID
   - Wait for other players (2-6 players supported)
   - Start the game when ready!

## 🎮 How to Play

### Game Setup
- **Total Spells**: 36 spell tiles (1+2+3+4+5+6+7+8=36 total distribution)
- **Secret Pool**: 4 spells are randomly removed and hidden before dealing
- **Player Hands**: Each player receives 5 spell tiles (face outward - visible to others, hidden from you)
- **Life Points**: Everyone starts with 6 life points (maximum 6)
- **Spell Pool**: Remaining spells after dealing and secret pool removal form the available pool

### On Your Turn
1. **Guess a spell** you think you have (1-8)
2. **If you have it:**
   - The spell is cast successfully
   - Apply the spell's effect
   - You can continue casting the same spell number if you think you have more
   - Or end your turn
3. **If you don't have it:**
   - Lose 1 life
   - Your turn ends immediately

### Round End
A round ends when:
- Only one player remains alive, OR
- The spell pool is empty

### Victory Conditions
- **Immediate win:** First to 8 points
- **Round scoring:** Survivors get 2 points + 1 point per spell cast

## 🎯 Strategy Tips

1. **Pay attention** to what others can see in your hand
2. **Remember** what you've successfully cast
3. **Observe** other players' successful/failed casts to deduce their hands
4. **Consider** spell effects carefully - some affect everyone!
5. **Balance** offense with survival - staying alive earns points
6. **Use memory** - track what spells have been played

## 🏗️ Technical Details

### Backend (Node.js + Express + Socket.io)
- Real-time multiplayer using WebSockets
- Complete game state management
- Spell effect processing
- Player session handling

### Frontend (React + Styled Components)
- Responsive game interface
- Real-time updates
- Intuitive spell casting interface
- Visual spell targeting system

### Architecture
```
Abracada/
├── backend/           # Node.js server
│   ├── server.js     # Main server + Socket.io
│   ├── game.js       # Game logic class
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js        # Main app
│   │   └── index.js
│   └── package.json
├── shared/            # Common types/constants
│   └── types.js
└── package.json       # Root package for scripts
```

## 🎨 Features

- **Real-time multiplayer** with instant updates
- **Responsive design** that works on desktop and mobile
- **Visual spell system** with color-coded spells
- **Asymmetric information** - core game mechanic
- **Targeting system** for targeted spells
- **Game state persistence** during play sessions
- **Spectator-friendly** interface showing all public information

## 🔧 Development

### Available Scripts
- `npm run dev` - Run both frontend and backend
- `npm run frontend` - Run React development server
- `npm run backend` - Run Node.js server with nodemon
- `npm run install-all` - Install all dependencies

### Ports
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 🎭 Game Rules Reference

### Turn Structure
1. Declare a spell number (1-8)
2. If you have it: Cast successfully, apply effects
3. If you don't: Lose 1 life, turn ends
4. Continue casting same number OR end turn

### Life & Defense
- Start with 6 life
- Defense tokens block damage 1:1
- At 0 life: eliminated from round

### Spell Effects
- **Damage spells** require target selection
- **Area effects** hit multiple players
- **Self-effects** (Stone Skin, Dark Ritual) are immediate
- **Control effects** (Blizzard) affect turn order

Enjoy playing Abracada! 🎭✨