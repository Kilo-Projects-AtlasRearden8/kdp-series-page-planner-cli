export function calendarStatus(book) {
  if (!book.releaseDateObj) return 'Unscheduled';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return book.releaseDateObj <= today ? 'Released' : 'Upcoming';
}

export function sortBooksByDate(books) {
  return [...books].sort((a, b) => {
    if (!a.releaseDateObj && !b.releaseDateObj) return 0;
    if (!a.releaseDateObj) return 1;
    if (!b.releaseDateObj) return -1;
    return a.releaseDateObj - b.releaseDateObj;
  });
}

export function markdownCalendar({ series, books }) {
  const ordered = sortBooksByDate(books);
  const lines = [];
  lines.push(`# Release Calendar — ${series.name}`);
  lines.push('');
  lines.push('| # | Title | Release date | Formats | Status |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const book of ordered) {
    const date = book.releaseDateObj ? book.releaseDate : 'unscheduled';
    lines.push(`| ${book.number} | ${book.title} | ${date} | ${listField(book.formats)} | ${calendarStatus(book)} |`);
  }
  lines.push('');
  return lines.join('\n').trimEnd() + '\n';
}

export function csvCalendar({ series, books }) {
  const ordered = sortBooksByDate(books);
  const rows = ['number,title,release_date,formats,status'];
  for (const book of ordered) {
    rows.push(
      [book.number, book.title, book.releaseDate || '', book.formats.join(' / '), calendarStatus(book)]
        .map(csvField)
        .join(','),
    );
  }
  return rows.join('\n') + '\n';
}

function listField(values) {
  if (!Array.isArray(values) || values.length === 0) return '—';
  return values.join(', ');
}

function csvField(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
