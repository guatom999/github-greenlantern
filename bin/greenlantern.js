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

const CLI_OPTIONS = {
  user: { type: 'string' },
  fixture: { type: 'string' },
  output: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
};

async function main() {
  const options = parseOptions();

  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  validateUsername(options.user);
  if (options.output === '' || options.fixture === '') {
    throw new Error('Option value must not be empty.');
  }

  const { days, source } = await loadContributionDays(options);
  const grid = normalizeDays(days);
  const files = buildOutputFiles(grid, options.user, source, days.length);
  const outputDirectory = resolve(options.output ?? 'dist');

  await writeOutputFiles(outputDirectory, files);
  process.stdout.write([
    `Generated ${grid.width} weeks × 7 rows for ${options.user} (${source}).`,
    outputDirectory,
    'Open preview.html to play or scrub the 16-second loop.',
    '',
  ].join('\n'));
}

function parseOptions() {
  try {
    const { values } = parseArgs({
      options: CLI_OPTIONS,
      strict: true,
      allowPositionals: false,
    });

    return values;
  } catch {
    throw new Error('Invalid option or missing argument value. Use --help for usage.');
  }
}

async function loadContributionDays({ user, fixture }) {
  if (!fixture) {
    return fetchContributions(user, { token: process.env.GITHUB_TOKEN });
  }

  let data;
  try {
    const json = await readFile(resolve(fixture), 'utf8');
    data = JSON.parse(json);
  } catch {
    throw new Error('Cannot read fixture JSON. Check the file path and JSON syntax.');
  }

  return {
    days: Array.isArray(data) ? data : data?.days,
    source: 'fixture',
  };
}

function buildOutputFiles(grid, username, source, dayCount) {
  const light = renderSvg(grid, { username, theme: 'light' });
  const dark = renderSvg(grid, { username, theme: 'dark' });
  const logo = renderSvg(grid, { username, theme: 'dark', mode: 'logo' });
  const closeup = renderLogoCloseup(username);
  const metadata = buildMetadata(grid, username, source, dayCount);

  return {
    'greenlantern.svg': light,
    'greenlantern-dark.svg': dark,
    'greenlantern-logo.svg': logo,
    'calendar.json': JSON.stringify(metadata, null, 2) + '\n',
    'preview.html': renderPreview({ light, dark, closeup, metadata }),
  };
}

function renderLogoCloseup(username) {
  // Five complete weeks create the 5-by-7 canvas used by the preview thumbnail.
  const closeupGrid = normalizeDays([
    { date: '2026-01-04', level: 0 },
    { date: '2026-02-07', level: 0 },
  ]);

  return renderSvg(closeupGrid, { username, theme: 'dark', mode: 'logo' });
}

function buildMetadata(grid, username, source, dayCount) {
  const days = grid.cells
    .filter(cell => cell.date)
    .map(({ date, level, count }) => ({
      date,
      level,
      ...(count !== undefined ? { count } : {}),
    }));

  return {
    username,
    source,
    from: grid.from,
    to: grid.to,
    weeks: grid.width,
    rows: 7,
    dayCount,
    days,
  };
}

async function writeOutputFiles(outputDirectory, files) {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(Object.entries(files).map(([filename, content]) => (
    writeFile(join(outputDirectory, filename), content, 'utf8')
  )));
}

main().catch(error => {
  process.stderr.write(`greenlantern: ${error.message}\n`);
  process.exitCode = 1;
});
