import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { run } from '../src/index.js';

const example = join(import.meta.dirname, '..', 'examples', 'series.example.yaml');

function tmp() {
  const dir = mkdtempSync(join('/tmp', 'kdp-cli-test-'));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('run writes all output files for the example series', async (t) => {
  const { dir, cleanup } = tmp();
  try {
    const code = await run(['node', 'kdp-planner', example, '-o', dir, '--format', 'all']);
    assert.strictEqual(code, 0);
    for (const name of [
      'metadata.md',
      'metadata.csv',
      'keyword-check.md',
      'consistency-check.md',
      'release-calendar.md',
      'release-calendar.csv',
    ]) {
      assert.ok(existsSync(join(dir, name)), `expected ${name} to exist`);
    }
    const md = readFileSync(join(dir, 'metadata.md'), 'utf8');
    assert.ok(md.includes('# AI Made Simple'));
    const csv = readFileSync(join(dir, 'metadata.csv'), 'utf8');
    assert.ok(csv.includes('series_name'));
    const cal = readFileSync(join(dir, 'release-calendar.md'), 'utf8');
    assert.ok(cal.includes('Days until release'));
    const cons = readFileSync(join(dir, 'consistency-check.md'), 'utf8');
    assert.ok(cons.includes('All checks passed.'));
  } finally {
    cleanup();
  }
});

test('run returns 1 when keyword violations exist', async (t) => {
  const { dir, cleanup } = tmp();
  const seriesPath = join(dir, 'violations.yaml');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(seriesPath, 'series:\n  name: "V"\nbooks:\n  - title: "B"\n    keywords: ["k1","k2","k3","k4","k5","k6","k7","k8"]\n    blurb: "x"\n', 'utf8');
  try {
    const code = await run(['node', 'kdp-planner', seriesPath, '-o', dir, '--format', 'all']);
    assert.strictEqual(code, 1);
    const check = readFileSync(join(dir, 'keyword-check.md'), 'utf8');
    assert.ok(check.includes('Too many keywords'));
  } finally {
    cleanup();
  }
});

test('run returns 1 on a hard validation error without writing files', async (t) => {
  const { dir, cleanup } = tmp();
  const seriesPath = join(dir, 'bad.yaml');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(seriesPath, 'series:\n  name: "B"\nbooks:\n  - title: "B"\n    release_date: "2026-13-40"\n', 'utf8');
  try {
    const code = await run(['node', 'kdp-planner', seriesPath, '-o', dir, '--format', 'all']);
    assert.strictEqual(code, 1);
    assert.ok(!existsSync(join(dir, 'metadata.md')));
  } finally {
    cleanup();
  }
});

test('run filters output by --format md and --format csv', async (t) => {
  const { dir: mdDir, cleanup: cleanupMd } = tmp();
  const { dir: csvDir, cleanup: cleanupCsv } = tmp();
  try {
    await run(['node', 'kdp-planner', example, '-o', mdDir, '--format', 'md']);
    assert.ok(existsSync(join(mdDir, 'metadata.md')));
    assert.ok(existsSync(join(mdDir, 'release-calendar.md')));
    assert.ok(!existsSync(join(mdDir, 'metadata.csv')));
    await run(['node', 'kdp-planner', example, '-o', csvDir, '--format', 'csv']);
    assert.ok(existsSync(join(csvDir, 'metadata.csv')));
    assert.ok(!existsSync(join(csvDir, 'metadata.md')));
  } finally {
    cleanupMd();
    cleanupCsv();
  }
});

test('run prints an error when the input file is missing', async (t) => {
  const code = await run(['node', 'kdp-planner', '/tmp/does-not-exist-xyz.yaml', '-o', '/tmp/kdp-cli-nope']);
  assert.strictEqual(code, 1);
});