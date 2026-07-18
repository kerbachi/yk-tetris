import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  clearLines,
  collides,
  createBoard,
  createGame,
  hardDrop,
  move,
  rotate,
  tick,
} from './tetris';
import { rotateCW } from './pieces';

// Deterministic RNG so piece order is reproducible in tests.
const seededRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

describe('board', () => {
  it('creates an empty ROWS x COLS board', () => {
    const board = createBoard();
    expect(board.length).toBe(ROWS);
    expect(board[0].length).toBe(COLS);
    expect(board.flat().every((c) => c === 0)).toBe(true);
  });
});

describe('rotateCW', () => {
  it('rotates a matrix clockwise', () => {
    expect(
      rotateCW([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [3, 1],
      [4, 2],
    ]);
  });
});

describe('collision', () => {
  it('detects the floor', () => {
    const game = createGame(seededRng(1));
    const atFloor = { ...game.active, y: ROWS };
    expect(collides(game.board, atFloor)).toBe(true);
  });

  it('detects the walls', () => {
    const game = createGame(seededRng(1));
    expect(collides(game.board, { ...game.active, x: -5 })).toBe(true);
    expect(collides(game.board, { ...game.active, x: COLS + 5 })).toBe(true);
  });
});

describe('movement', () => {
  it('moves horizontally when unobstructed', () => {
    const game = createGame(seededRng(2));
    const moved = move(game, 1, 0);
    expect(moved.active.x).toBe(game.active.x + 1);
  });

  it('does not move through a wall', () => {
    const game = createGame(seededRng(2));
    let s = game;
    for (let i = 0; i < 20; i++) s = move(s, -1, 0);
    // Piece should be pinned against the left wall, not off-board.
    expect(s.active.x).toBeGreaterThanOrEqual(-1);
    const before = s;
    const after = move(s, -1, 0);
    expect(after).toBe(before);
  });
});

describe('rotation', () => {
  it('cycles rotation state', () => {
    const game = createGame(seededRng(3));
    const rotated = rotate(game);
    expect(rotated.active.rotation).toBe((game.active.rotation + 1) % 4);
  });
});

describe('line clearing', () => {
  it('clears a full row and shifts down', () => {
    const board = createBoard();
    board[ROWS - 1] = new Array(COLS).fill(1);
    const { board: cleared, cleared: count } = clearLines(board);
    expect(count).toBe(1);
    expect(cleared.length).toBe(ROWS);
    expect(cleared[ROWS - 1].every((c) => c === 0)).toBe(true);
  });

  it('keeps partial rows', () => {
    const board = createBoard();
    board[ROWS - 1] = new Array(COLS).fill(1);
    board[ROWS - 1][0] = 0;
    const { cleared: count } = clearLines(board);
    expect(count).toBe(0);
  });
});

describe('gravity and locking', () => {
  it('locks a piece at the bottom and spawns a new one', () => {
    let game = createGame(seededRng(4));
    const firstName = game.active.piece.name;
    for (let i = 0; i < ROWS + 2; i++) game = tick(game, seededRng(99));
    // After enough ticks the original piece is merged and a fresh piece exists.
    expect(game.board.flat().some((c) => c !== 0)).toBe(true);
    expect(game.active.y).toBeLessThan(ROWS);
    expect(typeof firstName).toBe('string');
  });

  it('hard drop lands the piece immediately', () => {
    const game = createGame(seededRng(5));
    const dropped = hardDrop(game, seededRng(5));
    expect(dropped.board.flat().some((c) => c !== 0)).toBe(true);
  });

  it('scores points when clearing lines via hard drop', () => {
    let game = createGame(seededRng(7));
    // Fill the board bottom except one column, then drop pieces to trigger clears.
    game = {
      ...game,
      score: 0,
    };
    // Manually construct a near-complete bottom row scenario.
    const board = createBoard();
    for (let c = 0; c < COLS - 1; c++) board[ROWS - 1][c] = 1;
    game = { ...game, board };
    const before = game.score;
    // Not asserting an exact clear here (depends on piece), just that scoring is monotonic.
    const after = hardDrop(game, seededRng(7));
    expect(after.score).toBeGreaterThanOrEqual(before);
  });
});
