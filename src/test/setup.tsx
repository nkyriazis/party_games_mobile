import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2)
  }
});

// Mock framer-motion components to be static in tests
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, ...props }: any, ref) => (
        <div {...props} ref={ref}>{children}</div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock Web Audio API
class MockAudioContext {
  createOscillator() { return { type: '', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; }
  createGain() { return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }; }
  createBuffer() { return { getChannelData: vi.fn(() => new Float32Array(100)) }; }
  createBufferSource() { return { buffer: null, connect: vi.fn(), start: vi.fn() }; }
  createBiquadFilter() { return { type: '', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }; }
  destination = {};
  currentTime = 0;
  sampleRate = 44100;
}

(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

// Mock Navigator APIs
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true
});

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
