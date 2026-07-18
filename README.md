# yk-tetris

A browser-based Tetris game built with Vite, TypeScript, and the HTML5 Canvas.

## Requirements

- Node.js 20+ (developed on Node 22)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run lint     # run ESLint over the TypeScript sources
npm test         # run the Vitest unit tests once
npm run build    # type-check with tsc and produce a production bundle in dist/
npm run preview  # preview the production build
```

## How to play

Pick a **Difficulty** (1–5) — this sets the starting level and fall speed; the
level still increases every 10 cleared lines. Then click **Start / Restart**:

- **←/→** move, **↑** rotate, **↓** soft drop
- **Space** hard drop
- **P** pause

When the game ends, the Game Over dialog lets you change the difficulty and
**Play Again**.

## Project structure

- `src/game/pieces.ts` — tetromino definitions, colors, rotation helper
- `src/game/tetris.ts` — pure game logic (board, collision, movement, gravity, scoring)
- `src/game/tetris.test.ts` — Vitest unit tests for the game logic
- `src/main.ts` — Canvas rendering, input handling, and the game loop
