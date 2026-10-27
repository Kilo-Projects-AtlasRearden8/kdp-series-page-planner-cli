import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownMetadata, csvMetadata } from '../src/metadata.js';

const series = {
  name: 'AI Made Simple',
  author: 'Dylan Asdale',
  publisher: 'Asdale Dynamics, LLC',
  blurb: 'Series blurb.',
  categories: ['Computers & Technology'],
};
const books = [
  {
    number: 1,
    title: 'The Massive AI Manual',
    subtitle: 'AI explained like a friend would',
    keywords: ['ai for beginners', 'artificial intelligence guide'],
    blurb: 'A beginner manual with "quotes" and, commas.',
    releaseDate: '2026-11-15',
    releaseDateObj: new Date('2026-11-15T00:00:00'),
    formats: ['ebook', 'paperback'],
    priceUsd: 4.99,
    isbn: '',
    categories: ['Computers & Technology'],
  },
  {
    number: 2,
    title: 'Book Two',
    subtitle: '',
    keywords: [],
    blurb: '',
    releaseDate: '',
    releaseDateObj: null,
    formats: ['ebook'],
    priceUsd: null,
    isbn: '',
    categories: [],
  },
];

test('markdownMetadata contains series and book info', (t) => {
  const md = markdownMetadata({ series, books });
  assert.ok(md.includes('# AI Made Simple'));
  assert.ok(md.includes('**Author:** Dylan Asdale'));
  assert.ok(md.includes('**Publisher:** Asdale Dynamics, LLC'));
  assert.ok(md.includes('## Book 1 — The Massive AI Manual'));
  assert.ok(md.includes('| Title | The Massive AI Manual |'));
  assert.ok(md.includes('| Subtitle | AI explained like a friend would |'));
  assert.ok(md.includes('| Release date | 2026-11-15 |'));
  assert.ok(md.includes('| Price (USD) | $4.99 |'));
  assert.ok(md.includes('### Blurb'));
  assert.ok(md.includes('A beginner manual with "quotes" and, commas.'));
  assert.ok(md.includes('### Keywords'));
  assert.ok(md.includes('- ai for beginners'));
  assert.ok(md.includes('---'));
});

test('markdownMetadata handles missing optional fields', (t) => {
  const md = markdownMetadata({ series, books });
  assert.ok(md.includes('## Book 2 — Book Two'));
  assert.ok(md.includes('| Release date | unscheduled |'));
  assert.ok(md.includes('| Price (USD) | — |'));
});

test('csvMetadata has header and escaped rows', (t) => {
  const csv = csvMetadata({ series, books });
  const lines = csv.trimEnd().split('\n');
  assert.ok(lines[0].includes('series_name,series_author,series_publisher,book_number,title'));
  assert.ok(lines[1].includes('AI Made Simple'));
  assert.ok(lines[1].includes('The Massive AI Manual'));
  assert.ok(lines[1].includes('ai for beginners | artificial intelligence guide'));
  assert.ok(lines[2].includes('Book Two'));
  const quoted = lines[1].split(',').find((f) => f.includes('quotes'));
  assert.ok(quoted.includes('""quotes""'));
});

test('csvMetadata empty price and isbn are empty fields', (t) => {
  const csv = csvMetadata({ series, books });
  const lines = csv.trimEnd().split('\n');
  assert.ok(lines[2].includes(',,'));
});
