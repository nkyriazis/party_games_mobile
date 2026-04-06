import { useEffect, useRef } from 'react';
import { GameState } from './useGame';

/**
 * Hook to manage device persistence and prevent accidental navigation.
 * - Screen Wake Lock: Keeps the screen on during the game.
 * - Navigation Lock: Prevents accidental "back" button usage.
 * - Leave Confirmation: Warns before refreshing or closing the tab.
 */
export const useDeviceLock = (gameState: GameState) => {
  const wakeLockRef = useRef<any>(null);

  // 1. Screen Wake Lock Management
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        try {
          // @ts-ignore - Screen Wake Lock API might not be in all TS versions
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        } catch (err: any) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    // Only lock screen when in a game state (READY, PLAYING, EXPLODED)
    if (gameState !== GameState.SETUP) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire lock if page becomes visible again (e.g. after app switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gameState !== GameState.SETUP) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameState]);

  // 2. Navigation & History Protection (Popstate)
  useEffect(() => {
    // If we're starting a game, push a state so there's something to "go back" from
    if (gameState !== GameState.SETUP) {
      if (!window.history.state || !window.history.state.inGame) {
        window.history.pushState({ inGame: true }, '');
      }
    }

    const handlePopState = () => {
      // If the user tries to go back while the game is active, stay on the page
      if (gameState !== GameState.SETUP) {
        window.history.pushState({ inGame: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [gameState]);

  // 3. Unload/Refresh Confirmation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (gameState !== GameState.SETUP) {
        // Standard way to trigger "Are you sure you want to leave?"
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState]);
};
