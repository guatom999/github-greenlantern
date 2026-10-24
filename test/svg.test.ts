import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDays } from '../src/calendar.js';
import { renderSvg } from '../src/svg.js';

const grid = normalizeDays([{ date: '2026-01-04', level: 4, count: 12 }, { date: '2026-02-07', level: 2 }]);

test('renders a deterministic self-contained seven-row animated SVG', () => {
  const svg = renderSvg(grid, { username: 'demo', theme: 'dark' });
  assert.equal(svg, renderSvg(grid, { username: 'demo', theme: 'dark' }));
  assert.equal((svg.match(/class="base"/g) ?? []).length, 35);
  assert.equal((svg.match(/class="logo /g) ?? []).length, 22);
  assert.match(svg, /data-rows="7"/);
  assert.match(svg, /@keyframes/);
  assert.match(svg, /16s/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.doesNotMatch(svg, /<script|<foreignObject|\bhref=|\bonload=|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
});

test('escapes metadata and validates rendering options', () => {
  const svg = renderSvg(grid, { username: '<img onerror="evil"> & test' });
  assert.match(svg, /&lt;img onerror=&quot;evil&quot;&gt; &amp; test/);
  assert.doesNotMatch(svg, /<img/);
  assert.throws(() => {
    // @ts-expect-error JavaScript callers can still pass an invalid theme at runtime.
    renderSvg(grid, { theme: 'invalid' });
  }, /theme/i);
  assert.throws(() => {
    // @ts-expect-error Verify runtime protection independently of the public types.
    renderSvg(grid, { mode: 'gif' });
  }, /mode/i);
  assert.throws(() => {
    // @ts-expect-error The public grid contract requires exactly seven rows.
    renderSvg({ ...grid, height: 8 });
  }, /seven|7|grid/i);
});

test('static logo and calendar SVGs contain no animations', () => {
  const logo = renderSvg(grid, { theme: 'dark', mode: 'logo' });
  const calendar = renderSvg(grid, { theme: 'light', mode: 'calendar' });
  assert.doesNotMatch(logo + calendar, /@keyframes|animation:/);
  assert.equal((logo.match(/class="logo /g) ?? []).length, 22);
  assert.equal((calendar.match(/class="contribution /g) ?? []).length, 2);
  assert.doesNotMatch(calendar, /class="logo /);
  assert.notEqual(renderSvg(grid, { theme: 'light' }), renderSvg(grid, { theme: 'dark' }));
});
