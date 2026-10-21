# Alchemist's Cauldron

Browser potion-brewing game built with TypeScript, SCSS and Vite. No frameworks, game engines or runtime libraries.

Deployed version: _add the public link here_

## Run

```bash
npm install
npm run dev      # development server
npm run build    # type check + production build
npm run lint     # ESLint
npm run format   # Prettier
```

Husky runs lint-staged before each commit and lint, format check and build before each push.

## Features

- Shelf of ingredient cards with random stock (2-15) and a cauldron with a capacity limit.
- Three parameter bars (Temperature, Density, Magic Power) centred on 0, with recipe target zones, a current-value marker and a glow when the value is inside the checked range.
- Recipe pool of 20 recipes, ingredient counter, Brew check with tolerance, score and time bonus.
- Timer (calculated from timestamps), lives and a Game Over screen.
- Pause dialog (Resume / Exit to Menu), automatic pause when the tab is hidden.
- Top-10 leaderboard in localStorage with name validation and a confirmed Clear action.
- Start screen with Help and Menu, difficulty selection (Easy / Medium / Hard) and one leaderboard per difficulty.
- Auto-save and Continue Game (restores the saved stock and opens the game paused).
- Drag and drop from the shelf into the cauldron (only ingredient drags are accepted).
- Hover tooltip with the three ingredient values and smart positioning near screen edges.
- Chemical reactions: all 15 are typed in `src/data/reactions.ts`; Medium enables the first 2 `medium` reactions, Hard the first 3 `hard` reactions.
- Pour Out clears the cauldron for 10 seconds without losing a life.

## Structure

`data/` tables, `logic/` pure rules, `state/` game state, `storage/` localStorage, `ui/` DOM rendering only, `styles/` SCSS tokens and styles.
