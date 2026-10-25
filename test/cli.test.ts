import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], {
  encoding: 'utf8',
  env: { ...process.env, GITHUB_TOKEN: 'do-not-leak-this-token' },
  timeout: 10_000,
});

test('fixture CLI produces only self-contained light and dark SVGs offline', async t => {
  const root = await mkdtemp(join(tmpdir(), 'greenlantern-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = join(root, 'input with spaces.json');
  await writeFile(fixture, JSON.stringify({ days: [{ date: '2026-01-04', level: 4 }, { date: '2026-02-07', level: 0 }] }));
  const output = join(root, 'output with spaces');
  const result = run(['--user', 'demo', '--fixture', fixture, '--output', output]);
  assert.equal(result.status, 0, result.stderr);
  const names = await readdir(output);
  assert.deepEqual(names.sort(), ['greenlantern-dark.svg', 'greenlantern.svg']);
  const contents = await Promise.all(names.map(name => readFile(join(output, name), 'utf8')));
  assert.ok(contents.every(value => !value.includes('do-not-leak-this-token')));
  for (const content of contents) {
    assert.match(content, /data-rows="7"/);
    assert.match(content, /@keyframes/);
    assert.match(content, /demo/);
    assert.doesNotMatch(content, /<script\b|<image\b/);
  }
  assert.match(result.stdout, /5 weeks|5 columns/);
  assert.match(result.stdout, /fixture/);
  assert.doesNotMatch(result.stdout, /preview\.html|calendar\.json|greenlantern-logo\.svg/);
});

test('rerunning the CLI removes retired exports while preserving both SVGs and unrelated files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'greenlantern-upgrade-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = join(root, 'input.json');
  await writeFile(fixture, JSON.stringify({ days: [{ date: '2026-01-04', level: 4 }, { date: '2026-02-07', level: 0 }] }));
  const output = join(root, 'out');
  const args = ['--user', 'demo', '--fixture', fixture, '--output', output];
  const first = run(args);
  assert.equal(first.status, 0, first.stderr);
  const light = await readFile(join(output, 'greenlantern.svg'), 'utf8');
  const dark = await readFile(join(output, 'greenlantern-dark.svg'), 'utf8');
  for (const name of ['greenlantern-logo.svg', 'preview.html', 'calendar.json']) {
    await writeFile(join(output, name), 'previously generated export');
  }
  await writeFile(join(output, 'notes.txt'), 'keep this user file');

  const second = run(args);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual((await readdir(output)).sort(), ['greenlantern-dark.svg', 'greenlantern.svg', 'notes.txt']);
  assert.equal(await readFile(join(output, 'greenlantern.svg'), 'utf8'), light);
  assert.equal(await readFile(join(output, 'greenlantern-dark.svg'), 'utf8'), dark);
  assert.equal(await readFile(join(output, 'notes.txt'), 'utf8'), 'keep this user file');
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
