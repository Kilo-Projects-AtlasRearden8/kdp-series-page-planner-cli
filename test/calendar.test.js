import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarStatus, sortBooksByDate, markdownCalendar, csvCalendar } from '../src/calendar.js';

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

test('sortBooksByDate orders by date, unscheduled last', (t) => {
  const sorted = sortBooksByDate(books);
  assert.deepStrictEqual(sorted.map((b) => b.number), [1, 3, 2]);
});

test('sortBooksByDate does not mutate input', (t) => {
  const before = books.map((b) => b.number);
  sortBooksByDate(books);
  assert.deepStrictEqual(books.map((b) => b.number), before);
});

test('markdownCalendar renders a table sorted by date', (t) => {
  const md = markdownCalendar({ series: { name: 'S' }, books });
  assert.ok(md.includes('# Release Calendar — S'));
  assert.ok(md.includes('| 1 | Past Book | 1999-01-01 | paperback | Released |'));
  assert.ok(md.includes('| 3 | Future Book | 2099-01-01 | ebook | Upcoming |'));
  assert.ok(md.includes('| 2 | No Date | unscheduled | ebook | Unscheduled |'));
});

test('csvCalendar renders rows sorted by date', (t) => {
  const csv = csvCalendar({ series: { name: 'S' }, books });
  const lines = csv.trimEnd().split('\n');
  assert.strictEqual(lines[0], 'number,title,release_date,formats,status');
  assert.strictEqual(lines[1], '1,Past Book,1999-01-01,paperback,Released');
  assert.strictEqual(lines[2], '3,Future Book,2099-01-01,ebook,Upcoming');
  assert.strictEqual(lines[3], '2,No Date,,ebook,Unscheduled');
});
