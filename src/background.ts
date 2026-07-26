import { PIECES } from './game/pieces';

// Colour every block turns to when the player loses.
const DEFEAT_COLOR = '#ff3b47';

interface FloatingBlock {
  pieceIndex: number;
  x: number;
  y: number;
  cell: number;
  angle: number;
  angularVelocity: number;
  vx: number;
  vy: number;
  alpha: number;
}

// Bounce a coordinate off the [0, max] edges, reversing velocity so the block
// (kept `radius` away from the edge) stays fully on screen.
export const bounce = (
  value: number,
  velocity: number,
  max: number,
  radius: number,
): { value: number; velocity: number } => {
  const min = radius;
  const upper = max - radius;
  // Block is larger than the viewport dimension: keep it centered.
  if (upper <= min) return { value: max / 2, velocity };
  if (value < min) return { value: min, velocity: Math.abs(velocity) };
  if (value > upper) return { value: upper, velocity: -Math.abs(velocity) };
  return { value, velocity };
};

export interface Background {
  setDefeated: (defeated: boolean) => void;
}

export const createBackground = (canvas: HTMLCanvasElement): Background => {
  const ctx = canvas.getContext('2d')!;
  let blocks: FloatingBlock[] = [];
  let defeated = false;

  const randomBlock = (): FloatingBlock => ({
    pieceIndex: Math.floor(Math.random() * PIECES.length),
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    cell: 12 + Math.random() * 22,
    angle: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() - 0.5) * 0.012,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4 - 0.12,
    alpha: 0.1 + Math.random() * 0.16,
  });

  const spawnBlocks = () => {
    const count = Math.max(
      10,
      Math.round((canvas.width * canvas.height) / 90000),
    );
    blocks = Array.from({ length: count }, randomBlock);
  };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const drawBlock = (block: FloatingBlock) => {
    const piece = PIECES[block.pieceIndex];
    const matrix = piece.rotations[0];
    const color = defeated ? DEFEAT_COLOR : piece.color;
    const rows = matrix.length;
    const cols = matrix[0].length;

    ctx.save();
    ctx.translate(block.x, block.y);
    ctx.rotate(block.angle);
    ctx.globalAlpha = defeated ? Math.min(0.92, block.alpha * 3.6) : block.alpha;
    ctx.fillStyle = color;
    const offsetX = -(cols * block.cell) / 2;
    const offsetY = -(rows * block.cell) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 0) continue;
        ctx.fillRect(
          offsetX + c * block.cell,
          offsetY + r * block.cell,
          block.cell - 2,
          block.cell - 2,
        );
      }
    }
    ctx.restore();
  };

  const step = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const block of blocks) {
      block.x += block.vx;
      block.y += block.vy;
      block.angle += block.angularVelocity;
      // Bounce off the edges (reverse velocity) instead of wrapping around.
      const radius = Math.max(matrixWidth(block), matrixHeight(block)) / 2;
      const bx = bounce(block.x, block.vx, canvas.width, radius);
      block.x = bx.value;
      block.vx = bx.velocity;
      const by = bounce(block.y, block.vy, canvas.height, radius);
      block.y = by.value;
      block.vy = by.velocity;
      drawBlock(block);
    }
    requestAnimationFrame(step);
  };

  const matrixWidth = (block: FloatingBlock) =>
    PIECES[block.pieceIndex].rotations[0][0].length * block.cell;
  const matrixHeight = (block: FloatingBlock) =>
    PIECES[block.pieceIndex].rotations[0].length * block.cell;

  resize();
  spawnBlocks();
  window.addEventListener('resize', () => {
    resize();
    if (blocks.length === 0) spawnBlocks();
  });
  requestAnimationFrame(step);

  return {
    setDefeated: (value: boolean) => {
      defeated = value;
    },
  };
};
