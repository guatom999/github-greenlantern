#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { normalizeDays, fetchContributions, validateUsername, renderSvg } from '../src/index.js';
import { renderPreview } from '../src/preview.js';

const HELP = `GitHub Green Lantern — a seven-row contribution animation

Usage:
  node bin/greenlantern.js --user USERNAME [--output dist]
  node bin/greenlantern.js --user demo --fixture fixtures/demo.json --output examples

Options:
  --user       GitHub username (required)
  --fixture    Read days from local JSON instead of accessing GitHub
  --output     Output directory (default: dist)
  --help       Show this help

Environment:
  GITHUB_TOKEN Optional: use GitHub GraphQL with contribution counts.
               Without it, read the public contribution page's color levels.

Outputs: greenlantern.svg, greenlantern-dark.svg, greenlantern-logo.svg,
         preview.html, calendar.json. Loop duration: 16 seconds.
`;

async function main() {
  let values;
  try {
    ({ values } = parseArgs({ options: { user: { type: 'string' }, fixture: { type: 'string' }, output: { type: 'string' }, help: { type: 'boolean', short: 'h' } }, strict: true, allowPositionals: false }));
  } catch { throw new Error('Invalid option or missing argument value. Use --help for usage.'); }
  if (values.help) { process.stdout.write(HELP); return; }
  validateUsername(values.user);
  if (values.output === '' || values.fixture === '') throw new Error('Option value must not be empty.');
  let days, source;
  if (values.fixture) {
    let data;
    try { data = JSON.parse(await readFile(resolve(values.fixture), 'utf8')); }
    catch { throw new Error('Cannot read fixture JSON. Check the file path and JSON syntax.'); }
    days = Array.isArray(data) ? data : data?.days;
    source = 'fixture';
  } else {
    ({ days, source } = await fetchContributions(values.user, { token: process.env.GITHUB_TOKEN }));
  }
  const grid = normalizeDays(days);
  const light = renderSvg(grid, { username: values.user, theme: 'light' });
  const dark = renderSvg(grid, { username: values.user, theme: 'dark' });
  const logo = renderSvg(grid, { username: values.user, theme: 'dark', mode: 'logo' });
  const closeup = renderSvg(normalizeDays([{ date: '2026-01-04', level: 0 }, { date: '2026-02-07', level: 0 }]), { username: values.user, theme: 'dark', mode: 'logo' });
  const metadata = { username: values.user, source, from: grid.from, to: grid.to, weeks: grid.width, rows: 7, dayCount: days.length, days: grid.cells.filter(cell => cell.date).map(({ date, level, count }) => ({ date, level, ...(count !== undefined ? { count } : {}) })) };
  const files = {
    'greenlantern.svg': light,
    'greenlantern-dark.svg': dark,
    'greenlantern-logo.svg': logo,
    'calendar.json': JSON.stringify(metadata, null, 2) + '\n',
    'preview.html': renderPreview({ light, dark, closeup, metadata }),
  };
  const output = resolve(values.output ?? 'dist');
  await mkdir(output, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, content]) => writeFile(join(output, name), content, 'utf8')));
  process.stdout.write(`Generated ${grid.width} weeks × 7 rows for ${values.user} (${source}).\n${output}\nOpen preview.html to play or scrub the 16-second loop.\n`);
}

main().catch(error => { process.stderr.write(`greenlantern: ${error.message}\n`); process.exitCode = 1; });
