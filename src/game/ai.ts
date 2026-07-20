import { Matrix } from './pieces';
import {
  ActivePiece,
  COLS,
  GameState,
  ROWS,
  activeMatrix,
  clearLines,
  collides,
  hardDrop,
  move,
  rotate,
} from './tetris';

/** One discrete control the AI can issue. */
export type AiAction = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop';

export interface AiPlan {
  /** Target rotation index (0–3). */
  rotation: number;
  /** Target column for the piece origin. */
  x: number;
  /** Heuristic score of the resulting board (higher is better). */
  score: number;
}

// El-Tetris-style weights (Dellacherie / Thiery & Scherrer).
// Higher score = better placement.
const W_LINES = 0.76;
const W_HEIGHT = -0.51;
const W_HOLES = -0.36;
const W_BUMPINESS = -0.18;

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

/** Drop an active piece straight down to its resting y (no locking). */
export const dropToFloor = (board: Matrix, active: ActivePiece): ActivePiece => {
  let current = active;
  while (!collides(board, { ...current, y: current.y + 1 })) {
    current = { ...current, y: current.y + 1 };
  }
  return current;
};

const columnHeights = (board: Matrix): number[] => {
  const heights = new Array(COLS).fill(0);
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== 0) {
        heights[c] = ROWS - r;
        break;
      }
    }
  }
  return heights;
};

const countHoles = (board: Matrix): number => {
  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let seenBlock = false;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== 0) {
        seenBlock = true;
      } else if (seenBlock) {
        holes++;
      }
    }
  }
  return holes;
};

/** Score a locked board. Higher is better. */
export const evaluateBoard = (board: Matrix): number => {
  const { board: cleared, cleared: lines } = clearLines(board);
  const heights = columnHeights(cleared);
  const aggregateHeight = heights.reduce((a, b) => a + b, 0);
  const holes = countHoles(cleared);
  let bumpiness = 0;
  for (let c = 0; c < COLS - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c + 1]);
  }
  return (
    W_LINES * lines +
    W_HEIGHT * aggregateHeight +
    W_HOLES * holes +
    W_BUMPINESS * bumpiness
  );
};

/**
 * Find the best hard-drop placement for the current active piece.
 * Considers every rotation and every reachable column (ignoring gravity timing).
 */
export const planBestMove = (state: GameState): AiPlan | null => {
  if (state.gameOver) return null;

  let best: AiPlan | null = null;
  const rotationCount = state.active.piece.rotations.length;

  for (let rotation = 0; rotation < rotationCount; rotation++) {
    const matrix = state.active.piece.rotations[rotation];
    const width = matrix[0].length;
    // Allow origins that keep at least one filled cell on-board (same as collides).
    for (let x = -width + 1; x < COLS; x++) {
      const candidate: ActivePiece = {
        piece: state.active.piece,
        rotation,
        x,
        y: 0,
      };
      if (collides(state.board, candidate)) continue;
      const landed = dropToFloor(state.board, candidate);
      // Reject placements that somehow still collide (e.g. spawn overlap).
      if (collides(state.board, landed)) continue;
      const merged = merge(state.board, landed);
      const score = evaluateBoard(merged);
      if (!best || score > best.score) {
        best = { rotation, x, score };
      }
    }
  }

  return best;
};

/**
 * Translate a plan into a short sequence of actions from the current active piece.
 * Ends with a hard drop once rotation and column match.
 */
export const planToActions = (state: GameState, plan: AiPlan): AiAction[] => {
  const actions: AiAction[] = [];
  let rotation = state.active.rotation;
  const rotationCount = state.active.piece.rotations.length;
  let steps = 0;
  while (rotation !== plan.rotation && steps < rotationCount) {
    actions.push('rotate');
    rotation = (rotation + 1) % rotationCount;
    steps++;
  }

  const dx = plan.x - state.active.x;
  if (dx < 0) {
    for (let i = 0; i < -dx; i++) actions.push('left');
  } else if (dx > 0) {
    for (let i = 0; i < dx; i++) actions.push('right');
  }

  actions.push('hardDrop');
  return actions;
};

/** Apply a single AI action to the game state. */
export const applyAiAction = (
  state: GameState,
  action: AiAction,
  rng: () => number = Math.random,
): GameState => {
  switch (action) {
    case 'left':
      return move(state, -1, 0);
    case 'right':
      return move(state, 1, 0);
    case 'rotate':
      return rotate(state);
    case 'softDrop':
      return move(state, 0, 1);
    case 'hardDrop':
      return hardDrop(state, rng);
    default:
      return state;
  }
};

/**
 * Compute the next action the AI should take right now.
 * Re-plans from the live state each call so mid-fall corrections stay valid.
 */
export const nextAiAction = (state: GameState): AiAction | null => {
  const plan = planBestMove(state);
  if (!plan) return null;
  const actions = planToActions(state, plan);
  return actions[0] ?? null;
};
