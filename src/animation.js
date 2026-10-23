export const DURATION = 16;
export const LOGO = Object.freeze(['11111', '01110', '10001', '10001', '10001', '01110', '11111']);

export function logoCells(width) {
  if (!Number.isInteger(width) || width < 5) throw new Error('Grid width must be at least five columns for the logo.');
  const left = Math.floor((width - 5) / 2);
  return LOGO.flatMap((row, y) => [...row].flatMap((bit, x) => bit === '1' ? [{ x: left + x, y }] : []));
}

export function sourceKeyframes(cell, width) {
  const center = (width - 1) / 2;
  const start = 2 + (1 - Math.abs(cell.x - center) / center) * 5 + cell.y / 30;
  return [[0, 1], [start, 1], [start + 0.8, 0], [13, 0], [16, 1]];
}

export function logoKeyframes(index) {
  const start = 6 + index / 21 * 3.4;
  return [[0, 0], [start, 0], [start + 0.6, 1], [10, 1], [10.75, 0.84], [11.5, 1], [12.25, 0.84], [13, 1], [16, 0]];
}

function interpolate(points, time) {
  if (!Number.isFinite(time)) throw new Error('Animation time must be finite.');
  const t = ((time % DURATION) + DURATION) % DURATION;
  for (let i = 1; i < points.length; i++) {
    const [end, to] = points[i];
    if (t <= end) {
      const [start, from] = points[i - 1];
      return end === start ? to : from + (to - from) * (t - start) / (end - start);
    }
  }
  return points.at(-1)[1];
}

export const sourceOpacity = (cell, width, time) => interpolate(sourceKeyframes(cell, width), time);
export const logoOpacity = (index, time) => interpolate(logoKeyframes(index), time);

/** Useful for alternative renderers and frame-by-frame inspection. */
export function sampleFrame(grid, time) {
  const logo = new Map(logoCells(grid.width).map((cell, i) => [`${cell.x},${cell.y}`, i]));
  return grid.cells.map(cell => {
    const index = logo.get(`${cell.x},${cell.y}`);
    return { ...cell, contributionOpacity: sourceOpacity(cell, grid.width, time), logoOpacity: index === undefined ? 0 : logoOpacity(index, time) };
  });
}
