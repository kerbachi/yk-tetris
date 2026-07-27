# AGENTS.md

## Cursor Cloud specific instructions

`yk-minecraft` is a single-package, client-only browser voxel sandbox (Vite +
TypeScript + Three.js), with an optional legacy Tetris page. There is no
backend, database, or auth. The update script runs `npm install`, so dependencies
are already present when a session starts.

Standard commands live in `package.json` and `README.md`; use those rather than
duplicating them here. Notes worth knowing:

- Dev server: `npm run dev` serves on port `5173`. `vite.config.ts` sets
  `server.host: true` (and `preview.host: true`) so it binds to all interfaces
  and is reachable via port forwarding from outside the VM. It does not
  auto-open a browser in this environment.
- **Home page is Minecraft** (`index.html` → `src/minecraft/`). Keep voxel game
  logic testable under `src/minecraft/`; `src/minecraft/main.ts` wires rendering
  and input. Legacy Tetris is at `tetris.html`.
- The voxel game starts after **Click to play** (pointer lock). An overlay idle
  state before that click is expected.
- `npm run build` runs `tsc` (with `noUnusedLocals`/`noUnusedParameters`) before
  `vite build`, so an unused import/var fails the build even though `npm run dev`
  tolerates it.
- Desktop packaging: Electron (`electron/main.cjs`) + `electron-builder`;
  `npm run dist:linux` / `dist:win` write to `release/`. `vite.config.ts` sets
  `base: './'` so the built app loads over `file://` inside Electron — don't
  remove it. Building the **Windows** target on this Linux VM requires Wine
  (only the final sign/resource-edit step); the `win-unpacked/yk-minecraft.exe`
  is still produced, and a distributable `.zip` can be made with
  `npx electron-builder --win zip -c.win.signAndEditExecutable=false`. Proper
  Windows installers are meant to be built by the `Release binaries` workflow on
  a `windows-latest` runner. To run the built Linux binary inside this VM's
  virtual display, launch with
  `DISPLAY=:1 ./release/linux-unpacked/yk-minecraft --no-sandbox --disable-gpu`
  (sandbox off + software rendering are required here).
