/** Classic Tetris engine with SRS-lite wall kicks */

export const COLS = 10;
export const ROWS = 20;

export const COLORS = {
  I: { fill: "#2fd6c0", edge: "#9ff5ea" },
  O: { fill: "#f0c94d", edge: "#ffe9a0" },
  T: { fill: "#5eb0ff", edge: "#b7d9ff" },
  S: { fill: "#6fdb6a", edge: "#b8f5b5" },
  Z: { fill: "#ff6b6b", edge: "#ffb3b3" },
  J: { fill: "#6b8cff", edge: "#b3c4ff" },
  L: { fill: "#ff8a4c", edge: "#ffc4a3" },
  GHOST: "rgba(232, 241, 248, 0.18)",
};

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const TYPES = Object.keys(SHAPES);

const KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
  [-2, 0],
  [2, 0],
];

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function bagRandomizer() {
  let bag = [];
  return function next() {
    if (bag.length === 0) {
      bag = [...TYPES].sort(() => Math.random() - 0.5);
    }
    return bag.pop();
  };
}

export class TetrisGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = emptyBoard();
    this.nextPiece = bagRandomizer();
    this.holdType = null;
    this.canHold = true;
    this.queue = [this.nextPiece(), this.nextPiece(), this.nextPiece()];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.gameOver = false;
    this.paused = false;
    this.dropMs = 800;
    this.softDropping = false;
    this.piece = null;
    this.spawn();
  }

  get dropInterval() {
    const base = Math.max(100, 800 - (this.level - 1) * 70);
    return this.softDropping ? Math.max(40, base / 12) : base;
  }

  spawn() {
    const type = this.queue.shift();
    this.queue.push(this.nextPiece());
    const matrix = SHAPES[type][0];
    this.piece = {
      type,
      rot: 0,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    };
    this.canHold = true;
    if (this.collides(this.piece.x, this.piece.y, this.matrix())) {
      this.gameOver = true;
    }
  }

  matrix(type = this.piece.type, rot = this.piece.rot) {
    const frames = SHAPES[type];
    return frames[rot % frames.length];
  }

  collides(x, y, matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  move(dx, dy) {
    if (this.gameOver || this.paused || !this.piece) return false;
    const nx = this.piece.x + dx;
    const ny = this.piece.y + dy;
    if (!this.collides(nx, ny, this.matrix())) {
      this.piece.x = nx;
      this.piece.y = ny;
      if (dy > 0 && this.softDropping) this.score += 1;
      return true;
    }
    return false;
  }

  rotate() {
    if (this.gameOver || this.paused || !this.piece) return false;
    if (this.piece.type === "O") return true;
    const frames = SHAPES[this.piece.type];
    const nextRot = (this.piece.rot + 1) % frames.length;
    const nextMatrix = frames[nextRot];
    for (const [kx, ky] of KICKS) {
      const nx = this.piece.x + kx;
      const ny = this.piece.y + ky;
      if (!this.collides(nx, ny, nextMatrix)) {
        this.piece.rot = nextRot;
        this.piece.x = nx;
        this.piece.y = ny;
        return true;
      }
    }
    return false;
  }

  hardDrop() {
    if (this.gameOver || this.paused || !this.piece) {
      return { dist: 0, result: null };
    }
    let dist = 0;
    while (!this.collides(this.piece.x, this.piece.y + 1, this.matrix())) {
      this.piece.y += 1;
      dist += 1;
      this.score += 2;
    }
    const result = this.lock();
    return { dist, result };
  }

  hold() {
    if (this.gameOver || this.paused || !this.piece || !this.canHold) return false;
    const current = this.piece.type;
    if (this.holdType) {
      const swap = this.holdType;
      this.holdType = current;
      this.piece = {
        type: swap,
        rot: 0,
        x: Math.floor((COLS - SHAPES[swap][0][0].length) / 2),
        y: 0,
      };
      if (this.collides(this.piece.x, this.piece.y, this.matrix())) {
        this.gameOver = true;
      }
    } else {
      this.holdType = current;
      this.spawn();
    }
    this.canHold = false;
    return true;
  }

  ghostY() {
    if (!this.piece) return 0;
    let y = this.piece.y;
    while (!this.collides(this.piece.x, y + 1, this.matrix())) y += 1;
    return y;
  }

  lock() {
    const m = this.matrix();
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const y = this.piece.y + r;
        const x = this.piece.x + c;
        if (y < 0) {
          this.gameOver = true;
          return { linesCleared: 0, pieces: 0 };
        }
        this.board[y][x] = this.piece.type;
      }
    }

    const cleared = this.clearLines();
    if (cleared > 0) {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const table = [0, 100, 300, 500, 800];
      this.score += (table[cleared] || 800) * this.level;
      if (this.combo > 1) this.score += 50 * (this.combo - 1) * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = 0;
    }

    this.spawn();
    return {
      linesCleared: cleared,
      pieces: 1,
      isTetris: cleared === 4,
      isDouble: cleared === 2,
      combo: this.combo,
    };
  }

  clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((cell) => cell)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(null));
        cleared += 1;
        r += 1;
      }
    }
    return cleared;
  }

  tick() {
    if (this.gameOver || this.paused) return null;
    if (!this.move(0, 1)) {
      return this.lock();
    }
    return null;
  }
}

