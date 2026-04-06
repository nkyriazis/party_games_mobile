import { renderHook, act } from '@testing-library/react';
import { useGame, GameState } from './useGame';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize in SETUP state', () => {
    const { result } = renderHook(() => useGame());
    expect(result.current.gameState).toBe(GameState.SETUP);
  });

  it('should transition from SETUP to READY', () => {
    const { result } = renderHook(() => useGame());
    
    act(() => {
      result.current.startGame();
    });

    expect(result.current.gameState).toBe(GameState.READY);
  });

  it('should transition from READY to PLAYING and start bomb', () => {
    const { result } = renderHook(() => useGame());
    
    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.startRound();
    });

    expect(result.current.gameState).toBe(GameState.PLAYING);
    expect(result.current.isTicking).toBe(true);
    expect(result.current.currentGram).not.toBe('');
  });

  it('should transition to EXPLODED when bomb ends', async () => {
    const { result } = renderHook(() => useGame());
    
    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.startRound();
    });

    const timeLeft = result.current.timeLeft!;
    
    act(() => {
      vi.advanceTimersByTime(timeLeft * 1000 + 500);
    });

    expect(result.current.gameState).toBe(GameState.EXPLODED);
    expect(result.current.isExploded).toBe(true);
  });

  it('should reset to READY from EXPLODED', () => {
    const { result } = renderHook(() => useGame());
    
    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.startRound();
    });

    act(() => {
      vi.advanceTimersByTime(100000); // Trigger explosion
    });

    expect(result.current.gameState).toBe(GameState.EXPLODED);

    act(() => {
      result.current.confirmExplosion();
    });

    expect(result.current.gameState).toBe(GameState.READY);
    expect(result.current.isExploded).toBe(false);
  });

  it('should allow cancelling a round', () => {
    const { result } = renderHook(() => useGame());
    
    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.startRound();
    });

    act(() => {
      result.current.cancelRound();
    });

    expect(result.current.gameState).toBe(GameState.READY);
    expect(result.current.isTicking).toBe(false);
  });
});
