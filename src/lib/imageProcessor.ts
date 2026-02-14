import { Grid, Hurdle, GridCell } from '@/types';

export function analyzeImage(
  canvas: HTMLCanvasElement,
  imageData: ImageData
): Grid | null {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Sample approach: detect dominant colors
  const colorMap = new Map<string, number>();
  const pixelColors: string[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // Skip transparent pixels

    const color = `${r},${g},${b}`;
    colorMap.set(color, (colorMap.get(color) || 0) + 1);
    pixelColors.push(color);
  }

  // Estimate grid size (try common sizes)
  const estimatedGridSize = estimateGridDimensions(width, height);
  if (!estimatedGridSize) return null;

  const { rows, cols, cellWidth, cellHeight } = estimatedGridSize;

  console.log(`Grid estimated: ${rows}x${cols}, cell size: ${cellWidth}x${cellHeight}`);

  // Detect cells
  const cells: GridCell[] = [];
  const hurdles: Hurdle[] = [];
  const numberedCells: Array<{ x: number; y: number; type: 'number' }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col;
      const y = row;
      const cellType = detectCellType(
        canvas,
        imageData,
        col * cellWidth,
        row * cellHeight,
        cellWidth,
        cellHeight
      );

      cells.push({ x, y, type: cellType.type, number: cellType.number });

      if (cellType.type === 'hurdle') {
        hurdles.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        });
      } else if (cellType.type === 'number') {
        numberedCells.push({ x, y, type: 'number' });
      }
    }
  }

  // Assign sequential numbers to detected numbered cells (1, 2, 3, ...)
  // Sort by position: top-to-bottom, left-to-right
  numberedCells.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y; // Different rows
    return a.x - b.x; // Same row, sort by column
  });

  console.log(`Found ${numberedCells.length} numbered cells:`, numberedCells);

  // Update cells with assigned numbers
  numberedCells.forEach((cell, index) => {
    const cellIdx = cells.findIndex((c) => c.x === cell.x && c.y === cell.y);
    if (cellIdx >= 0) {
      cells[cellIdx].number = index + 1;
      console.log(`Assigned number ${index + 1} to cell (${cell.x}, ${cell.y})`);
    }
  });

  return {
    rows,
    cols,
    cells,
    hurdles,
  };
}

function estimateGridDimensions(
  width: number,
  height: number
): { rows: number; cols: number; cellWidth: number; cellHeight: number } | null {
  // Common LinkedIn Zip game sizes: 3x3, 4x4, 5x5
  const possibleSizes = [3, 4, 5, 6, 7];

  // Try to find the best fit by analyzing the image dimensions
  for (const size of possibleSizes) {
    const cellWidth = Math.floor(width / size);
    const cellHeight = Math.floor(height / size);

    // Check if this makes sense (cells should be roughly square-ish)
    if (cellWidth > 10 && cellHeight > 10) {
      return {
        rows: size,
        cols: size,
        cellWidth,
        cellHeight,
      };
    }
  }

  // Fallback: 5x5
  const cellWidth = Math.floor(width / 5);
  const cellHeight = Math.floor(height / 5);
  return {
    rows: 5,
    cols: 5,
    cellWidth,
    cellHeight,
  };
}

interface CellTypeResult {
  type: 'empty' | 'hurdle' | 'number';
  number?: number;
}

