# Block Pulse — Mobile Tetris

A mobile-first Tetris game with polished block graphics, procedural arcade sound, scoring, and mission-based XP.

## Features

- Classic Tetris gameplay (7-bag randomizer, ghost piece, hold, next preview)
- Touch controls: swipe to move / soft drop / hard drop, tap to rotate
- On-screen control pad + keyboard support
- Score, lines, and speed level
- **Missions** that award **XP** when completed (persisted player level)
- Procedural SFX via Web Audio (no audio files required)
- Responsive layout tuned for phones

## Play locally

Serve the folder with any static file server (ES modules need HTTP):

```bash
npx --yes serve -l 4173
```

Then open `http://localhost:4173` on your phone or desktop.

## Controls

| Action | Touch | Keyboard |
|--------|--------|----------|
| Move | Swipe left / right | ← → |
| Rotate | Tap board | ↑ |
| Soft drop | Swipe / hold down | ↓ |
| Hard drop | Swipe up | Space |
| Hold | Hold button | C |
| Pause | Pause button | P |

## Missions & XP

Each run picks 3 missions (clear lines, score goals, Tetris, hard drops, etc.). Completing them grants XP. Total XP and best score are saved in `localStorage`.
