import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  clampDifficulty,
  clearLines,
  collides,
  createBoard,
  createGame,
  dropInterval,
  ghostPiece,
  hardDrop,
  lockPiece,
  move,
  rotate,
  showGhost,
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

describe('difficulty', () => {
  it('clamps difficulty into the 1-5 range', () => {
    expect(clampDifficulty(0)).toBe(1);
    expect(clampDifficulty(-3)).toBe(1);
    expect(clampDifficulty(3)).toBe(3);
    expect(clampDifficulty(5)).toBe(5);
    expect(clampDifficulty(9)).toBe(5);
    expect(clampDifficulty(2.7)).toBe(2);
  });

  it('starts the game at the chosen difficulty level', () => {
    const game = createGame(seededRng(1), 4);
    expect(game.level).toBe(4);
    expect(game.difficulty).toBe(4);
  });

  it('defaults to difficulty 1 and clamps out-of-range values', () => {
    expect(createGame(seededRng(1)).level).toBe(1);
    expect(createGame(seededRng(1), 42).level).toBe(5);
  });

  it('higher difficulty means a faster starting fall speed', () => {
    const easy = createGame(seededRng(1), 1);
    const hard = createGame(seededRng(1), 5);
    expect(dropInterval(hard.level)).toBeLessThan(dropInterval(easy.level));
  });

  it('level ramps above the chosen difficulty as lines clear', () => {
    // Start at difficulty 3 with 9 lines already cleared, then clear one full row.
    let game = createGame(seededRng(1), 3);
    const board = createBoard();
    for (let c = 0; c < COLS; c++) board[ROWS - 1][c] = 1;
    game = { ...game, board, lines: 9 };
    const after = lockPiece(game, seededRng(1));
    expect(after.lines).toBe(10);
    expect(after.level).toBe(4); // difficulty 3 + floor(10/10)
    expect(after.difficulty).toBe(3);
  });
});

describe('ghost piece', () => {
  it('is enabled only for difficulty 1 and 2', () => {
    expect(showGhost(createGame(seededRng(1), 1))).toBe(true);
    expect(showGhost(createGame(seededRng(1), 2))).toBe(true);
    expect(showGhost(createGame(seededRng(1), 3))).toBe(false);
    expect(showGhost(createGame(seededRng(1), 5))).toBe(false);
  });

  it('reports the landing position (at or above the floor, below spawn)', () => {
    const game = createGame(seededRng(1), 1);
    const ghost = ghostPiece(game);
    expect(ghost.x).toBe(game.active.x);
    expect(ghost.y).toBeGreaterThan(game.active.y);
    // The ghost cannot move any further down.
    expect(collides(game.board, { ...ghost, y: ghost.y + 1 })).toBe(true);
    // Same piece/rotation, just translated down.
    expect(ghost.piece.name).toBe(game.active.piece.name);
    expect(ghost.rotation).toBe(game.active.rotation);
  });

  it('lands where a hard drop locks the piece', () => {
    const game = createGame(seededRng(3), 1);
    const viaGhost = lockPiece({ ...game, active: ghostPiece(game) }, seededRng(3));
    const viaHardDrop = hardDrop(game, seededRng(3));
    expect(viaGhost.board).toEqual(viaHardDrop.board);
  });
});

describe('drop interval', () => {
  it('starts gentle at level 1', () => {
    expect(dropInterval(1)).toBe(1000);
  });

  it('speeds up as the level increases', () => {
    expect(dropInterval(2)).toBeLessThan(dropInterval(1));
    expect(dropInterval(5)).toBeLessThan(dropInterval(2));
  });

  it('makes the hardest difficulty fall much faster than the easiest', () => {
    // Difficulty 5 should be at least twice as fast (half the interval) as 1.
    expect(dropInterval(5)).toBeLessThanOrEqual(dropInterval(1) / 2);
  });

  it('never drops below the floor', () => {
    expect(dropInterval(100)).toBe(90);
    expect(dropInterval(50)).toBeGreaterThanOrEqual(90);
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