function detectCellType(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
): CellTypeResult {
  const data = imageData.data;
  const canvasWidth = imageData.width;

  let bluePixels = 0;
  let yellowPixels = 0;
  let totalPixels = 0;
  let darkPixels = 0; // Very dark (< 50)
  let veryDarkPixels = 0; // Black (< 30)
  let whitePixels = 0; // Very light (> 200)
  let greenPixels = 0;
  let grayPixels = 0;

  // Sample more pixels for better detection
  const step = Math.max(1, Math.floor(width / 20));
  
  for (let y = startY; y < startY + height; y += step) {
    for (let x = startX; x < startX + width; x += step) {
      if (x >= 0 && x < canvasWidth && y >= 0 && y < imageData.height) {
        const idx = (y * canvasWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 128) continue;

        totalPixels++;

        // Detect very bright/white pixels
        if (r > 200 && g > 200 && b > 200) {
          whitePixels++;
        }
        // Detect very dark/black pixels (< 30 for all channels)
        else if (r < 30 && g < 30 && b < 30) {
          veryDarkPixels++;
        }
        // Detect moderately dark pixels
        else if (r < 130 && g < 130 && b < 130) {
          darkPixels++;
        }
        // Detect blue/cyan (LinkedIn blue for hurdles, RGB around 0-50, 100-150, 150-220)
        else if (b > r && b > g && b > 100 && (b - r) > 30) {
          bluePixels++;
        }
        // Detect green
        else if (g > r && g > b && g > 100) {
          greenPixels++;
        }
        // Detect yellow
        else if (r > 130 && g > 130 && b < 120 && (r + g) > 250) {
          yellowPixels++;
        }
        // Detect gray
        else if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && r > 120) {
          grayPixels++;
        }
      }
    }
  }

  if (totalPixels === 0) return { type: 'empty' };

  const blueRatio = bluePixels / totalPixels;
  const yellowRatio = yellowPixels / totalPixels;
  const darkRatio = darkPixels / totalPixels;
  const veryDarkRatio = veryDarkPixels / totalPixels;
  const whiteRatio = whitePixels / totalPixels;
  const greenRatio = greenPixels / totalPixels;
  const grayRatio = grayPixels / totalPixels;

  console.log(`Cell at (${startX}, ${startY}): blue=${blueRatio.toFixed(2)}, yellow=${yellowRatio.toFixed(2)}, dark=${darkRatio.toFixed(2)}, veryDark=${veryDarkRatio.toFixed(2)}, white=${whiteRatio.toFixed(2)}, green=${greenRatio.toFixed(2)}, gray=${grayRatio.toFixed(2)}`);

  // Classify based on color dominance
  if (blueRatio > 0.25) {
    return { type: 'hurdle' }; // Blue = hurdle
  } 
  // Numbers with white text on black background (like badges)
  else if ((veryDarkRatio > 0.15 && whiteRatio > 0.05) || (veryDarkRatio > 0.2)) {
    return { type: 'number' };
  }
  // Numbers: has dark text or color variation in gray background
  else if (darkRatio > 0.15 || (veryDarkRatio > 0.05 && grayRatio > 0.3)) {
    return { type: 'number' };
  }
  // Yellow background
  else if (yellowRatio > 0.15) {
    return { type: 'number' };
  }

  return { type: 'empty' };
}

export function findSolutionPath(grid: Grid): Array<[number, number]> {
  // Find all numbered cells
  const numberedCells = grid.cells
    .filter((cell) => cell.type === 'number' && cell.number !== undefined && cell.number !== null)
    .sort((a, b) => (a.number || 0) - (b.number || 0));

  console.log('Numbered cells found:', numberedCells);

  if (numberedCells.length === 0) {
    // No numbered cells found, return simple path
    console.warn('No numbered cells found');
    return [[0, 0], [grid.cols - 1, grid.rows - 1]];
  }

  // Build path connecting all numbers sequentially (1 -> 2 -> 3 -> ... -> max)
  let fullPath: Array<[number, number]> = [];
  
  for (let i = 0; i < numberedCells.length - 1; i++) {
    const current = numberedCells[i];
    const next = numberedCells[i + 1];
    
    if (!current || !next) {
      console.warn('Current or next cell is null:', { current, next });
      continue;
    }
    
    const currentPos: [number, number] = [current.x, current.y];
    const nextPos: [number, number] = [next.x, next.y];
    
    console.log(`Finding path from (${currentPos[0]}, ${currentPos[1]}) to (${nextPos[0]}, ${nextPos[1]})`);
    
    // Find path between current and next number
    const segmentPath = findPathBFS(grid, currentPos, nextPos);
    
    console.log(`Segment path:`, segmentPath);
    
    // Add all but the last point (to avoid duplicates)
    fullPath = fullPath.concat(segmentPath.slice(0, -1));
  }
  
  // Add the final position
  if (numberedCells.length > 0) {
    const lastCell = numberedCells[numberedCells.length - 1];
    fullPath.push([lastCell.x, lastCell.y]);
  }
  
  console.log('Full path:', fullPath);
  
  return fullPath.length > 0 ? fullPath : [[0, 0]];
}

function findPathBFS(
  grid: Grid,
  start: [number, number],
  end: [number, number]
): Array<[number, number]> {
  const visited = new Set<string>();
  const queue: Array<{ pos: [number, number]; path: Array<[number, number]> }> = [
    { pos: start, path: [start] },
  ];

  const isHurdle = (x: number, y: number): boolean => {
    return grid.cells.some(
      (cell) => cell.x === x && cell.y === y && cell.type === 'hurdle'
    );
  };

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    const key = `${pos[0]},${pos[1]}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (pos[0] === end[0] && pos[1] === end[1]) {
      return path;
    }

    // Check all 4 directions
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = pos[0] + dx;
      const ny = pos[1] + dy;

      if (
        nx >= 0 &&
        nx < grid.cols &&
        ny >= 0 &&
        ny < grid.rows &&
        !isHurdle(nx, ny) &&
        !visited.has(`${nx},${ny}`)
      ) {
        queue.push({ pos: [nx, ny], path: [...path, [nx, ny]] });
      }
    }
  }

  // Return path from start to end even if not optimal
  return [start, end];
}
