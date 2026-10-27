import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBook, checkKeywords, checkTitleSubtitle, checkDescription, markdownKeywordCheck } from '../src/keywords.js';

const limits = {
  maxKeywords: 7,
  keywordMaxChars: 100,
  keywordsCombinedMaxChars: 500,
  titleSubtitleMaxChars: 200,
  descriptionMaxChars: 4000,
};

const baseBook = {
  number: 1,
  title: 'Short Title',
  subtitle: 'Short Subtitle',
  keywords: ['one', 'two'],
  blurb: 'A short description.',
};

test('checkKeywords passes for a compliant book', (t) => {
  assert.deepStrictEqual(checkKeywords(baseBook, limits), []);
});

test('checkKeywords flags too many keywords', (t) => {
  const book = { ...baseBook, keywords: Array(8).fill('k') };
  const violations = checkKeywords(book, limits);
  assert.ok(violations.some((v) => v.type === 'tooManyKeywords'));
  assert.strictEqual(violations[0].count, 8);
  assert.strictEqual(violations[0].max, 7);
});

test('checkKeywords flags an overlong keyword', (t) => {
  const book = { ...baseBook, keywords: ['x'.repeat(101)] };
  const violations = checkKeywords(book, limits);
  assert.ok(violations.some((v) => v.type === 'keywordTooLong'));
  assert.strictEqual(violations[0].length, 101);
  assert.strictEqual(violations[0].max, 100);
});

test('checkKeywords flags combined overlong keywords', (t) => {
  const book = { ...baseBook, keywords: ['x'.repeat(300), 'y'.repeat(300)] };
  const violations = checkKeywords(book, limits);
  const combined = violations.find((v) => v.type === 'keywordsCombinedTooLong');
  assert.ok(combined);
  assert.strictEqual(combined.length, 600);
  assert.strictEqual(combined.max, 500);
});

test('checkTitleSubtitle flags combined over 200 chars', (t) => {
  const book = { ...baseBook, title: 'x'.repeat(150), subtitle: 'y'.repeat(60) };
  const violations = checkTitleSubtitle(book, limits);
  assert.ok(violations.some((v) => v.type === 'titleSubtitleTooLong'));
});

test('checkDescription flags overlong blurb', (t) => {
  const book = { ...baseBook, blurb: 'x'.repeat(4001) };
  const violations = checkDescription(book, limits);
  assert.ok(violations.some((v) => v.type === 'descriptionTooLong'));
});

test('checkBook aggregates all violation types', (t) => {
  const book = {
    ...baseBook,
    title: 'x'.repeat(150),
    subtitle: 'y'.repeat(60),
    keywords: Array(8).fill('k'),
    blurb: 'x'.repeat(4001),
  };
  const types = checkBook(book, limits).map((v) => v.type);
  assert.ok(types.includes('titleSubtitleTooLong'));
  assert.ok(types.includes('tooManyKeywords'));
  assert.ok(types.includes('descriptionTooLong'));
});

test('markdownKeywordCheck reports violations and summary', (t) => {
  const book = { ...baseBook, keywords: ['x'.repeat(101)] };
  const md = markdownKeywordCheck({ series: { name: 'S' }, books: [book], limits });
  assert.ok(md.includes('# Keyword & Metadata Length Check'));
  assert.ok(md.includes('Keyword too long'));
  assert.ok(md.includes('Violations: 1'));
});

test('markdownKeywordCheck reports zero violations', (t) => {
  const md = markdownKeywordCheck({ series: { name: 'S' }, books: [baseBook], limits });
  assert.ok(md.includes('All checks passed.'));
  assert.ok(md.includes('Violations: 0'));
});
