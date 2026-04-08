# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `npm run dev` (starts Vite server with `--host`)
- **Build**: `npm run build` (type-checks and builds production bundle)
- **Testing**:
  - Run all tests: `npm run test`
  - Watch mode: `npm run test:watch`
- **Linting**: `npm run lint`
- **Android Build**: `npm run android:build` (uses Docker to build Android APK)
- **Android Assets**: `npm run assets:android` (generates app icons/splash screens)
- **Data Generation**: `npm run grams:generate` (updates `src/data/grams.json` from wordlist)

## Architecture and Structure

### High-Level Architecture
The project is a React-based Progressive Web App (PWA) designed for mobile-first party gameplay. It follows a "headless" logic pattern where game state and business rules are isolated from the UI.

### Core Components
- **Game Logic (`src/hooks/`)**: 
  - `useGame.ts`: Main orchestrator for game flow and state transitions.
  - `useBomb.ts`: Handles the randomized timer and explosion logic.
  - `usePlayers.ts`: Manages player state, scoring, and `localStorage` persistence.
  - `useDictionary.ts`: Handles word validation using the Greek wordlist.
- **Audio (`src/utils/soundManager.ts`)**: Procedural audio generation using Web Audio API (avoids static assets for core sounds).
- **Data**: 
  - `src/data/grams.json`: Generated list of Greek 2-grams and 3-grams used as prompts.
  - `public/greek_wordlist.txt`: Source wordlist for validation and gram generation.
- **UI/UX**: 
  - **Styling**: Tailwind CSS with a "Modern Dark" aesthetic (slate/red palette).
  - **Animations**: Framer Motion for screen transitions and bomb pulsing effects.
  - **Haptics**: Uses the `navigator.vibrate` API for mobile feedback on explosions.

### Build Pipeline
- **Web**: Vite $\rightarrow$ PWA $\rightarrow$ Static Hosting.
- **Mobile**: Capacitor $\rightarrow$ Android Studio (via Dockerized build process).
