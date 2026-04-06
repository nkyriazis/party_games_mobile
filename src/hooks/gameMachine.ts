import { createMachine, assign } from 'xstate';
import gramsData from '../data/grams.json';

export enum DieMode {
  TIC = 'TIC',
  TOC = 'TOC',
  BOOM = 'BOOM'
}

export enum GameState {
  SETUP = 'SETUP',
  READY = 'READY',
  PLAYING = 'PLAYING',
  EXPLODED = 'EXPLODED'
}

interface GameContext {
  currentGram: string;
  currentDieMode: DieMode;
}

type GameEvent =
  | { type: 'START_GAME' }
  | { type: 'START_ROUND' }
  | { type: 'EXPLODE' }
  | { type: 'CONFIRM_EXPLOSION' }
  | { type: 'BACK_TO_SETUP' }
  | { type: 'CANCEL_ROUND' };

export const gameMachine = createMachine(
  {
    id: 'game',
    types: {} as {
      context: GameContext;
      events: GameEvent;
    },
    initial: 'setup',
    context: {
      currentGram: '',
      currentDieMode: DieMode.BOOM,
    },
    states: {
      setup: {
        on: {
          START_GAME: 'ready',
        },
      },
      ready: {
        entry: 'resetBomb',
        on: {
          START_ROUND: 'playing',
          BACK_TO_SETUP: 'setup',
        },
      },
      playing: {
        entry: ['rollDie', 'nextCard', 'startBomb'],
        on: {
          EXPLODE: 'exploded',
          CANCEL_ROUND: 'ready',
        },
        exit: 'stopBomb',
      },
      exploded: {
        on: {
          CONFIRM_EXPLOSION: 'ready',
          CANCEL_ROUND: 'ready',
        },
      },
    },
  },
  {
    actions: {
      rollDie: assign({
        currentDieMode: () => {
          const modes = [DieMode.TIC, DieMode.TOC, DieMode.BOOM];
          return modes[Math.floor(Math.random() * modes.length)];
        },
      }),
      nextCard: assign({
        currentGram: () => {
          return gramsData[Math.floor(Math.random() * gramsData.length)];
        },
      }),
      startBomb: () => {},
      stopBomb: () => {},
      resetBomb: () => {},
    },
  }
);
