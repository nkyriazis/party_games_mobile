# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Docker-Only Development

**All Android building and asset generation must be done inside Docker containers using `docker compose`. Never run Android build commands directly on the host system.**

### Android Build (inside container)

- **Build Android APK**: `docker compose run --rm android-build`
  - This runs the `build-android.sh` script which:
    1. Installs dependencies if changed
    2. Generates Android launcher icons
    3. Builds the web app with Vite
    4. Syncs Capacitor
    5. Builds the Android APK with Gradle
  - Output APK is copied to `./build-output/tick-tack-boom.apk`

- **Regenerate Android assets**: `docker compose run --rm android-build npm run assets:android`

### Web Development

The following can be run on the host or in the container:
- **Start dev server**: `npm run dev` (Vite with `--host`)
- **Build web app**: `npm run build` (type-checks + Vite)
- **Testing**: `npm run test` or `npm run test:watch`
- **Linting**: `npm run lint`
- **Data Generation**: `npm run grams:generate`

## Architecture and Structure

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
