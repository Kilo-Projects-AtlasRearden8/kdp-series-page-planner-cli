import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';

export const DEFAULT_LIMITS = Object.freeze({
  maxKeywords: 7,
  keywordMaxChars: 100,
  keywordsCombinedMaxChars: 500,
  titleSubtitleMaxChars: 200,
  descriptionMaxChars: 4000,
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value) {
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function loadSeries(inputPath, limits = DEFAULT_LIMITS) {
  const errors = [];
  let raw;
  try {
    raw = readFileSync(inputPath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read series file "${inputPath}": ${err.message}`);
  }
  let doc;
  try {
    doc = load(raw);
  } catch (err) {
    throw new Error(`Invalid YAML in "${inputPath}": ${err.message}`);
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(`Invalid series file "${inputPath}": expected a YAML mapping at the top level`);
  }

  const { series, books } = doc;
  if (!series || typeof series !== 'object' || Array.isArray(series)) {
    errors.push('series: required mapping');
  }
  if (!Array.isArray(books) || books.length === 0) {
    errors.push('books: required non-empty list');
  }
  if (errors.length) {
    throw new Error(`Invalid series file "${inputPath}": ${errors.join('; ')}`);
  }

  const s = {
    name: String(series.name || '').trim(),
    author: String(series.author || '').trim(),
    publisher: String(series.publisher || '').trim(),
    blurb: String(series.blurb || '').trim(),
    categories: Array.isArray(series.categories)
      ? series.categories.map(String).filter(Boolean)
      : [],
  };
  if (!s.name) errors.push('series.name is required');

  const parsed = books.map((b, i) => {
    const bookErrors = [];
    const bookNum = i + 1;
    const releaseDate = b.release_date == null ? '' : String(b.release_date).trim();
    let releaseDateObj = null;
    if (releaseDate !== '') {
      if (!ISO_DATE.test(releaseDate)) {
        bookErrors.push(`book ${bookNum}: release_date must be YYYY-MM-DD`);
      } else {
        releaseDateObj = toDate(releaseDate);
        if (!releaseDateObj) {
          bookErrors.push(`book ${bookNum}: invalid release_date "${releaseDate}"`);
        }
      }
    }
    const keywords = Array.isArray(b.keywords)
      ? b.keywords.map(String).filter((k) => k.trim().length > 0)
      : [];
    const book = {
      number: b.number == null ? bookNum : Number(b.number),
      title: String(b.title || '').trim(),
      subtitle: String(b.subtitle || '').trim(),
      keywords,
      blurb: String(b.blurb || '').trim(),
      shortBlurb: String(b.short_blurb || '').trim(),
      releaseDate,
      releaseDateObj,
      formats: Array.isArray(b.formats)
        ? b.formats.map(String).filter(Boolean)
        : ['ebook'],
      priceUsd: b.price_usd == null ? null : Number(b.price_usd),
      isbn: String(b.isbn || '').trim(),
      categories: Array.isArray(b.categories)
        ? b.categories.map(String).filter(Boolean)
        : s.categories.slice(),
    };
    if (!book.title) bookErrors.push(`book ${bookNum}: title is required`);
    if (Number.isNaN(book.number)) {
      bookErrors.push(`book ${bookNum}: number must be numeric`);
    }
    return { book, bookErrors };
  });

  parsed.forEach(({ bookErrors }) => bookErrors.forEach((e) => errors.push(e)));

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  return {
    series: s,
    books: parsed.map(({ book }) => book),
    limits: { ...DEFAULT_LIMITS, ...limits },
  };
}
