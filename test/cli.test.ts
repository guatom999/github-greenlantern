import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/greenlantern.js', import.meta.url));
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], {
  encoding: 'utf8',
  env: { ...process.env, GITHUB_TOKEN: 'do-not-leak-this-token' },
  timeout: 10_000,
});

test('fixture CLI produces real SVG files, provenance and a scrub-enabled preview offline', async t => {
  const root = await mkdtemp(join(tmpdir(), 'greenlantern-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = join(root, 'input with spaces.json');
  await writeFile(fixture, JSON.stringify({ days: [{ date: '2026-01-04', level: 4 }, { date: '2026-02-07', level: 0 }] }));
  const output = join(root, 'output with spaces');
  const result = run(['--user', 'demo', '--fixture', fixture, '--output', output]);
  assert.equal(result.status, 0, result.stderr);
  const names = await readdir(output);
  assert.deepEqual(names.sort(), ['calendar.json', 'greenlantern-dark.svg', 'greenlantern-logo.svg', 'greenlantern.svg', 'preview.html']);
  const contents = await Promise.all(names.map(name => readFile(join(output, name), 'utf8')));
  assert.ok(contents.every(value => !value.includes('do-not-leak-this-token')));
  assert.match(await readFile(join(output, 'greenlantern-dark.svg'), 'utf8'), /data-rows="7"/);
  const provenance = JSON.parse(await readFile(join(output, 'calendar.json'), 'utf8'));
  assert.equal(provenance.source, 'fixture');
  assert.equal(provenance.username, 'demo');
  const preview = await readFile(join(output, 'preview.html'), 'utf8');
  assert.match(preview, /fixture|synthetic/i);
  assert.match(preview, /type="range"/);
  assert.match(result.stdout, /5 weeks|5 columns/);
});

test('CLI help exits successfully and bad arguments fail clearly', () => {
  assert.equal(run(['--help']).status, 0);
  for (const args of [[], ['--user'], ['--unknown'], ['--user', '<script>'], ['--user', 'demo', '--output']]) {
    const result = run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /username|--user|argument|value|option/i);
    assert.doesNotMatch(result.stderr, /do-not-leak-this-token/);
  }
});

test('malformed fixtures fail before creating output files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'greenlantern-invalid-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = join(root, 'broken.json');
  await writeFile(fixture, '{broken');
  const result = run(['--user', 'demo', '--fixture', fixture, '--output', join(root, 'out')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixture|JSON/i);
  assert.deepEqual(await readdir(root), ['broken.json']);
});
