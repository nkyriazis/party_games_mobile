import { renderHook, act } from '@testing-library/react';
import { usePlayers } from './usePlayers';
import { describe, it, expect, beforeEach } from 'vitest';

describe('usePlayers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with an empty array', () => {
    const { result } = renderHook(() => usePlayers());
    expect(result.current.players).toEqual([]);
  });

  it('should add a player correctly', () => {
    const { result } = renderHook(() => usePlayers());
    
    act(() => {
      result.current.addPlayer('Γιάννης');
    });

    expect(result.current.players.length).toBe(1);
    expect(result.current.players[0].name).toBe('Γιάννης');
    expect(result.current.players[0].score).toBe(0);
    expect(result.current.players[0].color).toBeDefined();
  });

  it('should remove a player', () => {
    const { result } = renderHook(() => usePlayers());
    
    act(() => {
      result.current.addPlayer('Μαρία');
    });

    const playerId = result.current.players[0].id;
    
    act(() => {
      result.current.removePlayer(playerId);
    });

    expect(result.current.players).toEqual([]);
  });

  it('should increment scores', () => {
    const { result } = renderHook(() => usePlayers());
    
    act(() => {
      result.current.addPlayer('Πέτρος');
    });

    const playerId = result.current.players[0].id;
    
    act(() => {
      result.current.incrementScore(playerId);
    });

    expect(result.current.players[0].score).toBe(1);
  });

  it('should persist to localStorage', () => {
    const { result: hook1 } = renderHook(() => usePlayers());
    
    act(() => {
      hook1.current.addPlayer('Σοφία');
    });

    const { result: hook2 } = renderHook(() => usePlayers());
    expect(hook2.current.players.length).toBe(1);
    expect(hook2.current.players[0].name).toBe('Σοφία');
  });
});
