import { useState, useEffect, useCallback } from 'react';
import tabooData from '../data/taboo.json';

export interface TabooCard {
  target: string;
  forbidden: string[];
}

export const useTaboo = (
  teamId: string,
  updateTeamScore: (teamId: string, delta: number) => void
) => {
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const nextCard = useCallback(() => {
    const randomCard = tabooData[Math.floor(Math.random() * tabooData.length)];
    setCurrentCard(randomCard);
  }, []);

  const startRound = useCallback(() => {
    nextCard();
    setTimeLeft(60);
    setIsPlaying(true);
    setIsGameOver(false);
  }, [nextCard]);

  useEffect(() => {
    let timer: number;
    if (isPlaying && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setIsGameOver(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleCorrect = useCallback(() => {
    updateTeamScore(teamId, 1);
    nextCard();
  }, [teamId, updateTeamScore, nextCard]);

  const handleTaboo = useCallback(() => {
    updateTeamScore(teamId, -1);
    nextCard();
  }, [teamId, updateTeamScore, nextCard]);

  const handlePass = useCallback(() => {
    nextCard();
  }, [nextCard]);

  return {
    currentCard,
    timeLeft,
    isPlaying,
    isGameOver,
    startRound,
    handleCorrect,
    handleTaboo,
    handlePass,
  };
};
