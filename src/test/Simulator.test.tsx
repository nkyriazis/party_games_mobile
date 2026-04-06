import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Game Simulator (Stress Test)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  it('should survive 10 consecutive rounds without crashing', async () => {
    render(<App />);
    
    // 1. Setup Phase
    const input = screen.getByPlaceholderText(/Όνομα παίκτη.../i);
    // Add players via Enter key
    for (let i = 1; i <= 2; i++) {
      act(() => {
        fireEvent.change(input, { target: { value: `Παίκτης ${i}` } });
      });
      act(() => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });
    }

    const readyButton = await screen.findByText(/ΕΤΟΙΜΟΙ/i);
    act(() => {
      fireEvent.click(readyButton);
    });

    // 2. Loop 10 rounds
    for (let i = 0; i < 10; i++) {
      const startButton = await screen.findByText(/ΕΚΚΙΝΗΣΗ/i);
      act(() => {
        fireEvent.click(startButton);
      });

      expect(await screen.findByText(/ΠΕΣ ΤΗ ΛΕΞΗ/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(100000); 
      });

      expect(await screen.findByText(/BOOM!/i)).toBeInTheDocument();

      const playerButtons = (await screen.findAllByRole('button')).filter(b => b.textContent?.includes('Παίκτης'));
      act(() => {
        fireEvent.click(playerButtons[0]);
      });

      expect(await screen.findByText(/ΠΑΜΕ;/i)).toBeInTheDocument();
    }

    // 3. Final State Check
    const buttons = screen.getAllByRole('button');
    const trophyButton = buttons.find(b => b.className.includes('fixed'));
    if (trophyButton) {
      act(() => {
        fireEvent.click(trophyButton);
      });
      expect(await screen.findByText(/HALL OF SHAME/i)).toBeInTheDocument();
      expect(await screen.findByText(/10 BOOMS/i)).toBeInTheDocument();
    }
  }, 60000);
});
