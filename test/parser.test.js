import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadSeries } from '../src/parser.js';

function tmpDir() {
  return mkdtempSync(join('/tmp', 'kdp-planner-test-'));
}

function writeSeries(content) {
  const dir = tmpDir();
  const path = join(dir, 'series.yaml');
  writeFileSync(path, content, 'utf8');
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('loadSeries parses a valid series file', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "AI Made Simple"
  author: "Dylan Asdale"
  publisher: "Asdale Dynamics, LLC"
  blurb: "Plain-English AI guides."
  categories:
    - "Computers & Technology"
books:
  - number: 1
    title: "The Massive AI Manual"
    subtitle: "AI explained like a friend would"
    keywords:
      - "ai for beginners"
    blurb: "A beginner manual."
    release_date: "2026-11-15"
    formats:
      - ebook
      - paperback
    price_usd: 4.99
    isbn: ""
`);
try {
  const result = loadSeries(path);
  assert.strictEqual(result.series.name, 'AI Made Simple');
  assert.strictEqual(result.series.author, 'Dylan Asdale');
  assert.strictEqual(result.series.publisher, 'Asdale Dynamics, LLC');
  assert.strictEqual(result.books.length, 1);
  assert.strictEqual(result.books[0].number, 1);
  assert.strictEqual(result.books[0].title, 'The Massive AI Manual');
  assert.strictEqual(result.books[0].subtitle, 'AI explained like a friend would');
  assert.deepStrictEqual(result.books[0].keywords, ['ai for beginners']);
  assert.strictEqual(result.books[0].releaseDate, '2026-11-15');
  assert.ok(result.books[0].releaseDateObj instanceof Date);
  assert.deepStrictEqual(result.books[0].formats, ['ebook', 'paperback']);
  assert.strictEqual(result.books[0].priceUsd, 4.99);
} finally {
  cleanup();
}
});

test('loadSeries defaults missing number and formats', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "Series"
books:
  - title: "Only Title"
`);
try {
  const result = loadSeries(path);
  assert.strictEqual(result.books[0].number, 1);
  assert.deepStrictEqual(result.books[0].formats, ['ebook']);
  assert.deepStrictEqual(result.books[0].categories, []);
} finally {
  cleanup();
}
});

test('loadSeries falls back book categories to series categories', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "Series"
  categories:
    - "Computers & Technology"
books:
  - title: "Book One"
`);
try {
  const result = loadSeries(path);
  assert.deepStrictEqual(result.books[0].categories, ['Computers & Technology']);
} finally {
  cleanup();
}
});

test('loadSeries throws when series.name is missing', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  author: "Dylan Asdale"
books:
  - title: "Book One"
`);
try {
  assert.throws(() => loadSeries(path), /series\.name is required/);
} finally {
  cleanup();
}
});

test('loadSeries throws when a book title is missing', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "Series"
books:
  - title: "Book One"
  - subtitle: "No title here"
`);
try {
  assert.throws(() => loadSeries(path), /book 2: title is required/);
} finally {
  cleanup();
}
});

test('loadSeries throws when release_date is not YYYY-MM-DD', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "Series"
books:
  - title: "Book One"
    release_date: "15-11-2026"
`);
try {
  assert.throws(() => loadSeries(path), /release_date must be YYYY-MM-DD/);
} finally {
  cleanup();
}
});

test('loadSeries throws on invalid YAML', (t) => {
  const { path, cleanup } = writeSeries('series: [unclosed');
  try {
    assert.throws(() => loadSeries(path), /Invalid YAML/);
  } finally {
    cleanup();
  }
});

test('loadSeries accepts custom limits', (t) => {
  const { path, cleanup } = writeSeries(`
series:
  name: "Series"
books:
  - title: "Book One"
`);
try {
  const result = loadSeries(path, { maxKeywords: 3 });
  assert.strictEqual(result.limits.maxKeywords, 3);
  assert.strictEqual(result.limits.descriptionMaxChars, 4000);
} finally {
  cleanup();
}
});
