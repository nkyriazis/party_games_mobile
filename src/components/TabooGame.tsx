import React, { useState, useEffect } from 'react';
import { useTaboo } from '../hooks/useTaboo';
import { TabooCardComponent } from '../components/TabooCard';
import { motion } from 'framer-motion';
import { Player } from '../contexts/PlayersContext';
import { Team } from '../hooks/useTeams';

export const TabooGame: React.FC<{
  players: Player[],
  teams: Team[],
  updateTeamScore: (teamId: string, delta: number) => void,
  getTeamForPlayer: (playerId: string) => Team | undefined,
  getNextUpPlayer: () => { player: Player | undefined, team: Team | undefined },
  onBack: () => void,
  setCurrentGame: (game: 'setup' | 'hub' | 'tick-tack-boom' | 'taboo') => void
}> = ({ players, teams: _teams, updateTeamScore, getTeamForPlayer, getNextUpPlayer, onBack, setCurrentGame }) => {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'select-player' | 'game' | 'round-over'>('select-player');

  // Get team ID for the active player
  const activeTeamId = getTeamForPlayer(activePlayerId || '')?.id || '';

  const {
    currentCard,
    timeLeft,
    isPlaying,
    isGameOver,
    startRound,
    handleCorrect,
    handleTaboo,
    handlePass
  } = useTaboo(activeTeamId, updateTeamScore);

  // Get next up player info for display
  const nextUp = getNextUpPlayer();

  // Reset active player when changing game state
  useEffect(() => {
    if (gameState === 'select-player' || gameState === 'round-over') {
      setActivePlayerId(null);
    }
  }, [gameState]);

  const playersInTeams = players.filter(p => getTeamForPlayer(p.id));

  // Setup screen - select player to describe words
  if (gameState === 'select-player') {
    // No players in teams - show warning screen
    if (playersInTeams.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
          <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 max-w-md text-center mb-8">
            <h2 className="text-2xl font-black text-amber-500 mb-4">Teams Required</h2>
            <p className="text-slate-300 mb-4">
              Taboo requires players to be assigned to teams for scoring.
            </p>
            <p className="text-sm text-slate-500">
              Players not in teams cannot play Taboo.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl text-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            Back to Hub
          </button>
          <button
            onClick={() => setCurrentGame('setup')}
            className="mt-4 text-slate-500 hover:text-white transition-colors text-sm"
          >
            Go to Setup →
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
        <p className="text-slate-400 mb-8 text-center">Select the player who will describe the words</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {playersInTeams.map(player => (
            <button
              key={player.id}
              onClick={() => {
                setActivePlayerId(player.id);
                setGameState('game');
              }}
              className="p-4 rounded-2xl border-2 border-slate-700 bg-slate-800 hover:border-red-500 transition-all text-xl font-bold"
              style={{ color: player.color }}
            >
              {player.name}
              <div className="text-xs font-normal text-slate-500">
                {getTeamForPlayer(player.id)?.name}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-8 text-slate-500 hover:text-white transition-colors"
        >
          ← Back to Hub
        </button>
      </div>
    );
  }

  // Game screen - the actual taboo gameplay
  if (gameState === 'game') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        {/* Current Turn Display */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="inline-block bg-slate-800/80 backdrop-blur px-6 py-2 rounded-full border border-slate-700">
            <span className="font-bold text-lg">
              {players.find(p => p.id === activePlayerId)?.name}
            </span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="text-sm text-slate-500">
              Next: {nextUp.player ? `${nextUp.player.name} (${nextUp.team?.name})` : 'End of game'}
            </span>
          </div>
        </div>

        {!isPlaying && !isGameOver && (
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-8">Ready, {players.find(p => p.id === activePlayerId)?.name}?</h2>
            <button
              onClick={startRound}
              className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white text-2xl font-black rounded-full shadow-xl transition-all active:scale-95"
            >
              START ROUND
            </button>
            <button
              onClick={() => setGameState('select-player')}
              className="mt-4 text-slate-500 hover:text-white transition-colors text-sm"
            >
              Change Player
            </button>
          </div>
        )}

        {isPlaying && currentCard && (
          <TabooCardComponent
            card={currentCard}
            timeLeft={timeLeft}
            onCorrect={handleCorrect}
            onTaboo={handleTaboo}
            onPass={handlePass}
          />
        )}

        {isGameOver && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-16"
          >
            <h2 className="text-5xl font-black text-red-500 mb-4">TIME'S UP!</h2>
            <p className="text-xl text-slate-400 mb-8">Round ended for {players.find(p => p.id === activePlayerId)?.name}</p>
            <button
              onClick={() => setGameState('round-over')}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
            >
              Next Round
            </button>
          </motion.div>
        )}

        <button
          onClick={onBack}
          className="fixed bottom-8 left-8 text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Exit Game
        </button>
      </div>
    );
  }

  // Round over screen - just a transition state
  if (gameState === 'round-over') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h2 className="text-3xl font-black text-red-500 mb-8">Round Complete!</h2>
        <p className="text-slate-400 mb-8">Get ready for the next player</p>

        <button
          onClick={() => setGameState('select-player')}
          className="px-12 py-4 bg-white text-slate-950 font-black rounded-2xl text-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          Select Next Player
        </button>

        <button
          onClick={onBack}
          className="mt-8 text-slate-500 hover:text-white transition-colors"
        >
          ← Back to Hub
        </button>
      </div>
    );
  }

  return null;
};
