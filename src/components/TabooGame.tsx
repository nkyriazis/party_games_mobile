import React, { useState } from 'react';
import { useTaboo } from '../hooks/useTaboo';
import { TabooCardComponent } from '../components/TabooCard';
import { motion } from 'framer-motion';
import { Player } from '../hooks/usePlayers';
import { Team } from '../hooks/useTeams';

export const TabooGame: React.FC<{
  players: Player[],
  teams: Team[],
  removeTeam: (id: string) => void,
  addPlayerToTeam: (playerId: string, teamId: string) => void,
  removePlayerFromTeam: (playerId: string, teamId: string) => void,
  updateTeamScore: (teamId: string, delta: number) => void,
  getTeamForPlayer: (playerId: string) => Team | undefined,
  getNextUpPlayer: () => { player: Player | undefined, team: Team | undefined },
  onBack: () => void
}> = ({ players, teams, removeTeam, addPlayerToTeam, removePlayerFromTeam, updateTeamScore, getTeamForPlayer, getNextUpPlayer, onBack }) => {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [teamSelectionState, setTeamSelectionState] = useState<'setup' | 'team-select' | 'game'>(
    teams.length > 0
      ? 'team-select'  // Teams exist, show player selection
      : 'setup'  // No teams, show setup
  );

  const {
    currentCard,
    timeLeft,
    isPlaying,
    isGameOver,
    startRound,
    handleCorrect,
    handleTaboo,
    handlePass
  } = useTaboo(getTeamForPlayer(activePlayerId || '')?.id || '', updateTeamScore);

  // Get next up player info for display
  const nextUp = getNextUpPlayer();

  if (teamSelectionState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
        <div className="space-y-6 w-full max-w-md">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-400">Teams</h2>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {teams.map(team => (
                <motion.div
                  layout="position"
                  key={team.id}
                  className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="font-bold text-sm text-white">{team.name}</span>
                    <span className="text-xs text-slate-500">({team.playerIds.length} players)</span>
                  </div>
                  <button onClick={() => removeTeam(team.id)} className="text-slate-600 hover:text-red-500 p-2">
                    <span className="text-xs">REMOVE</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-400">Players</h2>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {players.map(player => {
                const team = getTeamForPlayer(player.id);
                return (
                  <div key={player.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                      <span className="font-bold text-sm text-white">{player.name}</span>
                    </div>
                    <select
                      value={team?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          addPlayerToTeam(player.id, e.target.value);
                        } else {
                          removePlayerFromTeam(player.id, team?.id || '');
                        }
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-red-500 outline-none"
                    >
                      <option value="">No team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => teams.length >= 2 && players.some(p => getTeamForPlayer(p.id)) ? setTeamSelectionState('team-select') : null}
          disabled={teams.length < 2 || !players.some(p => getTeamForPlayer(p.id))}
          className={`mt-8 px-12 py-4 rounded-2xl font-black text-xl transition-all ${
            teams.length >= 2 && players.some(p => getTeamForPlayer(p.id))
              ? 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          START GAME
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

  if (teamSelectionState === 'team-select' && !activePlayerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
        <p className="text-slate-400 mb-8 text-center">Select the player who will describe the words</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {players
            .filter(p => getTeamForPlayer(p.id))
            .map(player => (
              <button
                key={player.id}
                onClick={() => setActivePlayerId(player.id)}
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
        {players.filter(p => getTeamForPlayer(p.id)).length === 0 && (
          <p className="text-red-400 mb-4">Assign players to teams first!</p>
        )}
        <button
          onClick={onBack}
          className="mt-8 text-slate-500 hover:text-white transition-colors"
        >
          ← Back to Setup
        </button>
      </div>
    );
  }

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
            onClick={() => {
              setActivePlayerId(null);
              setTeamSelectionState('team-select');
            }}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
          >
            Select Next Player
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
};
