import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayers, Player } from './hooks/usePlayers';
import { useTeams, Team } from './hooks/useTeams';
import {
  X, Trophy, Users, Trash2, Maximize, Minimize,
  Gamepad2, Bomb, MessageSquare, ArrowLeft
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

import { TickTackBoomGame } from './components/TickTackBoomGame';
import { TabooGame } from './components/TabooGame';
import { SetupPage } from './components/SetupPage';

type GameId = 'setup' | 'hub' | 'tick-tack-boom' | 'taboo';

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameId>('setup');
  const { players, addPlayer, removePlayer, incrementScore, resetScores } = usePlayers();
  const { teams, removeTeam, addPlayerToTeam, removePlayerFromTeam, updateTeamScore, getTeamForPlayer, getNextUpPlayer, resetScores: resetTeamScores } = useTeams(players);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Automatic fullscreen on native launch
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setBackgroundColor({ color: '#020617' });
      StatusBar.hide();
      NavigationBar.hide();
      setIsFullscreen(true);
    }
  }, []);

  const toggleFullscreen = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        if (!isFullscreen) {
          await StatusBar.hide();
          await NavigationBar.hide();
          setIsFullscreen(true);
        } else {
          await StatusBar.show();
          await NavigationBar.show();
          setIsFullscreen(false);
        }
      } catch (err) {
        console.error('Fullscreen toggle error:', err);
      }
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check if setup is complete
  const isSetupComplete = players.length >= 2 && teams.length >= 2 && players.every(p => teams.some(t => t.playerIds.includes(p.id)));

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans select-none overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {currentGame === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SetupPage
              onComplete={() => setCurrentGame('hub')}
            />
          </motion.div>
        )}

        {currentGame === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full"
          >
            <header className="py-8 text-center relative">
              <button
                onClick={toggleFullscreen}
                className="absolute right-0 top-8 p-2 text-slate-500 hover:text-white transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <h1 className="text-4xl font-black text-red-600 tracking-tighter uppercase italic">Party Hub</h1>
              <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Multi-Game Edition</p>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto pr-2">
              <section className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="text-red-500" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Players</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {players.map(player => (
                    <motion.div
                      layout="position"
                      key={player.id}
                      className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                        <span className="font-bold text-lg">{player.name}</span>
                        <span className="text-xs text-slate-500">({teams.find(t => t.playerIds.includes(player.id))?.name || 'No team'})</span>
                      </div>
                      <button onClick={() => removePlayer(player.id)} className="text-slate-600 hover:text-red-500 p-2">
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Gamepad2 className="text-red-500" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Select Game</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setCurrentGame('tick-tack-boom')}
                    className="group relative overflow-hidden p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-red-600 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-600 rounded-2xl text-white group-hover:scale-110 transition-transform">
                          <Bomb size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-black uppercase italic">Tick Tack Boom</h3>
                          <p className="text-xs text-slate-500">Fast-paced word bomb</p>
                        </div>
                      </div>
                      <ArrowLeft className="rotate-180 text-slate-600 group-hover:text-white transition-colors" size={20} />
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentGame('taboo')}
                    className="group relative overflow-hidden p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-red-600 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white group-hover:scale-110 transition-transform">
                          <MessageSquare size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-black uppercase italic">Taboo</h3>
                          <p className="text-xs text-slate-500">Forbidden word challenge</p>
                        </div>
                      </div>
                      <ArrowLeft className="rotate-180 text-slate-600 group-hover:text-white transition-colors" size={20} />
                    </div>
                  </button>
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="text-slate-500" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Setup Status</h2>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-sm text-slate-400 mb-4">
                    {isSetupComplete
                      ? 'Setup complete! You have 2+ players assigned to 2+ teams.'
                      : 'Please complete setup: create at least 2 players and 2 teams, then assign players to teams.'}
                  </p>
                  <button
                    onClick={() => setCurrentGame('setup')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors text-sm"
                  >
                    Review Setup
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {currentGame === 'tick-tack-boom' && (
          <TickTackBoomGame
            players={players}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            incrementScore={incrementScore}
            onBack={() => setCurrentGame('hub')}
          />
        )}

        {currentGame === 'taboo' && (
          <TabooGame
            players={players}
            teams={teams}
            removeTeam={removeTeam}
            addPlayerToTeam={addPlayerToTeam}
            removePlayerFromTeam={removePlayerFromTeam}
            updateTeamScore={updateTeamScore}
            getTeamForPlayer={getTeamForPlayer}
            getNextUpPlayer={getNextUpPlayer}
            onBack={() => setCurrentGame('hub')}
          />
        )}
      </AnimatePresence>

      {players.length > 0 && currentGame === 'hub' && (
        <Scoreboard players={players} teams={teams} onReset={() => { resetScores(); resetTeamScores(); }} />
      )}

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function Scoreboard({ players, teams, onReset }: { players: Player[], teams: Team[], onReset: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800 p-4 rounded-full shadow-2xl border border-slate-700 active:scale-90 transition-all z-40"
      >
        <Trophy size={24} className="text-yellow-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic tracking-tight">HALL OF SHAME</h2>
              <button onClick={() => setIsOpen(false)} className="p-2"><X /></button>
            </div>

            {/* Team Scores */}
            {teams.length > 0 && (
              <section className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Team Standings</h3>
                <div className="space-y-2">
                  {sortedTeams.map((team, idx) => (
                    <div key={team.id} className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 font-black text-xl">{idx + 1}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-bold text-lg">{team.name}</span>
                      </div>
                      <div className="bg-red-600/20 text-red-500 px-4 py-1 rounded-full font-black">
                        {team.score} PTS
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Player Scores */}
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Individual Standings</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player, idx) => {
                  const team = teams.find(t => t.playerIds.includes(player.id));
                  return (
                    <div key={player.id} className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 font-black text-xl">{idx + 1}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.color }} />
                        <span className="font-bold text-xl">{player.name}</span>
                        {team && <span className="text-xs text-slate-500">({team.name})</span>}
                      </div>
                      <div className="bg-red-600/20 text-red-500 px-4 py-1 rounded-full font-black">
                        {player.score} PTS
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              onClick={() => { if (confirm('Είστε σίγουροι;')) { onReset(); setIsOpen(false); } }}
              className="mt-8 flex items-center justify-center space-x-2 text-slate-600 font-bold hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
              <span>ΜΗΔΕΝΙΣΜΟΣ ΣΚΟΡ</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
