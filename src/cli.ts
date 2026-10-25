#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { normalizeDays, fetchContributions, validateUsername, renderSvg } from './index.js';
import { isRecord } from './validation.js';
import type { CalendarGrid, ContributionSource } from './types.js';

const HELP = `GitHub Green Lantern — a seven-row contribution animation

Usage:
  github-greenlantern --user USERNAME [--output dist]
  github-greenlantern --user demo --fixture test/fixtures/demo.json --output dist/demo

Options:
  --user       GitHub username (required)
  --fixture    Read days from local JSON instead of accessing GitHub
  --output     Output directory (default: dist)
  --help       Show this help

Environment:
  GITHUB_TOKEN Optional: use GitHub GraphQL with contribution counts.
               Without it, read the public contribution page's color levels.

Outputs: greenlantern.svg, greenlantern-dark.svg. Loop duration: 16 seconds.
`;

const CLI_OPTIONS = {
  user: { type: 'string' },
  fixture: { type: 'string' },
  output: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const;

interface CliOptions {
  user?: string;
  fixture?: string;
  output?: string;
  help?: boolean;
}

interface LoadedDays {
  days: unknown;
  source: ContributionSource;
}

async function main(): Promise<void> {
  const options = parseOptions();

  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  const username = validateUsername(options.user);
  if (options.output === '' || options.fixture === '') {
    throw new Error('Option value must not be empty.');
  }

  const { days, source } = await loadContributionDays(username, options.fixture);
  const grid = normalizeDays(days);
  const files = buildOutputFiles(grid, username);
  const outputDirectory = resolve(options.output ?? 'dist');

  await writeOutputFiles(outputDirectory, files);
  process.stdout.write([
    `Generated ${grid.width} weeks × 7 rows for ${username} (${source}).`,
    outputDirectory,
    'Open greenlantern.svg or greenlantern-dark.svg to view the 16-second loop.',
    '',
  ].join('\n'));
}

function parseOptions(): CliOptions {
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

async function loadContributionDays(username: string, fixture: string | undefined): Promise<LoadedDays> {
  if (!fixture) {
    return fetchContributions(username, { token: process.env.GITHUB_TOKEN });
  }

  let data: unknown;
  try {
    const json = await readFile(resolve(fixture), 'utf8');
    data = JSON.parse(json);
  } catch {
    throw new Error('Cannot read fixture JSON. Check the file path and JSON syntax.');
  }

  return {
    days: isRecord(data) ? data.days : data,
    source: 'fixture',
  };
}

function buildOutputFiles(
  grid: CalendarGrid,
  username: string,
): Record<string, string> {
  const light = renderSvg(grid, { username, theme: 'light' });
  const dark = renderSvg(grid, { username, theme: 'dark' });

  return {
    'greenlantern.svg': light,
    'greenlantern-dark.svg': dark,
  };
}

async function writeOutputFiles(outputDirectory: string, files: Record<string, string>): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(Object.entries(files).map(([filename, content]) => (
    writeFile(join(outputDirectory, filename), content, 'utf8')
  )));
  // Clean up retired generated exports without touching unrelated user files.
  await Promise.all(['greenlantern-logo.svg', 'preview.html', 'calendar.json'].map(filename => (
    rm(join(outputDirectory, filename), { force: true })
  )));
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected generation error.';
  process.stderr.write(`greenlantern: ${message}\n`);
  process.exitCode = 1;
});
