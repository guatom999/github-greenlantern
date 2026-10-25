import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDays } from '../src/calendar.js';

test('aligns a partial first week to Sunday and retains seven rows', () => {
  const grid = normalizeDays([
    { date: '2026-10-24', level: 4, count: 7 },
    { date: '2026-10-25', level: 1 },
  ]);
  assert.equal(grid.width, 2);
  assert.equal(grid.height, 7);
  assert.equal(grid.cells.length, 14);
  assert.deepEqual(grid.cells.find(c => c.date === '2026-10-24'), { x: 0, y: 6, date: '2026-10-24', level: 4, count: 7 });
  const sunday = grid.cells.find(cell => cell.date === '2026-10-25');
  assert.ok(sunday);
  assert.equal(sunday.x, 1);
  assert.equal(sunday.y, 0);
  assert.equal(grid.cells[0].level, 0);
  assert.equal(grid.cells[0].date, null);
});

test('sorts dates and handles leap days and missing interior days', () => {
  const grid = normalizeDays([{ date: '2024-03-01', level: 3 }, { date: '2024-02-28', level: 1 }]);
  assert.equal(grid.from, '2024-02-28');
  assert.equal(grid.to, '2024-03-01');
  const thursday = grid.cells.find(cell => cell.y === 4);
  const friday = grid.cells.find(cell => cell.y === 5);
  assert.ok(thursday);
  assert.ok(friday);
  assert.equal(thursday.level, 0);
  assert.equal(friday.level, 3);
});

test('rejects empty, duplicate, invalid or excessive calendar input', () => {
  for (const days of [[], null, [{ date: '2026-02-29', level: 1 }], [{ date: '2026-01-01', level: 5 }], [{ date: '2026-01-01', level: 1.5 }], [{ date: '2026-01-01', level: 1, count: -1 }], [{ date: '2026-01-01', level: 0 }, { date: '2026-01-01', level: 1 }], [{ date: '2024-01-01', level: 1 }, { date: '2026-01-01', level: 1 }]]) {
    assert.throws(() => normalizeDays(days), /calendar|date|level|count|duplicate|year/i);
  }
});
