# AGENTS.md

## Cursor Cloud specific instructions

`yk-tetris` is a single-package, client-only browser game (Vite + TypeScript + HTML5 Canvas). There is no backend, database, or auth. The update script runs `npm install`, so dependencies are already present when a session starts.

Standard commands live in `package.json` and `README.md`; use those rather than duplicating them here. Notes worth knowing:

- Dev server: `npm run dev` serves on port `5173`. `vite.config.ts` sets `server.host: true` (and `preview.host: true`) so it binds to all interfaces and is reachable via port forwarding from outside the VM — needed for the user to open/interact with the game. It does not auto-open a browser in this environment.
- Game logic in `src/game/tetris.ts` is written as pure functions and takes an injectable `rng` argument; tests pass a seeded RNG for determinism. Keep new logic pure/testable and out of `src/main.ts`, which only handles Canvas rendering, input, and the `requestAnimationFrame` loop.
- The game only starts after clicking **Start / Restart** — an idle page with an empty board is expected before that click.
- `npm run build` runs `tsc` (with `noUnusedLocals`/`noUnusedParameters`) before `vite build`, so an unused import/var fails the build even though `npm run dev` tolerates it.
- Desktop packaging: Electron (`electron/main.cjs`) + `electron-builder`; `npm run dist:linux` / `dist:win` write to `release/`. `vite.config.ts` sets `base: './'` so the built app loads over `file://` inside Electron — don't remove it. Building the **Windows** target on this Linux VM requires Wine (only the final sign/resource-edit step); the `win-unpacked/yk-tetris.exe` is still produced, and a distributable `.zip` can be made with `npx electron-builder --win zip -c.win.signAndEditExecutable=false`. Proper Windows installers are meant to be built by the `Release binaries` workflow on a `windows-latest` runner. To run the built Linux binary inside this VM's virtual display, launch with `DISPLAY=:1 ./release/linux-unpacked/yk-tetris --no-sandbox --disable-gpu` (sandbox off + software rendering are required here).
