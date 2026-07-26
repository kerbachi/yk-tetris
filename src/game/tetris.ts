import { Matrix, Piece, randomPiece } from './pieces';

export const COLS = 10;
export const ROWS = 20;

// Player-selectable difficulty. The chosen difficulty is the starting level,
// which sets the initial fall speed; the level still ramps up as lines clear.
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export const clampDifficulty = (difficulty: number): number =>
  Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.floor(difficulty)));

export interface ActivePiece {
  piece: Piece;
  rotation: number;
  x: number;
  y: number;
}

export interface GameState {
  board: Matrix;
  active: ActivePiece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  difficulty: number;
  gameOver: boolean;
}

export const createBoard = (): Matrix =>
  Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));

const spawn = (piece: Piece): ActivePiece => {
  const matrix = piece.rotations[0];
  const x = Math.floor((COLS - matrix[0].length) / 2);
  return { piece, rotation: 0, x, y: 0 };
};

export const createGame = (
  rng: () => number = Math.random,
  difficulty = MIN_DIFFICULTY,
): GameState => {
  const level = clampDifficulty(difficulty);
  const first = randomPiece(rng);
  return {
    board: createBoard(),
    active: spawn(first),
    next: randomPiece(rng),
    score: 0,
    lines: 0,
    level,
    difficulty: level,
    gameOver: false,
  };
};

export const activeMatrix = (active: ActivePiece): Matrix =>
  active.piece.rotations[active.rotation];

export const collides = (board: Matrix, active: ActivePiece): boolean => {
  const matrix = activeMatrix(active);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 0) continue;
      const boardX = active.x + c;
      const boardY = active.y + r;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
      if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
    }
  }
  return false;
};

export const move = (state: GameState, dx: number, dy: number): GameState => {
  if (state.gameOver) return state;
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (!collides(state.board, candidate)) {
    return { ...state, active: candidate };
  }
  return state;
};

export const rotate = (state: GameState): GameState => {
  if (state.gameOver) return state;
  const rotation = (state.active.rotation + 1) % state.active.piece.rotations.length;
  // Basic wall-kick: try current x, then nudge left/right by 1 or 2.
  for (const dx of [0, -1, 1, -2, 2]) {
    const candidate = { ...state.active, rotation, x: state.active.x + dx };
    if (!collides(state.board, candidate)) {
      return { ...state, active: candidate };
    }
  }
  return state;
};

const merge = (board: Matrix, active: ActivePiece): Matrix => {
  const result = board.map((row) => row.slice());
  const matrix = activeMatrix(active);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 0) continue;
      const boardY = active.y + r;
      const boardX = active.x + c;
      if (boardY >= 0) result[boardY][boardX] = matrix[r][c];
    }
  }
  return result;
};

export const clearLines = (board: Matrix): { board: Matrix; cleared: number } => {
  const remaining = board.filter((row) => row.some((cell) => cell === 0));
  const cleared = ROWS - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => new Array<number>(COLS).fill(0));
  return { board: [...emptyRows, ...remaining], cleared };
};

const LINE_SCORES = [0, 100, 300, 500, 800];

export const lockPiece = (state: GameState, rng: () => number = Math.random): GameState => {
  const merged = merge(state.board, state.active);
  const { board, cleared } = clearLines(merged);
  const lines = state.lines + cleared;
  // Level starts at the chosen difficulty and rises every 10 cleared lines.
  const level = state.difficulty + Math.floor(lines / 10);
  const score = state.score + LINE_SCORES[cleared] * state.level;

  const nextActive = spawn(state.next);
  const upcoming = randomPiece(rng);
  const gameOver = collides(board, nextActive);

  return {
    board,
    active: nextActive,
    next: upcoming,
    score,
    lines,
    level,
    difficulty: state.difficulty,
    gameOver,
  };
};

// Advance one gravity tick: move down if possible, otherwise lock the piece.
export const tick = (state: GameState, rng: () => number = Math.random): GameState => {
  if (state.gameOver) return state;
  const moved = move(state, 0, 1);
  if (moved !== state) return moved;
  return lockPiece(state, rng);
};

// The position where the active piece would land if dropped straight down.
export const ghostPiece = (state: GameState): ActivePiece => {
  let current = state.active;
  while (!collides(state.board, { ...current, y: current.y + 1 })) {
    current = { ...current, y: current.y + 1 };
  }
  return current;
};

// Beginner aid: show the landing shadow only on the two easiest difficulties.
export const showGhost = (state: GameState): boolean => state.difficulty <= 2;

export const hardDrop = (state: GameState, rng: () => number = Math.random): GameState => {
  if (state.gameOver) return state;
  return lockPiece({ ...state, active: ghostPiece(state) }, rng);
};

// Milliseconds between gravity ticks for the current level.
// Level 1 stays gentle (1000ms); each level shaves 120ms so the difficulty
// 1-5 range spans a clear gradient, with a floor so it stays playable.
export const dropInterval = (level: number): number =>
  Math.max(150, 1000 - (level - 1) * 120);
