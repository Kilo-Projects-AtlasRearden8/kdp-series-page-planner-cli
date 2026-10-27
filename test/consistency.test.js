import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBookCompleteness, checkSeriesConsistency, markdownConsistencyCheck } from '../src/consistency.js';

const completeBook = {
  number: 1,
  title: 'Book One',
  blurb: 'A description.',
  categories: ['Computers & Technology'],
};
const incompleteBook = {
  number: 2,
  title: 'Book Two',
  blurb: '',
  categories: [],
};

test('checkBookCompleteness flags missing description and categories', (t) => {
  const violations = checkBookCompleteness(incompleteBook);
  assert.ok(violations.some((v) => v.type === 'missingDescription'));
  assert.ok(violations.some((v) => v.type === 'missingCategories'));
});

test('checkBookCompleteness passes for a complete book', (t) => {
  assert.deepStrictEqual(checkBookCompleteness(completeBook), []);
});

test('checkSeriesConsistency flags duplicate book numbers', (t) => {
  const books = [
    { ...completeBook, number: 1 },
    { ...completeBook, number: 1 },
  ];
  const violations = checkSeriesConsistency({ series: { name: 'S' }, books });
  assert.ok(violations.some((v) => v.type === 'duplicateBookNumber'));
});

test('checkSeriesConsistency flags non-sequential book numbers', (t) => {
  const books = [
    { ...completeBook, number: 1 },
    { ...completeBook, number: 3 },
  ];
  const violations = checkSeriesConsistency({ series: { name: 'S' }, books });
  assert.ok(violations.some((v) => v.type === 'nonSequentialBookNumbers'));
});

test('checkSeriesConsistency flags release dates out of order', (t) => {
  const books = [
    { ...completeBook, number: 1, releaseDate: '2027-03-01', releaseDateObj: new Date('2027-03-01T00:00:00') },
    { ...completeBook, number: 2, releaseDate: '2027-02-01', releaseDateObj: new Date('2027-02-01T00:00:00') },
  ];
  const violations = checkSeriesConsistency({ series: { name: 'S' }, books });
  assert.ok(violations.some((v) => v.type === 'releaseDateOutOfOrder'));
});

test('checkSeriesConsistency passes for a well-formed series', (t) => {
  const books = [
    { ...completeBook, number: 1, releaseDate: '2027-02-01', releaseDateObj: new Date('2027-02-01T00:00:00') },
    { ...completeBook, number: 2, releaseDate: '2027-03-01', releaseDateObj: new Date('2027-03-01T00:00:00') },
  ];
  assert.deepStrictEqual(checkSeriesConsistency({ series: { name: 'S' }, books }), []);
});

test('markdownConsistencyCheck reports violations and summary', (t) => {
  const books = [completeBook, incompleteBook];
  const md = markdownConsistencyCheck({ series: { name: 'S' }, books });
  assert.ok(md.includes('# Consistency & Completeness Check'));
  assert.ok(md.includes('missing description'));
  assert.ok(md.includes('missing categories'));
  assert.ok(md.includes('Violations: 2'));
});

test('markdownConsistencyCheck reports zero violations', (t) => {
  const md = markdownConsistencyCheck({ series: { name: 'S' }, books: [completeBook] });
  assert.ok(md.includes('All checks passed.'));
  assert.ok(md.includes('Violations: 0'));
});