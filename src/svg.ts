import { createHash } from 'node:crypto';
import { DURATION, logoCells, sourceKeyframes, logoKeyframes } from './animation.js';
import type { CalendarGrid, CellPosition, Keyframe, RenderMode, RenderOptions, Theme } from './types.js';

const CELL_SIZE = 12;
const CELL_PITCH = 16;
const PADDING = 8;
const GRID_ROWS = 7;

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

interface Palette {
  background: string;
  empty: string;
  border: string;
  levels: [string, string, string, string, string];
  logo: string;
}

interface SvgParts {
  shapes: string[];
  styles: string[];
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    background: '#0b1419',
    empty: '#18262d',
    border: '#203039',
    levels: ['#18262d', '#0e4429', '#006d32', '#26a641', '#39d353'],
    logo: '#39ff6a',
  },
  light: {
    background: '#f6f8fa',
    empty: '#e8ecef',
    border: '#dce2e7',
    levels: ['#e8ecef', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    logo: '#18b94c',
  },
};

export function escapeXml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, character => XML_ENTITIES[character]);
}

/** Self-contained SVG; CSS animations also work when embedded as an image. */
export function renderSvg(grid: CalendarGrid, options: RenderOptions = {}): string {
  const { username = 'GitHub user', theme = 'dark', mode = 'animated' } = options;
  validateRenderOptions(grid, theme, mode);

  const palette = PALETTES[theme];
  const prefix = createIdPrefix(grid, username, theme, mode);
  const animated = mode === 'animated';
  const width = canvasSize(grid.width);
  const height = canvasSize(GRID_ROWS);

  const contributions = mode === 'logo'
    ? { shapes: [], styles: [] }
    : renderContributions(grid, palette, prefix, animated);
  const logo = mode === 'calendar'
    ? { shapes: [], styles: [] }
    : renderLogo(grid.width, palette, prefix, animated);

  const styles = [...contributions.styles, ...logo.styles];
  if (animated) {
    styles.push(reducedMotionStyles(prefix));
  }

  const title = `${username} — ${mode === 'logo' ? 'Green Lantern symbol' : 'GitHub contribution calendar'}`;
  const animationDescription = animated
    ? 'Contribution lights fade inward into a Green Lantern symbol, then return. Sixteen-second loop.'
    : 'Static image.';
  const description = `${grid.from} to ${grid.to}. Seven rows, ${grid.width} weeks. ${animationDescription}`;

  // Keep the exported document compact, while keeping each part readable here.
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" id="${prefix}"`,
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-labelledby="${prefix}title ${prefix}desc"`,
    ` data-rows="7" data-columns="${grid.width}">`,
    `<title id="${prefix}title">${escapeXml(title)}</title>`,
    `<desc id="${prefix}desc">${escapeXml(description)}</desc>`,
    glowFilter(prefix),
    styles.length ? `<style>${styles.join('')}</style>` : '',
    `<rect width="${width}" height="${height}" rx="6" fill="${palette.background}"/>`,
    ...renderBaseCells(grid, palette),
    ...contributions.shapes,
    ...logo.shapes,
    '</svg>\n',
  ].join('');
}

function validateRenderOptions(grid: CalendarGrid, theme: Theme, mode: RenderMode): void {
  if (!Object.hasOwn(PALETTES, theme)) {
    throw new Error('Unknown theme; choose dark or light.');
  }
  if (!['animated', 'logo', 'calendar'].includes(mode)) {
    throw new Error('Unknown render mode.');
  }

  const validGrid = grid
    && grid.height === GRID_ROWS
    && Number.isInteger(grid.width)
    && grid.width >= 5
    && grid.cells.length === grid.width * GRID_ROWS;

  if (!validGrid) {
    throw new Error('Expected a seven-row grid with at least five columns.');
  }
}

function createIdPrefix(grid: CalendarGrid, username: string, theme: Theme, mode: RenderMode): string {
  const hash = createHash('sha256')
    .update(JSON.stringify([grid, username, theme, mode]))
    .digest('hex')
    .slice(0, 12);

  // Scope IDs and animations so multiple inline SVGs do not interfere.
  return `gl${hash}`;
}

function canvasSize(cellCount: number): number {
  const finalGap = CELL_PITCH - CELL_SIZE;
  return PADDING * 2 + cellCount * CELL_PITCH - finalGap;
}

function cellRect(cell: CellPosition, attributes: string): string {
  const x = PADDING + cell.x * CELL_PITCH;
  const y = PADDING + cell.y * CELL_PITCH;

  return `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="3" ${attributes}/>`;
}

function renderBaseCells(grid: CalendarGrid, palette: Palette): string[] {
  return grid.cells.map(cell => cellRect(
    cell,
    `class="base" fill="${palette.empty}" stroke="${palette.border}" stroke-width="0.5"`,
  ));
}

function renderContributions(
  grid: CalendarGrid,
  palette: Palette,
  prefix: string,
  animated: boolean,
): SvgParts {
  const shapes: string[] = [];
  const styles: string[] = [];

  for (const cell of grid.cells.filter(cell => cell.level > 0)) {
    const name = `${prefix}c${cell.x}_${cell.y}`;

    if (animated) {
      styles.push(renderKeyframes(name, sourceKeyframes(cell, grid.width)));
      styles.push(`#${prefix} .${name}{animation:${name} ${DURATION}s linear infinite}`);
    }

    shapes.push(cellRect(
      cell,
      `class="contribution ${name}" fill="${palette.levels[cell.level]}"`,
    ));
  }

  return { shapes, styles };
}

function renderLogo(width: number, palette: Palette, prefix: string, animated: boolean): SvgParts {
  const shapes: string[] = [];
  const styles: string[] = [];

  for (const [index, cell] of logoCells(width).entries()) {
    const name = `${prefix}l${index}`;

    if (animated) {
      styles.push(renderKeyframes(name, logoKeyframes(index)));
      styles.push(`#${prefix} .${name}{opacity:0;animation:${name} ${DURATION}s linear infinite}`);
    }

    shapes.push(cellRect(
      cell,
      `class="logo ${name}" fill="${palette.logo}" filter="url(#${prefix}glow)"`,
    ));
  }

  return { shapes, styles };
}

function renderKeyframes(name: string, points: Keyframe[]): string {
  // Deduplicate instants: the last logo cell reaches full opacity at 10s.
  const opacityByPercent = new Map<number, number>(points.map(([time, opacity]) => [
    Number((time / DURATION * 100).toFixed(5)),
    opacity,
  ]));
  const frames = [...opacityByPercent]
    .map(([percent, opacity]) => `${percent}%{opacity:${opacity}}`)
    .join('');

  return `@keyframes ${name}{${frames}}`;
}

function reducedMotionStyles(prefix: string): string {
  return [
    '@media (prefers-reduced-motion:reduce){',
    `#${prefix} .contribution{animation:none!important;opacity:1!important}`,
    `#${prefix} .logo{animation:none!important;opacity:0!important}`,
    '}',
  ].join('');
}

function glowFilter(prefix: string): string {
  return [
    `<defs><filter id="${prefix}glow" x="-70%" y="-70%" width="240%" height="240%">`,
    '<feGaussianBlur stdDeviation="1.2"/>',
    '<feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>',
    '<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',
    '</filter></defs>',
  ].join('');
}
