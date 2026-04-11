import { useState, useEffect, useCallback } from 'react';

export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  avatar?: string;
}

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
];

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('tick-tack-boom-players');
    if (saved) {
      const parsed = JSON.parse(saved) as Player[];
      // Ensure avatar is undefined if not present (handles old saved data)
      return parsed.map(p => ({
        ...p,
        avatar: p.avatar,
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tick-tack-boom-players', JSON.stringify(players));
  }, [players]);

  const addPlayer = useCallback((name: string, avatar?: string) => {
    if (!name.trim()) return;
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);

    setPlayers(prev => [
      ...prev,
      {
        id,
        name: name.trim(),
        score: 0,
        color: COLORS[prev.length % COLORS.length],
        avatar,
      }
    ]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateScore = useCallback((id: string, delta: number) => {
    setPlayers(prev => prev.map(p =>
      p.id === id ? { ...p, score: p.score + delta } : p
    ));
  }, []);

  const incrementScore = useCallback((id: string) => {
    updateScore(id, 1);
  }, [updateScore]);

  const resetScores = useCallback(() => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
  }, []);

  return { players, addPlayer, removePlayer, incrementScore, resetScores };
};
