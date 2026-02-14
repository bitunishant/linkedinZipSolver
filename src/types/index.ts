export interface GridCell {
  x: number;
  y: number;
  type: 'empty' | 'hurdle' | 'number';
  number?: number; // The number displayed on this cell (1, 2, 3, etc.)
}

export interface Hurdle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[];
  hurdles: Hurdle[];
}

export interface SolutionPath {
  x: number;
  y: number;
}

export interface ProcessImageResponse {
  success: boolean;
  grid?: Grid;
  error?: string;
}

export interface GameState {
  image: string | ImageData | null;
  grid: Grid | null;
  solutionPath: Array<[number, number]>;
  isProcessing: boolean;
  error: string | null;
}
