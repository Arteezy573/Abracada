import React, { useState } from 'react';
import styled from 'styled-components';

const LobbyContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
`;

const Description = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  line-height: 1.6;
  color: #f0f0f0;
`;

const FormSection = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #ffd700;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
`;

const GameRules = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 10px;
  margin-top: 30px;
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const RulesList = styled.ul`
  margin: 10px 0;
  padding-left: 20px;
`;

function Lobby({ onCreateGame, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName.trim());
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (playerName.trim() && gameId.trim()) {
      onJoinGame(gameId.trim(), playerName.trim());
    }
  };

  return (
    <LobbyContainer>
      <Description>
        Welcome to <strong>Abracada</strong>! A magical spell-casting game where you can see everyone else's spells... but not your own! 🎭
      </Description>

      <FormSection>
        <SectionTitle>🆕 Create New Game</SectionTitle>
        <form onSubmit={handleCreateGame}>
          <InputGroup>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
            <button type="submit">Create Game</button>
          </InputGroup>
        </form>
      </FormSection>

      <FormSection>
        <SectionTitle>🚪 Join Existing Game</SectionTitle>
        <form onSubmit={handleJoinGame}>
          <InputGroup>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Enter game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
            />
            <button type="submit">Join Game</button>
          </InputGroup>
        </form>
      </FormSection>

      <GameRules>
        <h3>📜 How to Play</h3>
        <RulesList>
          <li><strong>Goal:</strong> Be the first wizard to reach 8 points!</li>
          <li><strong>The Twist:</strong> You can see other players' spell tiles, but not your own</li>
          <li><strong>Your Turn:</strong> Guess and cast a spell you think you have</li>
          <li><strong>Success:</strong> If you have the spell, it casts and takes effect</li>
          <li><strong>Failure:</strong> If you don't have it, you lose 1 life</li>
          <li><strong>Points:</strong> Earn points by casting spells and surviving rounds</li>
          <li><strong>Strategy:</strong> Watch what others can see, remember what you've cast!</li>
        </RulesList>
        
        <h4>🔮 Spell Types (1-8) & Distribution:</h4>
        <RulesList>
          <li><strong>1 - 🐉 Summon Dragon (1 card):</strong> All other players lose life = dice roll (1-3). Backlash if failed!</li>
          <li><strong>2 - 👻 Dark Ghost (2 cards):</strong> All other players lose 1 life. You recover 1 life</li>
          <li><strong>3 - 💤 Sweet Dream (3 cards):</strong> Recover life = dice roll (1-3)</li>
          <li><strong>4 - 🦉 Owl (4 cards):</strong> Take 1 spell face-down. +1 point per Owl at round end</li>
          <li><strong>5 - ⚡ Lightning Storm (5 cards):</strong> Left & right players lose 1 life</li>
          <li><strong>6 - 🌪️ Storm (6 cards):</strong> Left player loses 1 life</li>
          <li><strong>7 - 🔥 Fireball (7 cards):</strong> Right player loses 1 life</li>
          <li><strong>8 - 💚 Healing (8 cards):</strong> You gain 1 life (max 6)</li>
        </RulesList>
        
        <p><strong>🎲 Dice:</strong> Only rolls 1-3 | <strong>❤️ Life:</strong> Max 6 points | <strong>🔒 Secret Pool:</strong> 4 cards hidden from all players</p>
      </GameRules>
    </LobbyContainer>
  );
}

export default Lobby;