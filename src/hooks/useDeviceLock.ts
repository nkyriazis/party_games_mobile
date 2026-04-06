import { useEffect, useRef } from 'react';
import { GameState } from './useGame';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

/**
 * Hook to manage device persistence and prevent accidental navigation.
 * - Screen Wake Lock: Keeps the screen on during the game.
 * - Navigation Lock: Prevents accidental "back" button usage.
 * - Leave Confirmation: Warns before refreshing or closing the tab.
 * - Immersive Mode: Hides status and navigation bars on mobile.
 */
export const useDeviceLock = (gameState: GameState) => {
  const wakeLockRef = useRef<any>(null);

  // 1. Immersive Mode & Screen Wake Lock Management
  useEffect(() => {
    const requestWakeLock = async () => {
      // Screen Wake Lock
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

      // Capacitor Immersive Mode
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.hide();
          await NavigationBar.hide();
        } catch (err) {
          console.error('Failed to hide bars', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      
      // We don't necessarily show the bars again when releasing wake lock 
      // as we might want to stay in immersive mode, but for SETUP we might want them back.
    };

    // Only lock screen and go immersive when in a game state (READY, PLAYING, EXPLODED)
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