export function drawPiecePreview(canvas, type) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 80;
  const cssH = canvas.clientHeight || 80;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!type) return;

  const matrix = SHAPES[type][0];
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cell = Math.min(cssW / (cols + 1), cssH / (rows + 1));
  const ox = (cssW - cols * cell) / 2;
  const oy = (cssH - rows * cell) / 2;
  const color = COLORS[type];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!matrix[r][c]) continue;
      paintCell(ctx, ox + c * cell, oy + r * cell, cell, color.fill, color.edge);
    }
  }
}

export function paintCell(ctx, x, y, size, fill, edge) {
  const pad = Math.max(1, size * 0.06);
  const s = size - pad * 2;
  const r = Math.max(2, size * 0.16);
  roundRect(ctx, x + pad, y + pad, s, s, r);
  const grad = ctx.createLinearGradient(x, y, x, y + size);
  grad.addColorStop(0, edge);
  grad.addColorStop(0.45, fill);
  grad.addColorStop(1, shade(fill, -28));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.stroke();

  // gloss
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRect(ctx, x + pad + s * 0.12, y + pad + s * 0.1, s * 0.45, s * 0.18, r / 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shade(hex, amt) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function renderBoard(canvas, game) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 600;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cell = Math.min(cssW / COLS, cssH / ROWS);
  const boardW = cell * COLS;
  const boardH = cell * ROWS;
  const ox = (cssW - boardW) / 2;
  const oy = (cssH - boardH) / 2;

  // well
  ctx.fillStyle = "#06101c";
  ctx.fillRect(ox, oy, boardW, boardH);

  // grid
  ctx.strokeStyle = "rgba(143, 190, 214, 0.08)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(ox + c * cell, oy);
    ctx.lineTo(ox + c * cell, oy + boardH);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(ox, oy + r * cell);
    ctx.lineTo(ox + boardW, oy + r * cell);
    ctx.stroke();
  }

  // locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = game.board[r][c];
      if (!t) continue;
      const color = COLORS[t];
      paintCell(ctx, ox + c * cell, oy + r * cell, cell, color.fill, color.edge);
    }
  }

  if (!game.piece) return;

  // ghost
  const gy = game.ghostY();
  const m = game.matrix();
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const x = ox + (game.piece.x + c) * cell;
      const y = oy + (gy + r) * cell;
      ctx.fillStyle = COLORS.GHOST;
      const pad = cell * 0.12;
      roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.12);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,241,248,0.28)";
      ctx.stroke();
    }
  }

  // active piece
  const color = COLORS[game.piece.type];
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const y = game.piece.y + r;
      if (y < 0) continue;
      paintCell(
        ctx,
        ox + (game.piece.x + c) * cell,
        oy + y * cell,
        cell,
        color.fill,
        color.edge
      );
    }
  }
}
