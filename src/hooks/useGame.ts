import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { useBomb } from './useBomb';
import { gameMachine, GameState, DieMode } from './gameMachine';

export { GameState, DieMode };

export const useGame = () => {
  const { timeLeft, isTicking, isExploded, startBomb, stopBomb, resetBomb } = useBomb();

  const machineWithActions = useMemo(() => gameMachine.provide({
    actions: {
      startBomb: () => startBomb(),
      stopBomb: () => stopBomb(),
      resetBomb: () => resetBomb(),
    },
  }), [startBomb, stopBomb, resetBomb]);

  const [state, send] = useMachine(machineWithActions);

  // Sync internal bomb explosion with game machine
  useEffect(() => {
    if (isExploded && state.matches('playing')) {
      send({ type: 'EXPLODE' });
    }
  }, [isExploded, state, send]);

  // Derived state for easier consumption
  let gameState = GameState.SETUP;
  if (state.matches('setup')) gameState = GameState.SETUP;
  else if (state.matches('ready')) gameState = GameState.READY;
  else if (state.matches('playing')) gameState = GameState.PLAYING;
  else if (state.matches('exploded')) gameState = GameState.EXPLODED;

  return {
    // State
    timeLeft,
    isTicking,
    isExploded,
    currentGram: state.context.currentGram,
    currentDieMode: state.context.currentDieMode,
    gameState,
    
    // Transitions
    startGame: () => send({ type: 'START_GAME' }),
    startRound: () => send({ type: 'START_ROUND' }),
    confirmExplosion: () => send({ type: 'CONFIRM_EXPLOSION' }),
    cancelRound: () => send({ type: 'CANCEL_ROUND' }),
    backToSetup: () => send({ type: 'BACK_TO_SETUP' }),
  };
};
