import { createHash } from 'node:crypto';
import { DURATION, logoCells, sourceKeyframes, logoKeyframes } from './animation.js';

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
}

const PALETTES = {
  dark: { background: '#0b1419', empty: '#18262d', border: '#203039', levels: ['#18262d', '#0e4429', '#006d32', '#26a641', '#39d353'], logo: '#39ff6a' },
  light: { background: '#f6f8fa', empty: '#e8ecef', border: '#dce2e7', levels: ['#e8ecef', '#9be9a8', '#40c463', '#30a14e', '#216e39'], logo: '#18b94c' },
};

function keyframes(name, points) {
  // Multiple points can share an instant (the last logo cell reaches 1 at 10s).
  const unique = new Map(points.map(([time, value]) => [+(time / DURATION * 100).toFixed(5), value]));
  return `@keyframes ${name}{${[...unique].map(([percent, opacity]) => `${percent}%{opacity:${opacity}}`).join('')}}`;
}

/** Self-contained SVG; CSS animations also work when embedded as an image. */
export function renderSvg(grid, { username = 'GitHub user', theme = 'dark', mode = 'animated' } = {}) {
  if (!Object.hasOwn(PALETTES, theme)) throw new Error('Unknown theme; choose dark or light.');
  if (!['animated', 'logo', 'calendar'].includes(mode)) throw new Error('Unknown render mode.');
  if (!grid || grid.height !== 7 || !Number.isInteger(grid.width) || grid.width < 5 || grid.cells.length !== grid.width * 7) throw new Error('Expected a seven-row grid with at least five columns.');
  const palette = PALETTES[theme];
  const prefix = 'gl' + createHash('sha256').update(JSON.stringify([grid, username, theme, mode])).digest('hex').slice(0, 12);
  const size = 12, pitch = 16, pad = 8;
  const width = pad * 2 + grid.width * pitch - (pitch - size);
  const height = pad * 2 + 7 * pitch - (pitch - size);
  const styles = [];
  const shapes = [];
  const rect = (cell, attributes) => `<rect x="${pad + cell.x * pitch}" y="${pad + cell.y * pitch}" width="${size}" height="${size}" rx="3" ${attributes}/>`;
  for (const cell of grid.cells) {
    shapes.push(rect(cell, `class="base" fill="${palette.empty}" stroke="${palette.border}" stroke-width="0.5"`));
  }
  if (mode !== 'logo') {
    for (const cell of grid.cells.filter(cell => cell.level > 0)) {
      const name = `${prefix}c${cell.x}_${cell.y}`;
      if (mode === 'animated') {
        styles.push(keyframes(name, sourceKeyframes(cell, grid.width)));
        styles.push(`#${prefix} .${name}{animation:${name} ${DURATION}s linear infinite}`);
      }
      shapes.push(rect(cell, `class="contribution ${name}" fill="${palette.levels[cell.level]}"`));
    }
  }
  if (mode !== 'calendar') {
    for (const [index, cell] of logoCells(grid.width).entries()) {
      const name = `${prefix}l${index}`;
      if (mode === 'animated') {
        styles.push(keyframes(name, logoKeyframes(index)));
        styles.push(`#${prefix} .${name}{opacity:0;animation:${name} ${DURATION}s linear infinite}`);
      }
      shapes.push(rect(cell, `class="logo ${name}" fill="${palette.logo}" filter="url(#${prefix}glow)"`));
    }
  }
  if (mode === 'animated') {
    styles.push(`@media (prefers-reduced-motion:reduce){#${prefix} .contribution{animation:none!important;opacity:1!important}#${prefix} .logo{animation:none!important;opacity:0!important}}`);
  }
  const title = `${username} — ${mode === 'logo' ? 'Green Lantern symbol' : 'GitHub contribution calendar'}`;
  const description = `${grid.from} to ${grid.to}. Seven rows, ${grid.width} weeks. ${mode === 'animated' ? 'Contribution lights fade inward into a Green Lantern symbol, then return. Sixteen-second loop.' : 'Static image.'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${prefix}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${prefix}title ${prefix}desc" data-rows="7" data-columns="${grid.width}"><title id="${prefix}title">${escapeXml(title)}</title><desc id="${prefix}desc">${escapeXml(description)}</desc><defs><filter id="${prefix}glow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="1.2"/><feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${styles.length ? `<style>${styles.join('')}</style>` : ''}<rect width="${width}" height="${height}" rx="6" fill="${palette.background}"/>${shapes.join('')}</svg>\n`;
}
