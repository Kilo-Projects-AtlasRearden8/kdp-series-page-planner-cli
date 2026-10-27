export function checkBookCompleteness(book) {
  const violations = [];
  if (!book.blurb || book.blurb.trim().length === 0) {
    violations.push({ type: 'missingDescription', book });
  }
  if (!book.categories || book.categories.length === 0) {
    violations.push({ type: 'missingCategories', book });
  }
  return violations;
}

export function checkSeriesConsistency({ series, books }) {
  const violations = [];
  const seen = new Set();
  for (const book of books) {
    if (seen.has(book.number)) {
      violations.push({ type: 'duplicateBookNumber', book, number: book.number });
    }
    seen.add(book.number);
  }
  const numbers = books.map((b) => b.number).sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] !== i + 1) {
      violations.push({ type: 'nonSequentialBookNumbers', number: numbers[i], expected: i + 1 });
      break;
    }
  }
  const dated = books.filter((b) => b.releaseDateObj);
  for (let i = 1; i < dated.length; i++) {
    if (dated[i].releaseDateObj < dated[i - 1].releaseDateObj) {
      violations.push({
        type: 'releaseDateOutOfOrder',
        book: dated[i],
        previous: dated[i - 1],
      });
    }
  }
  return violations;
}

export function checkAll({ series, books }) {
  const violations = [];
  for (const book of books) {
    for (const v of checkBookCompleteness(book)) {
      violations.push({ book, ...v });
    }
  }
  for (const v of checkSeriesConsistency({ series, books })) {
    violations.push(v);
  }
  return violations;
}

export function markdownConsistencyCheck({ series, books }) {
  const lines = [];
  lines.push('# Consistency & Completeness Check');
  lines.push('');
  lines.push(
    'Checks: every book has a description and at least one category, book numbers are unique and sequential, and release dates are in ascending order.',
  );
  lines.push('');
  const violations = checkAll({ series, books });
  if (violations.length === 0) {
    lines.push('All checks passed.');
  } else {
    for (const v of violations) {
      switch (v.type) {
        case 'missingDescription':
          lines.push(`- Book ${v.book.number} "${v.book.title}": missing description (blurb)`);
          break;
        case 'missingCategories':
          lines.push(`- Book ${v.book.number} "${v.book.title}": missing categories`);
          break;
        case 'duplicateBookNumber':
          lines.push(`- Duplicate book number: ${v.number}`);
          break;
        case 'nonSequentialBookNumbers':
          lines.push(`- Book numbers not sequential: found ${v.number}, expected ${v.expected}`);
          break;
        case 'releaseDateOutOfOrder':
          lines.push(
            `- Release date out of order: "${v.book.title}" (${v.book.releaseDate}) comes before "${v.previous.title}" (${v.previous.releaseDate})`,
          );
          break;
        default:
          lines.push(`- ${v.type}`);
      }
    }
  }
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('Books checked: ' + books.length);
  lines.push('Violations: ' + violations.length);
  lines.push('');
  return lines.join('\n').trimEnd() + '\n';
}