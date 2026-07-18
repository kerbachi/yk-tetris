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

## Desktop binaries (Windows & Linux)

The web app is packaged as a standalone desktop app with
[Electron](https://www.electronjs.org/) + `electron-builder`.

```bash
npm run electron:dev   # build the web app and open it in an Electron window
npm run dist:linux     # build a Linux AppImage in release/
npm run dist:win       # build a Windows NSIS installer in release/ (needs Wine on Linux)
```

Notes:

- Artifacts are written to `release/` (git-ignored).
- Building the **Windows** target from a non-Windows host requires
  [Wine](https://electron.build/multi-platform-build#linux). The recommended way
  to produce release installers for both platforms is the
  `Release binaries` GitHub Actions workflow (`.github/workflows/release.yml`),
  which builds on native `ubuntu-latest` and `windows-latest` runners. Trigger it
  manually (workflow_dispatch) or by pushing a `v*` tag, then download the
  binaries from the run's artifacts.

## Project structure

- `src/game/pieces.ts` — tetromino definitions, colors, rotation helper
- `src/game/tetris.ts` — pure game logic (board, collision, movement, gravity, scoring)
- `src/game/tetris.test.ts` — Vitest unit tests for the game logic
- `src/main.ts` — Canvas rendering, input handling, and the game loop
