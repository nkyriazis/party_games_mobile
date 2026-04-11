import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, GameState, DieMode } from '../hooks/useGame';
import { Player } from '../hooks/usePlayers';
import { Bomb, Play, X } from 'lucide-react';
import { soundManager } from '../utils/soundManager';

export const TickTackBoomGame: React.FC<{
  players: Player[],
  incrementScore: (id: string) => void,
  onBack: () => void
}> = ({ players, incrementScore, onBack }) => {
  const {
    timeLeft,
    isTicking,
    currentGram,
    currentDieMode,
    gameState,
    startGame,
    startRound,
    confirmExplosion
  } = useGame();

  const [isSetup, setIsSetup] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  // Audio control loop
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (isTicking && timeLeft !== null) {
      const tickInterval = Math.max(0.1, (timeLeft / 90) * 1.0);
      const now = Date.now();
      if (now - lastTickRef.current > tickInterval * 1000) {
        soundManager.playTick(440 + (90 - timeLeft) * 5);
        lastTickRef.current = now;
      }
    }
  }, [isTicking, timeLeft]);

  useEffect(() => {
    if (gameState === GameState.EXPLODED) {
      soundManager.playExplosion();
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
    }
  }, [gameState]);

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleBackToHub = () => {
    setIsSetup(true);
    setSelectedPlayers(new Set());
    onBack();
  };

  // Setup screen - player selection with checkboxes
  if (isSetup) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="setup"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full"
        >
          <header className="py-6 text-center relative">
            <h1 className="text-4xl font-black text-red-600 tracking-tighter uppercase italic">Tick Tack Boom</h1>
            <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Party Edition</p>
            <p className="text-sm text-slate-400 mt-4">
              Select players for this round
            </p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {players.map(player => (
              <motion.div
                layout="position"
                key={player.id}
                onClick={() => togglePlayerSelection(player.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlayers.has(player.id)
                    ? 'bg-red-600/10 border-red-600'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPlayers.has(player.id) ? 'border-red-600 bg-red-600' : 'border-slate-600'
                  }`}>
                    {selectedPlayers.has(player.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`font-bold text-lg ${selectedPlayers.has(player.id) ? 'text-white' : 'text-slate-300'}`}>{player.name}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <footer className="py-6 space-y-3">
            {selectedPlayers.size >= 2 ? (
              <button
                onClick={() => {
                  setIsSetup(false);
                  startGame();
                }}
                className="w-full bg-white text-slate-950 font-black py-5 rounded-3xl text-xl flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                <Play fill="currentColor" />
                <span>ΕΤΟΙΜΟΙ</span>
              </button>
            ) : (
              <p className="text-center text-slate-500 text-sm font-bold uppercase">
                {selectedPlayers.size === 0 ? 'Select at least 2 players' : `Select ${2 - selectedPlayers.size} more player(s)`}
              </p>
            )}
            <button
              onClick={handleBackToHub}
              className="w-full text-slate-500 font-bold py-3 hover:text-white transition-colors text-sm uppercase tracking-widest"
            >
              ← Back to Hub
            </button>
          </footer>
        </motion.div>
      </AnimatePresence>
    );
  }

  // READY screen - waiting to start round
  if (gameState === GameState.READY) {
    return (
      <motion.div
        key="ready"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Bomb size={180} className="text-slate-800" />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/10 blur-3xl w-40 h-40 rounded-full" />
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-black italic tracking-tighter text-white">ΠΑΜΕ;</h2>
          <p className="text-slate-400 font-medium">Προετοιμάστε τον επόμενο παίκτη!</p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={startRound}
            className="w-full bg-red-600 text-white font-black py-6 rounded-3xl text-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] active:scale-95 transition-all"
          >
            ΕΚΚΙΝΗΣΗ
          </button>
          <button
            onClick={() => setIsSetup(true)}
            className="text-slate-500 font-bold hover:text-white transition-colors flex items-center justify-center space-x-2 w-full"
          >
            <span className="text-sm uppercase">ΑΛΛΑΓΗ ΠΑΙΚΤΩΝ</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // PLAYING screen - the game in progress
  if (gameState === GameState.PLAYING) {
    return (
      <motion.div
        key="playing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 flex flex-col bg-red-950/20 relative"
      >
        <button
          onClick={handleBackToHub}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"
        >
          <X size={24} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 pt-12">
          <div className="relative mb-8">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                color: ['#1e293b', '#ef4444', '#1e293b']
              }}
              transition={{
                duration: Math.max(0.1, (timeLeft || 1) / 30),
                repeat: Infinity
              }}
            >
              <Bomb size={200} />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-red-600 blur-[80px] rounded-full -z-10"
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-[2.5rem] text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Κανόνας</span>
              <div className="text-4xl font-black text-white">{currentDieMode}</div>
              <span className="text-[10px] text-red-500 font-bold block mt-2">
                {currentDieMode === DieMode.TIC && 'ΟΧΙ ΣΤΗΝ ΑΡΧΗ'}
                {currentDieMode === DieMode.TOC && 'ΟΧΙ ΣΤΟ ΤΕΛΟΣ'}
                {currentDieMode === DieMode.BOOM && 'ΟΠΟΥΔΗΠΟΤΕ'}
              </span>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] text-center shadow-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Συλλαβή</span>
              <div className="text-5xl font-black text-slate-900">{currentGram}</div>
            </div>
          </div>
        </div>

        <div className="p-8 text-center italic text-slate-500 font-bold animate-pulse text-sm">
          ΠΕΣ ΤΗ ΛΕΞΗ ΚΑΙ ΔΩΣΕ ΤΗ ΒΟΜΒΑ!
        </div>
      </motion.div>
    );
  }

  // EXPLODED screen - game over, select who got the bomb
  if (gameState === GameState.EXPLODED) {
    return (
      <motion.div
        key="exploded"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col p-6 items-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="bg-red-600 text-white font-black text-6xl px-10 py-6 rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.6)] my-12 italic"
        >
          BOOM!
        </motion.div>

        <h3 className="text-xl font-bold text-slate-400 mb-6 uppercase tracking-widest text-center">Ποιος είχε τη βόμβα;</h3>

        <div className="flex-1 w-full grid grid-cols-2 gap-3 overflow-y-auto max-w-sm">
          {players.map(player => (
            <button
              key={player.id}
              onClick={() => {
                incrementScore(player.id);
                confirmExplosion();
              }}
              className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 active:bg-white active:text-slate-950 transition-all text-center flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="font-black text-lg text-white">{player.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={confirmExplosion}
            className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl text-lg"
          >
            Continue
          </button>
          <button
            onClick={handleBackToHub}
            className="w-full text-slate-500 font-bold py-3 hover:text-white transition-colors text-sm uppercase tracking-widest"
          >
            Exit to Hub
          </button>
        </div>
      </motion.div>
    );
  }

  // Fallback - should not reach here
  return null;
};
