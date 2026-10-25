import type { CalendarGrid, CellPosition, Keyframe, SampledCell } from './types.js';

export const DURATION = 16;
export const LOGO = Object.freeze([
  '11111',
  '01110',
  '10001',
  '10001',
  '10001',
  '01110',
  '11111',
]);

const LOGO_WIDTH = 5;
const LOGO_CELL_COUNT = 22;

// All times are seconds. Keyframes are [time, opacity] pairs.
const TIMING = {
  fadeStart: 2,
  columnStagger: 5,
  rowStaggerDivisor: 30,
  fadeDuration: 0.8,
  logoStart: 6,
  logoStagger: 3.4,
  logoFadeDuration: 0.6,
  restoreStart: 13,
};

export function logoCells(width: number): CellPosition[] {
  if (!Number.isInteger(width) || width < LOGO_WIDTH) {
    throw new Error('Grid width must be at least five columns for the logo.');
  }

  const left = Math.floor((width - LOGO_WIDTH) / 2);
  const cells: CellPosition[] = [];

  for (const [y, row] of LOGO.entries()) {
    for (const [x, bit] of [...row].entries()) {
      if (bit === '1') {
        cells.push({ x: left + x, y });
      }
    }
  }

  return cells;
}

export function sourceKeyframes(cell: CellPosition, width: number): Keyframe[] {
  const center = (width - 1) / 2;
  // Outer columns fade first; rows add a small stagger within each column.
  const distanceFromCenter = Math.abs(cell.x - center);
  const inwardProgress = 1 - distanceFromCenter / center;
  const start = TIMING.fadeStart
    + inwardProgress * TIMING.columnStagger
    + cell.y / TIMING.rowStaggerDivisor;

  return [
    [0, 1],
    [start, 1],
    [start + TIMING.fadeDuration, 0],
    [TIMING.restoreStart, 0],
    [DURATION, 1],
  ];
}

export function logoKeyframes(index: number): Keyframe[] {
  const revealProgress = index / (LOGO_CELL_COUNT - 1);
  const start = TIMING.logoStart + revealProgress * TIMING.logoStagger;

  return [
    [0, 0],
    [start, 0],
    [start + TIMING.logoFadeDuration, 1],
    [10, 1],
    [10.75, 0.84],
    [11.5, 1],
    [12.25, 0.84],
    [TIMING.restoreStart, 1],
    [DURATION, 0],
  ];
}

function interpolate(points: Keyframe[], time: number): number {
  if (!Number.isFinite(time)) {
    throw new Error('Animation time must be finite.');
  }

  // The second modulo also wraps negative times into the current loop.
  const loopTime = ((time % DURATION) + DURATION) % DURATION;

  for (let i = 1; i < points.length; i++) {
    const [endTime, endOpacity] = points[i];
    if (loopTime > endTime) {
      continue;
    }

    const [startTime, startOpacity] = points[i - 1];
    if (endTime === startTime) {
      return endOpacity;
    }

    return startOpacity
      + (endOpacity - startOpacity) * (loopTime - startTime) / (endTime - startTime);
  }

  return points[points.length - 1][1];
}

export function sourceOpacity(cell: CellPosition, width: number, time: number): number {
  return interpolate(sourceKeyframes(cell, width), time);
}

export function logoOpacity(index: number, time: number): number {
  return interpolate(logoKeyframes(index), time);
}

/** Useful for alternative renderers and frame-by-frame inspection. */
export function sampleFrame(grid: CalendarGrid, time: number): SampledCell[] {
  const logoIndexByPosition = new Map(
    logoCells(grid.width).map((cell, index) => [`${cell.x},${cell.y}`, index]),
  );

  return grid.cells.map(cell => {
    const logoIndex = logoIndexByPosition.get(`${cell.x},${cell.y}`);

    return {
      ...cell,
      contributionOpacity: sourceOpacity(cell, grid.width, time),
      logoOpacity: logoIndex === undefined ? 0 : logoOpacity(logoIndex, time),
    };
  });
}
