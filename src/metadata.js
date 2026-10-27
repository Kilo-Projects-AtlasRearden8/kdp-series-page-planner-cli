export function money(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toFixed(2)}`;
}

export function listField(values) {
  if (!Array.isArray(values) || values.length === 0) return '—';
  return values.join(', ');
}

export function markdownMetadata({ series, books }) {
  const lines = [];
  lines.push(`# ${series.name}`);
  lines.push('');
  lines.push('**Author:** ' + (series.author || '—'));
  lines.push('**Publisher:** ' + (series.publisher || '—'));
  if (series.blurb) {
    lines.push('');
    lines.push('**Series blurb:** ' + series.blurb);
  }
  if (series.categories.length) {
    lines.push('**Series categories:** ' + listField(series.categories));
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const book of books) {
    lines.push(`## Book ${book.number} — ${book.title}`);
    lines.push('');
    lines.push('**KDP field checklist**');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('| --- | --- |');
    lines.push('| Title | ' + book.title + ' |');
    if (book.subtitle) {
      lines.push('| Subtitle | ' + book.subtitle + ' |');
    }
    lines.push('| Series | ' + series.name + ' |');
    lines.push('| Author | ' + (series.author || '—') + ' |');
    lines.push('| Publisher | ' + (series.publisher || '—') + ' |');
    lines.push('| Description | ' + (book.blurb || '—') + ' |');
    lines.push('| Keywords | ' + listField(book.keywords) + ' |');
    lines.push('| Release date | ' + (book.releaseDate || 'unscheduled') + ' |');
    lines.push('| Formats | ' + listField(book.formats) + ' |');
    lines.push('| Price (USD) | ' + money(book.priceUsd) + ' |');
    lines.push('| ISBN | ' + (book.isbn || '—') + ' |');
    lines.push('| Categories | ' + listField(book.categories) + ' |');
    lines.push('');

    if (book.blurb) {
      lines.push('### Blurb');
      lines.push('');
      lines.push(book.blurb);
      lines.push('');
    }

    if (book.keywords.length) {
      lines.push('### Keywords');
      lines.push('');
      lines.push('Copy these into the KDP Keywords field (7 keywords max):');
      lines.push('');
      for (const kw of book.keywords) {
        lines.push('- ' + kw);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

export function csvMetadata({ series, books }) {
  const header = [
    'series_name',
    'series_author',
    'series_publisher',
    'book_number',
    'title',
    'subtitle',
    'description',
    'keywords',
    'release_date',
    'formats',
    'price_usd',
    'isbn',
    'categories',
  ];
  const rows = [header.join(',')];
  for (const book of books) {
    const keywordString = book.keywords.join(' | ');
    const rowsValues = [
      series.name,
      series.author,
      series.publisher,
      book.number,
      book.title,
      book.subtitle,
      book.blurb,
      keywordString,
      book.releaseDate,
      book.formats.join(' / '),
      book.priceUsd == null ? '' : Number(book.priceUsd).toFixed(2),
      book.isbn,
      book.categories.join(' / '),
    ];
    rows.push(rowsValues.map(csvField).join(','));
  }
  return rows.join('\n') + '\n';
}

function csvField(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
