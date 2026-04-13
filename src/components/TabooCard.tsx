import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabooCard } from '../hooks/useTaboo';

interface TabooCardProps {
  card: TabooCard;
  onCorrect: () => void;
  onTaboo: () => void;
  onPass: () => void;
  timeLeft: number;
}

export const TabooCardComponent: React.FC<TabooCardProps> = ({
  card,
  onCorrect,
  onTaboo,
  onPass,
  timeLeft
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-3 sm:px-4 py-6 sm:py-8 mx-auto">
      <div className="mb-6 text-3xl sm:text-4xl font-bold text-red-500 font-mono">
        {timeLeft}s
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.target}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full aspect-[3/4] bg-slate-800 rounded-3xl shadow-2xl border-4 border-slate-700 p-5 sm:p-8 flex flex-col items-center text-center"
        >
          <div className="text-sm uppercase tracking-widest text-slate-400 mb-4">Target Word</div>
          <div className="text-4xl sm:text-5xl leading-tight font-black text-white mb-8 sm:mb-12 break-words w-full">
            {card.target}
          </div>

          <div className="w-full h-px bg-slate-700 mb-8" />

          <div className="text-sm uppercase tracking-widest text-slate-400 mb-4">Forbidden Words</div>
          <div className="flex flex-col gap-3 w-full">
            {card.forbidden.map((word, index) => (
              <div
                key={index}
                className="text-xl sm:text-2xl leading-tight font-medium text-slate-300 py-2 px-3 sm:px-4 bg-slate-900/50 rounded-xl border border-slate-700"
              >
                {word}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full mt-8 sm:mt-12 max-w-md">
        <button
          type="button"
          onClick={onTaboo}
          className="min-h-[52px] py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-colors shadow-lg active:scale-95"
        >
          TABOO
        </button>
        <button
          type="button"
          onClick={onPass}
          className="min-h-[52px] py-3 sm:py-4 bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-colors shadow-lg active:scale-95"
        >
          PASS
        </button>
        <button
          type="button"
          onClick={onCorrect}
          className="min-h-[52px] py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-colors shadow-lg active:scale-95"
        >
          CORRECT
        </button>
      </div>
    </div>
  );
};
