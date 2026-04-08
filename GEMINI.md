# Tick Tack Boom Greek (Party Edition)

A digital adaptation of the classic "Tick Tack Boom" board game, localized for Greek speakers. This is a fast-paced party game where players must quickly think of a word containing a specific syllable (gram) before a random timer expires and the "bomb" explodes.

## Project Overview

- **Purpose:** A fun, mobile-friendly web application for group play.
- **Core Loop:** 
  1. Add players and start the game.
  2. A random syllable (gram) and a rule (TIC, TOC, BOOM) are shown.
  3. Players pass the "bomb" (device) after saying a valid word.
  4. The bomb explodes after a random duration (10-90 seconds).
  5. The player holding the bomb loses the round and gains a "BOOM" point.
- **Main Technologies:**
  - **React 18** & **TypeScript**: Core framework and type safety.
  - **Vite**: Ultra-fast build tool and development server.
  - **Tailwind CSS**: Utility-first styling for a sleek, dark-themed UI.
  - **Framer Motion**: Smooth transitions and "pulsing" bomb animations.
  - **Web Audio API**: Custom `SoundManager` for procedurally generated ticks and explosions.
  - **Vite PWA**: Progressive Web App support for offline play and "Install to Home Screen" capability.

## Architecture

The project follows a modular, hooks-centric architecture:

- **`src/hooks/`**: Contains the core game logic.
  - `useGame.ts`: Orchestrates the overall game flow and state transitions.
  - `useBomb.ts`: Manages the randomized timer and explosion logic.
  - `usePlayers.ts`: Handles player management, scoring, and persistence via `localStorage`.
  - `useDictionary.ts`: Loads and provides validation for the Greek wordlist.
- **`src/utils/soundManager.ts`**: Encapsulates audio logic using the Web Audio API to avoid external asset dependencies for core sounds.
- **`src/data/grams.json`**: An auto-generated collection of Greek 2-grams and 3-grams derived from the word list and used as game prompts.
- **`public/greek_wordlist.txt`**: A comprehensive list of Greek words for potential future automated validation.

## Building and Running

### Key Commands
- `npm run dev`: Starts the Vite development server. It is configured with `--host` to allow access from other devices on the same network (ideal for testing on mobile).
- `npm run build`: Compiles the project using `tsc` for type-checking and `vite build` for the production bundle.
- `npm run test`: Executes the test suite using **Vitest**. Includes unit tests for hooks and a high-level game simulator stress test.
- `npm run lint`: Runs ESLint to ensure code quality and adherence to standards.

### Docker Support
The project includes a `Dockerfile` and `docker-compose.yml` for containerized development and deployment. The Vite server is configured to work seamlessly within a Docker environment (port 5173).

## Development Conventions

- **Environment**: This is a dockerized deployment. Do NOT run commands that have side-effects on the host system (e.g., `npm install`). Modify configuration files (like `package.json`) directly and assume the environment handles synchronization.
- **Logic vs. UI**: Keep business logic in custom hooks. `App.tsx` should primarily focus on rendering and user interaction.
- **Styling**: Use Tailwind CSS for all styling. Follow the "Modern Dark" aesthetic established in the project (slate/red color palette).
- **Animations**: Use `Framer Motion` for state transitions between game screens.
- **Testing**:
  - Add unit tests for any new hooks in `src/hooks/*.test.ts`.
  - Update `src/test/Simulator.test.tsx` if major game flow changes are introduced.
- **Localization**: All user-facing text should be in Greek, while the codebase (variables, comments, documentation) remains in English.
- **Haptics**: Utilize the Vibration API (`navigator.vibrate`) for critical game events like explosions to enhance the mobile experience.
