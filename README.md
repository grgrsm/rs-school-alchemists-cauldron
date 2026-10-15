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

## Structure

`data/` tables, `logic/` pure rules, `state/` game state, `storage/` localStorage, `ui/` DOM rendering only, `styles/` SCSS tokens and styles.
