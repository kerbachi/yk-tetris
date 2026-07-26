import './style.css';
import { createBackground } from './background';
import {
  COLS,
  GameState,
  ROWS,
  activeMatrix,
  clampDifficulty,
  createGame,
  dropInterval,
  ghostPiece,
  hardDrop,
  move,
  rotate,
  showGhost,
  tick,
} from './game/tetris';
import { PIECE_COLORS, Piece } from './game/pieces';

const CELL = 30;

const background = createBackground(document.getElementById('bg') as HTMLCanvasElement);

const boardCanvas = document.getElementById('board') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next') as HTMLCanvasElement;
const ctx = boardCanvas.getContext('2d')!;
const nextCtx = nextCanvas.getContext('2d')!;

const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const statusEl = document.getElementById('status')!;
const startBtn = document.getElementById('start')!;

const modalEl = document.getElementById('gameover-modal')!;
const finalScoreEl = document.getElementById('final-score')!;
const finalLinesEl = document.getElementById('final-lines')!;
const finalLevelEl = document.getElementById('final-level')!;
const playAgainBtn = document.getElementById('play-again')!;
const difficultyGroups = Array.from(
  document.querySelectorAll<HTMLElement>('.difficulty'),
);
const difficultyPanel = document.getElementById('difficulty-panel')!;

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
  // Bring the side-panel difficulty selector back once the game ends.
  difficultyPanel.classList.remove('hidden');
  // Turn all floating background blocks red on defeat.
  background.setDefeated(true);
};

const hideGameOver = () => modalEl.classList.add('hidden');

let state: GameState | null = null;
let paused = false;
let lastTick = 0;
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

// Landing-shadow cell: translucent fill plus a dashed outline in the piece color.
const drawGhostCell = (x: number, y: number, color: string) => {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  ctx.restore();
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

  // Landing shadow (ghost) — only on the easiest difficulties, and only when it
  // sits below the active piece so it does not clutter the piece itself.
  if (showGhost(state)) {
    const ghost = ghostPiece(state);
    if (ghost.y > state.active.y) {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] === 0) continue;
          drawGhostCell(ghost.x + c, ghost.y + r, state.active.piece.color);
        }
      }
    }
  }

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

const loop = (timestamp: number) => {
  if (state && !state.gameOver && !paused) {
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

const startGame = () => {
  state = createGame(Math.random, selectedDifficulty);
  paused = false;
  lastTick = performance.now();
  statusEl.textContent = 'Playing';
  hideGameOver();
  // Hide the side-panel difficulty selector while a game is in progress.
  difficultyPanel.classList.add('hidden');
  // Restore the normal multi-colored background for a fresh game.
  background.setDefeated(false);
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
};

window.addEventListener('keydown', (e) => {
  if (!state || state.gameOver) return;
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
    case 'p':
    case 'P':
      paused = !paused;
      statusEl.textContent = paused ? 'Paused' : 'Playing';
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

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

syncDifficultyButtons();
render();
