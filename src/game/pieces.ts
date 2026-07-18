export type Cell = number;
export type Matrix = Cell[][];

export interface Piece {
  name: string;
  color: string;
  rotations: Matrix[];
}

// Rotation states are pre-computed as matrices where 0 = empty and >0 = filled.
// The filled value is the color index used by the renderer.
const shape = (name: string, color: string, base: number[][]): Piece => {
  const rotations: Matrix[] = [];
  let current: Matrix = base.map((row) => row.slice());
  for (let i = 0; i < 4; i++) {
    rotations.push(current);
    current = rotateCW(current);
  }
  return { name, color, rotations };
};

export const rotateCW = (matrix: Matrix): Matrix => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Matrix = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return result;
};

const I = 1;
const J = 2;
const L = 3;
const O = 4;
const S = 5;
const T = 6;
const Z = 7;

export const PIECE_COLORS: Record<number, string> = {
  1: '#4ad7ff',
  2: '#4a6bff',
  3: '#ff9d4a',
  4: '#ffd84a',
  5: '#57e08a',
  6: '#c964ff',
  7: '#ff5f6d',
};

export const PIECES: Piece[] = [
  shape('I', PIECE_COLORS[I], [
    [0, 0, 0, 0],
    [I, I, I, I],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]),
  shape('J', PIECE_COLORS[J], [
    [J, 0, 0],
    [J, J, J],
    [0, 0, 0],
  ]),
  shape('L', PIECE_COLORS[L], [
    [0, 0, L],
    [L, L, L],
    [0, 0, 0],
  ]),
  shape('O', PIECE_COLORS[O], [
    [O, O],
    [O, O],
  ]),
  shape('S', PIECE_COLORS[S], [
    [0, S, S],
    [S, S, 0],
    [0, 0, 0],
  ]),
  shape('T', PIECE_COLORS[T], [
    [0, T, 0],
    [T, T, T],
    [0, 0, 0],
  ]),
  shape('Z', PIECE_COLORS[Z], [
    [Z, Z, 0],
    [0, Z, Z],
    [0, 0, 0],
  ]),
];

export const randomPiece = (rng: () => number = Math.random): Piece =>
  PIECES[Math.floor(rng() * PIECES.length)];
