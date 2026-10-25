import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDays } from '../src/calendar.js';
import { logoCells, sourceOpacity, logoOpacity, sampleFrame } from '../src/animation.js';
import type { CalendarGrid } from '../src/types.js';

const grid = normalizeDays([{ date: '2026-01-04', level: 4 }, { date: '2026-02-07', level: 2 }]);

test('centers exactly the reference symbol in all seven rows', () => {
  const cells = logoCells(53);
  assert.equal(cells.length, 22);
  assert.equal(Math.min(...cells.map(c => c.x)), 24);
  assert.equal(Math.max(...cells.map(c => c.x)), 28);
  const rows = Array.from({ length: 7 }, (_, y) => Array.from({ length: 5 }, (_, x) => cells.some(c => c.x === 24 + x && c.y === y) ? '1' : '0').join(''));
  assert.deepEqual(rows, ['11111', '01110', '10001', '10001', '10001', '01110', '11111']);
  assert.equal(Math.min(...logoCells(54).map(c => c.x)), 24);
  assert.throws(() => logoCells(4), /five|5|width/i);
});

test('fades outer columns before central ones', () => {
  assert.equal(sourceOpacity({ x: 0, y: 0 }, 53, 3), 0);
  assert.equal(sourceOpacity({ x: 26, y: 0 }, 53, 3), 1);
  assert.equal(sourceOpacity({ x: 26, y: 6 }, 53, 8), 0);
});

test('starts and loops with original contributions and no logo', () => {
  for (const time of [0, 1, 16, 32]) {
    const frame = sampleFrame(grid, time);
    assert.deepEqual(frame.map(c => c.level), grid.cells.map(c => c.level));
    assert.ok(frame.every(c => c.contributionOpacity === 1 && c.logoOpacity === 0));
  }
  const beforeBoundary = sampleFrame(grid, 15.999);
  assert.ok(beforeBoundary.every(c => c.contributionOpacity > 0.999));
});

test('reveals all 22 logo cells even if every contribution is empty', () => {
  const empty: CalendarGrid = { ...grid, cells: grid.cells.map(c => ({ ...c, level: 0 })) };
  const frame = sampleFrame(empty, 10);
  assert.equal(frame.filter(c => c.logoOpacity === 1).length, 22);
  assert.ok(frame.every(c => c.contributionOpacity === 0));
  assert.equal(logoOpacity(0, 5), 0);
  assert.ok(logoOpacity(0, 7) > logoOpacity(21, 7));
});

test('holds, pulses, restores and never emits non-finite opacities', () => {
  assert.ok(logoOpacity(0, 10.75) < logoOpacity(0, 10));
  assert.ok(logoOpacity(0, 14) > 0 && logoOpacity(0, 14) < 1);
  for (let t = 0; t <= 16; t += 0.125) {
    for (const cell of sampleFrame(grid, t)) {
      for (const n of [cell.contributionOpacity, cell.logoOpacity]) assert.ok(Number.isFinite(n) && n >= 0 && n <= 1);
    }
  }
  assert.throws(() => sampleFrame(grid, NaN), /time/i);
});
