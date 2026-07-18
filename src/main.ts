import './style.css';
import {
  COLS,
  GameState,
  ROWS,
  activeMatrix,
  createGame,
  dropInterval,
  hardDrop,
  move,
  rotate,
  tick,
} from './game/tetris';
import { PIECE_COLORS, Piece } from './game/pieces';

const CELL = 30;

const boardCanvas = document.getElementById('board') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next') as HTMLCanvasElement;
const ctx = boardCanvas.getContext('2d')!;
const nextCtx = nextCanvas.getContext('2d')!;

const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const statusEl = document.getElementById('status')!;
const startBtn = document.getElementById('start')!;

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

const loop = (timestamp: number) => {
  if (state && !state.gameOver && !paused) {
    if (timestamp - lastTick > dropInterval(state.level)) {
      state = tick(state);
      lastTick = timestamp;
      if (state.gameOver) statusEl.textContent = 'Game Over';
    }
  }
  render();
  rafId = requestAnimationFrame(loop);
};

const startGame = () => {
  state = createGame();
  paused = false;
  lastTick = performance.now();
  statusEl.textContent = 'Playing';
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
});

startBtn.addEventListener('click', startGame);

render();
