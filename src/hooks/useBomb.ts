import { useState, useEffect, useRef, useCallback } from 'react';

export const useBomb = () => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTicking, setIsTicking] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const stopBomb = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTicking(false);
  }, []);

  const resetBomb = useCallback(() => {
    stopBomb();
    setTimeLeft(null);
    setIsTicking(false);
    setIsExploded(false);
  }, [stopBomb]);

  const startBomb = useCallback(() => {
    resetBomb();
    
    // Random duration between 10 and 90 seconds
    const duration = Math.floor(Math.random() * (90 - 10 + 1) + 10);
    setTimeLeft(duration);
    setIsTicking(true);
    
    startTimeRef.current = Date.now();
    
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - (startTimeRef.current || 0)) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        stopBomb();
        setIsExploded(true);
      }
    }, 100);
  }, [resetBomb, stopBomb]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    timeLeft,
    isTicking,
    isExploded,
    startBomb,
    stopBomb,
    resetBomb,
  };
};
