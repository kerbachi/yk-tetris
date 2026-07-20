import './style.css';
import {
  COLS,
  GameState,
  ROWS,
  activeMatrix,
  clampDifficulty,
  createGame,
  dropInterval,
  hardDrop,
  move,
  rotate,
  tick,
} from './game/tetris';
import { applyAiAction, nextAiAction } from './game/ai';
import { PIECE_COLORS, Piece } from './game/pieces';

const CELL = 30;
/** Delay between AI rotate/move/drop steps so play is watchable. */
const AI_STEP_MS = 90;

const boardCanvas = document.getElementById('board') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next') as HTMLCanvasElement;
const ctx = boardCanvas.getContext('2d')!;
const nextCtx = nextCanvas.getContext('2d')!;

const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const statusEl = document.getElementById('status')!;
const startBtn = document.getElementById('start')!;
const watchAiBtn = document.getElementById('watch-ai')!;

const modalEl = document.getElementById('gameover-modal')!;
const finalScoreEl = document.getElementById('final-score')!;
const finalLinesEl = document.getElementById('final-lines')!;
const finalLevelEl = document.getElementById('final-level')!;
const playAgainBtn = document.getElementById('play-again')!;
const playAgainAiBtn = document.getElementById('play-again-ai')!;
const difficultyGroups = Array.from(
  document.querySelectorAll<HTMLElement>('.difficulty'),
);

let selectedDifficulty = 1;

const syncDifficultyButtons = () => {
  for (const group of difficultyGroups) {
    for (const btn of Array.from(group.querySelectorAll('button'))) {
      const value = Number(btn.dataset.difficulty);
      btn.classList.toggle('active', value === selectedDifficulty);
    }
  }
};

for (const group of difficultyGroups) {
  group.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button');
    if (!target || !target.dataset.difficulty) return;
    selectedDifficulty = clampDifficulty(Number(target.dataset.difficulty));
    syncDifficultyButtons();
  });
}

const showGameOver = (game: GameState) => {
  finalScoreEl.textContent = String(game.score);
  finalLinesEl.textContent = String(game.lines);
  finalLevelEl.textContent = String(game.level);
  modalEl.classList.remove('hidden');
};

const hideGameOver = () => modalEl.classList.add('hidden');

let state: GameState | null = null;
let paused = false;
let aiMode = false;
let lastTick = 0;
let lastAiStep = 0;
let rafId = 0;

const drawCell = (
  target: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) => {
  target.fillStyle = color;
  target.fillRect(x * CELL, y * CELL, CELL, CELL);
  target.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  target.lineWidth = 2;
  target.strokeRect(x * CELL, y * CELL, CELL, CELL);
};

const render = () => {
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  if (!state) return;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell !== 0) drawCell(ctx, c, r, PIECE_COLORS[cell]);
    }
  }

  const matrix = activeMatrix(state.active);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 0) continue;
      drawCell(ctx, state.active.x + c, state.active.y + r, state.active.piece.color);
    }
  }

  renderNext(state.next);
  scoreEl.textContent = String(state.score);
  linesEl.textContent = String(state.lines);
  levelEl.textContent = String(state.level);
};

const renderNext = (piece: Piece) => {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const matrix = piece.rotations[0];
  const size = 24;
  const offsetX = (nextCanvas.width - matrix[0].length * size) / 2;
  const offsetY = (nextCanvas.height - matrix.length * size) / 2;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 0) continue;
      nextCtx.fillStyle = piece.color;
      nextCtx.fillRect(offsetX + c * size, offsetY + r * size, size, size);
      nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      nextCtx.lineWidth = 2;
      nextCtx.strokeRect(offsetX + c * size, offsetY + r * size, size, size);
    }
  }
};

const playingLabel = () => (aiMode ? 'AI Playing' : 'Playing');

const loop = (timestamp: number) => {
  if (state && !state.gameOver && !paused) {
    if (aiMode && timestamp - lastAiStep > AI_STEP_MS) {
      const action = nextAiAction(state);
      if (action) {
        state = applyAiAction(state, action);
        lastAiStep = timestamp;
        // Reset gravity clock after a hard drop so the next piece isn't rushed.
        if (action === 'hardDrop') lastTick = timestamp;
        if (state.gameOver) {
          statusEl.textContent = 'Game Over';
          showGameOver(state);
        }
      }
    }

    if (timestamp - lastTick > dropInterval(state.level)) {
      state = tick(state);
      lastTick = timestamp;
      if (state.gameOver) {
        statusEl.textContent = 'Game Over';
        showGameOver(state);
      }
    }
  }
  render();
  rafId = requestAnimationFrame(loop);
};

const startGame = (withAi: boolean) => {
  aiMode = withAi;
  state = createGame(Math.random, selectedDifficulty);
  paused = false;
  const now = performance.now();
  lastTick = now;
  lastAiStep = now;
  statusEl.textContent = playingLabel();
  hideGameOver();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
};

window.addEventListener('keydown', (e) => {
  if (!state || state.gameOver) return;

  if (e.key === 'p' || e.key === 'P') {
    paused = !paused;
    statusEl.textContent = paused ? 'Paused' : playingLabel();
    return;
  }

  // AI owns the controls while watching — only pause is allowed.
  if (aiMode) return;

  switch (e.key) {
    case 'ArrowLeft':
      state = move(state, -1, 0);
      break;
    case 'ArrowRight':
      state = move(state, 1, 0);
      break;
    case 'ArrowDown':
      state = move(state, 0, 1);
      break;
    case 'ArrowUp':
      state = rotate(state);
      break;
    case ' ':
      e.preventDefault();
      state = hardDrop(state);
      break;
    default:
      return;
  }
  render();
  if (state.gameOver) {
    statusEl.textContent = 'Game Over';
    showGameOver(state);
  }
});

startBtn.addEventListener('click', () => startGame(false));
watchAiBtn.addEventListener('click', () => startGame(true));
playAgainBtn.addEventListener('click', () => startGame(false));
playAgainAiBtn.addEventListener('click', () => startGame(true));

syncDifficultyButtons();
render();
