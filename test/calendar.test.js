import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarStatus, daysUntilRelease, releaseDaysLabel, sortBooksByDate, markdownCalendar, csvCalendar } from '../src/calendar.js';

const today = new Date();
today.setHours(0, 0, 0, 0);
const past = new Date(today);
past.setDate(past.getDate() - 10);
const future = new Date(today);
future.setDate(future.getDate() + 10);

const books = [
  { number: 3, title: 'Future Book', releaseDate: '2099-01-01', releaseDateObj: future, formats: ['ebook'] },
  { number: 1, title: 'Past Book', releaseDate: '1999-01-01', releaseDateObj: past, formats: ['paperback'] },
  { number: 2, title: 'No Date', releaseDate: '', releaseDateObj: null, formats: ['ebook'] },
];

test('calendarStatus returns Released / Upcoming / Unscheduled', (t) => {
  assert.strictEqual(calendarStatus(books[0]), 'Upcoming');
  assert.strictEqual(calendarStatus(books[1]), 'Released');
  assert.strictEqual(calendarStatus(books[2]), 'Unscheduled');
});

test('daysUntilRelease returns positive days for future, negative for past', (t) => {
  assert.ok(daysUntilRelease(books[0]) > 0);
  assert.ok(daysUntilRelease(books[1]) < 0);
  assert.strictEqual(daysUntilRelease(books[2]), null);
});

test('releaseDaysLabel formats days and empty values', (t) => {
  assert.strictEqual(releaseDaysLabel(5, '—'), '5');
  assert.strictEqual(releaseDaysLabel(0, '—'), '0');
  assert.strictEqual(releaseDaysLabel(-3, '—'), '0');
  assert.strictEqual(releaseDaysLabel(null, '—'), '—');
  assert.strictEqual(releaseDaysLabel(null, ''), '');
});

test('sortBooksByDate orders by date, unscheduled last', (t) => {
  const sorted = sortBooksByDate(books);
  assert.deepStrictEqual(sorted.map((b) => b.number), [1, 3, 2]);
});

test('sortBooksByDate does not mutate input', (t) => {
  const before = books.map((b) => b.number);
  sortBooksByDate(books);
  assert.deepStrictEqual(books.map((b) => b.number), before);
});

test('markdownCalendar renders a table sorted by date with days-until-release', (t) => {
  const md = markdownCalendar({ series: { name: 'S' }, books });
  assert.ok(md.includes('# Release Calendar — S'));
  assert.ok(md.includes('| # | Title | Release date | Formats | Days until release | Status |'));
  assert.ok(md.includes('| 1 | Past Book | 1999-01-01 | paperback | 0 | Released |'));
  assert.ok(md.includes('| 3 | Future Book | 2099-01-01 | ebook |'));
  assert.ok(md.includes('| 2 | No Date | unscheduled | ebook | — | Unscheduled |'));
});

test('csvCalendar renders rows sorted by date with days_until_release column', (t) => {
  const csv = csvCalendar({ series: { name: 'S' }, books });
  const lines = csv.trimEnd().split('\n');
  assert.strictEqual(lines[0], 'number,title,release_date,formats,days_until_release,status');
  assert.strictEqual(lines[1], '1,Past Book,1999-01-01,paperback,0,Released');
  const futureRow = lines[2].split(',');
  assert.strictEqual(futureRow[0], '3');
  assert.strictEqual(futureRow[1], 'Future Book');
  assert.strictEqual(futureRow[2], '2099-01-01');
  assert.strictEqual(futureRow[3], 'ebook');
  assert.ok(Number.isInteger(Number(futureRow[4])) && Number(futureRow[4]) > 0, 'days until release should be a positive integer');
  assert.strictEqual(futureRow[5], 'Upcoming');
  assert.strictEqual(lines[3], '2,No Date,,ebook,,Unscheduled');
});