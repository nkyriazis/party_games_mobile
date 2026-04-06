import { renderHook, act } from '@testing-library/react';
import { useBomb } from './useBomb';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useBomb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with null state', () => {
    const { result } = renderHook(() => useBomb());
    expect(result.current.timeLeft).toBeNull();
    expect(result.current.isTicking).toBe(false);
    expect(result.current.isExploded).toBe(false);
  });

  it('should start ticking with a random duration', () => {
    const { result } = renderHook(() => useBomb());
    
    act(() => {
      result.current.startBomb();
    });

    expect(result.current.isTicking).toBe(true);
    expect(result.current.timeLeft).toBeGreaterThanOrEqual(10);
    expect(result.current.timeLeft).toBeLessThanOrEqual(90);
  });

  it('should explode when time reaches zero', () => {
    const { result } = renderHook(() => useBomb());
    
    act(() => {
      result.current.startBomb();
    });

    const initialTime = result.current.timeLeft!;
    
    act(() => {
      vi.advanceTimersByTime(initialTime * 1000 + 500);
    });

    expect(result.current.isTicking).toBe(false);
    expect(result.current.isExploded).toBe(true);
    expect(result.current.timeLeft).toBe(0);
  });

  it('should stop and reset correctly', () => {
    const { result } = renderHook(() => useBomb());
    
    act(() => {
      result.current.startBomb();
    });

    act(() => {
      result.current.stopBomb();
    });

    expect(result.current.isTicking).toBe(false);
    
    act(() => {
      result.current.resetBomb();
    });

    expect(result.current.timeLeft).toBeNull();
    expect(result.current.isExploded).toBe(false);
  });
});
