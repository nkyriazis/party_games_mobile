import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, GameState, DieMode } from './hooks/useGame';
import { usePlayers, Player } from './hooks/usePlayers';
import { useDeviceLock } from './hooks/useDeviceLock';
import { Bomb, UserPlus, X, Play, RotateCcw, Trophy, Users, Trash2, Maximize, Minimize } from 'lucide-react';
import { soundManager } from './utils/soundManager';

export default function App() {
  const {
    timeLeft,
    isTicking,
    isExploded,
    currentGram,
    currentDieMode,
    gameState,
    startGame,
    startRound,
    confirmExplosion,
    cancelRound,
    backToSetup
  } = useGame();

  const { players, addPlayer, removePlayer, incrementScore, resetScores } = usePlayers();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Persistence management (wake lock and back button prevention)
  useDeviceLock(gameState);
  
  // Audio control loop
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (isTicking && timeLeft !== null) {
      // Accelerate ticks as time runs out
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans select-none overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        
        {/* SETUP SCREEN */}
        {gameState === GameState.SETUP && (
          <motion.div 
            key="setup"
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
              <h1 className="text-4xl font-black text-red-600 tracking-tighter uppercase italic">Tick Tack Boom</h1>
              <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Party Edition</p>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (addPlayer(newPlayerName), setNewPlayerName(''))}
                  placeholder="Όνομα παίκτη..."
                  className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 focus:border-red-600 outline-none transition-all"
                />
                <button 
                  onClick={() => { addPlayer(newPlayerName); setNewPlayerName(''); }}
                  className="bg-red-600 p-4 rounded-2xl active:scale-90 transition-transform"
                >
                  <UserPlus size={20} />
                </button>
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
                    </div>
                    <button onClick={() => removePlayer(player.id)} className="text-slate-600 hover:text-red-500 p-2">
                      <X size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <footer className="py-6 space-y-3">
              {players.length >= 2 ? (
                <button 
                  onClick={startGame}
                  className="w-full bg-white text-slate-950 font-black py-5 rounded-3xl text-xl flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <Play fill="currentColor" />
                  <span>ΕΤΟΙΜΟΙ</span>
                </button>
              ) : (
                <p className="text-center text-slate-600 text-sm font-bold uppercase animate-pulse">Προσθέστε τουλάχιστον 2 παίκτες</p>
              )}
            </footer>
          </motion.div>
        )}

        {/* READY SCREEN */}
        {gameState === GameState.READY && (
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
              <h2 className="text-5xl font-black italic tracking-tighter">ΠΑΜΕ;</h2>
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
                onClick={backToSetup}
                className="text-slate-500 font-bold hover:text-white transition-colors flex items-center justify-center space-x-2 w-full"
               >
                <Users size={16} />
                <span>ΑΛΛΑΓΗ ΠΑΙΚΤΩΝ</span>
               </button>
            </div>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === GameState.PLAYING && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-red-950/20"
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
              {/* Animated Bomb Background */}
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
                {/* Heat glow */}
                <motion.div 
                  className="absolute inset-0 bg-red-600 blur-[80px] rounded-full -z-10"
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>

              {/* Game Info Cards */}
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-[2.5rem] text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Κανόνας</span>
                  <div className="text-4xl font-black">{currentDieMode}</div>
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
        )}

        {/* EXPLODED SCREEN */}
        {gameState === GameState.EXPLODED && (
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
                  <span className="font-black text-lg">{player.name}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={cancelRound}
              className="mt-6 text-slate-500 font-bold flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>ΑΚΥΡΩΣΗ ΓΥΡΟΥ</span>
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Floating Scoreboard Trigger */}
      {gameState !== GameState.PLAYING && players.length > 0 && (
        <Scoreboard players={players} onReset={resetScores} />
      )}

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function Scoreboard({ players, onReset }: { players: Player[], onReset: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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

            <div className="flex-1 space-y-4">
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800">
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-600 font-black text-2xl">{idx + 1}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="font-bold text-xl">{player.name}</span>
                  </div>
                  <div className="bg-red-600/20 text-red-500 px-4 py-1 rounded-full font-black">
                    {player.score} BOOMS
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { if(confirm('Είστε σίγουροι;')) { onReset(); setIsOpen(false); }}}
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
