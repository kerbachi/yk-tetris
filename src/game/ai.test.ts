import { describe, expect, it } from 'vitest';
import {
  applyAiAction,
  dropToFloor,
  evaluateBoard,
  nextAiAction,
  planBestMove,
  planToActions,
} from './ai';
import {
  COLS,
  ROWS,
  createBoard,
  createGame,
  hardDrop,
} from './tetris';
import { PIECES } from './pieces';

const seededRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

describe('evaluateBoard', () => {
  it('penalizes holes', () => {
    // Same silhouette (height 2 in col 0, height 1 elsewhere), but one has a hole.
    const solid = createBoard();
    solid[ROWS - 1][0] = 1;
    solid[ROWS - 2][0] = 1;
    for (let c = 1; c < COLS; c++) solid[ROWS - 1][c] = 1;

    const holed = createBoard();
    holed[ROWS - 2][0] = 1; // covers an empty cell below → 1 hole
    for (let c = 1; c < COLS; c++) holed[ROWS - 1][c] = 1;

    expect(evaluateBoard(solid)).toBeGreaterThan(evaluateBoard(holed));
  });

  it('rewards a complete line clear', () => {
    const full = createBoard();
    for (let c = 0; c < COLS; c++) full[ROWS - 1][c] = 1;
    const empty = createBoard();
    expect(evaluateBoard(full)).toBeGreaterThan(evaluateBoard(empty));
  });
});

describe('planBestMove', () => {
  it('returns a plan for a fresh game', () => {
    const game = createGame(seededRng(1));
    const plan = planBestMove(game);
    expect(plan).not.toBeNull();
    expect(plan!.rotation).toBeGreaterThanOrEqual(0);
    expect(plan!.rotation).toBeLessThan(game.active.piece.rotations.length);
  });

  it('chooses a column that completes a nearly-full bottom row when possible', () => {
    // Bottom row missing only the rightmost cell — an I piece vertical or O/J/L can fill it.
    let game = createGame(seededRng(10));
    const board = createBoard();
    for (let c = 0; c < COLS - 1; c++) board[ROWS - 1][c] = 1;

    // Force an O piece (2x2) — placing it at x=8 fills the gap and stacks.
    // Better: force a vertical I that can drop into the gap.
    const iPiece = PIECES.find((p) => p.name === 'I')!;
    game = {
      ...game,
      board,
      active: { piece: iPiece, rotation: 0, x: 3, y: 0 },
      next: iPiece,
    };

    const plan = planBestMove(game);
    expect(plan).not.toBeNull();

    // Apply the plan and confirm the bottom row was cleared (or at least filled).
    let state = game;
    const actions = planToActions(state, plan!);
    for (const action of actions) {
      state = applyAiAction(state, action, seededRng(99));
    }
    // After hard drop, either the line cleared (bottom empty/shifted) or the gap was filled.
    const gapFilledOrCleared =
      state.board[ROWS - 1].every((c) => c !== 0) ||
      state.lines > game.lines ||
      state.board[ROWS - 1][COLS - 1] !== 0;
    expect(gapFilledOrCleared).toBe(true);
  });

  it('returns null when the game is over', () => {
    const game = { ...createGame(seededRng(1)), gameOver: true };
    expect(planBestMove(game)).toBeNull();
  });
});

describe('planToActions / applyAiAction', () => {
  it('produces a hardDrop as the final action', () => {
    const game = createGame(seededRng(2));
    const plan = planBestMove(game)!;
    const actions = planToActions(game, plan);
    expect(actions[actions.length - 1]).toBe('hardDrop');
  });

  it('nextAiAction eventually locks a piece', () => {
    let game = createGame(seededRng(3));
    const beforeFilled = game.board.flat().filter((c) => c !== 0).length;
    // Cap steps so a bug can't hang the test.
    for (let i = 0; i < 40; i++) {
      const action = nextAiAction(game);
      expect(action).not.toBeNull();
      game = applyAiAction(game, action!, seededRng(3));
      if (game.board.flat().filter((c) => c !== 0).length > beforeFilled) break;
    }
    expect(game.board.flat().some((c) => c !== 0)).toBe(true);
  });
});

describe('dropToFloor', () => {
  it('lands on the floor of an empty board', () => {
    const game = createGame(seededRng(4));
    const landed = dropToFloor(game.board, game.active);
    expect(landed.y).toBeGreaterThan(game.active.y);
    // Calling again is idempotent — already resting.
    expect(dropToFloor(game.board, landed)).toEqual(landed);
  });
});

describe('AI survival', () => {
  it('survives many pieces without an immediate game over', () => {
    let game = createGame(seededRng(42), 1);
    for (let piece = 0; piece < 30 && !game.gameOver; piece++) {
      for (let step = 0; step < 50; step++) {
        const action = nextAiAction(game);
        if (!action) break;
        const beforePiece = game.active.piece.name;
        const beforeY = game.active.y;
        game = applyAiAction(game, action, seededRng(42 + piece));
        if (action === 'hardDrop') break;
        // Soft progress: either piece changed (locked) or position changed.
        if (
          game.active.piece.name !== beforePiece ||
          game.active.y !== beforeY ||
          game.gameOver
        ) {
          break;
        }
      }
    }
    expect(game.gameOver).toBe(false);
    expect(game.lines).toBeGreaterThanOrEqual(0);
  });

  it('hardDrop via AI matches manual hardDrop when already aligned', () => {
    const game = createGame(seededRng(8));
    const plan = planBestMove(game)!;
    // Manually align, then compare.
    let aligned = game;
    while (aligned.active.rotation !== plan.rotation) {
      aligned = applyAiAction(aligned, 'rotate');
    }
    while (aligned.active.x < plan.x) aligned = applyAiAction(aligned, 'right');
    while (aligned.active.x > plan.x) aligned = applyAiAction(aligned, 'left');

    const viaAi = applyAiAction(aligned, 'hardDrop', seededRng(1));
    const viaManual = hardDrop(aligned, seededRng(1));
    expect(viaAi.board).toEqual(viaManual.board);
    expect(viaAi.score).toBe(viaManual.score);
  });
});
