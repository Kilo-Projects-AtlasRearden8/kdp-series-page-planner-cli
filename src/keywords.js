export function checkKeywords(book, limits) {
  const violations = [];
  let combinedChars = 0;

  for (const kw of book.keywords) {
    combinedChars += kw.length;
    if (kw.length > limits.keywordMaxChars) {
      violations.push({
        type: 'keywordTooLong',
        keyword: kw,
        length: kw.length,
        max: limits.keywordMaxChars,
      });
    }
  }

  if (book.keywords.length > limits.maxKeywords) {
    violations.push({
      type: 'tooManyKeywords',
      count: book.keywords.length,
      max: limits.maxKeywords,
    });
  }

  if (combinedChars > limits.keywordsCombinedMaxChars) {
    violations.push({
      type: 'keywordsCombinedTooLong',
      length: combinedChars,
      max: limits.keywordsCombinedMaxChars,
    });
  }

  return violations;
}

export function checkTitleSubtitle(book, limits) {
  const violations = [];
  const combined = (book.title + ' ' + book.subtitle).trim();
  if (combined.length > limits.titleSubtitleMaxChars) {
    violations.push({
      type: 'titleSubtitleTooLong',
      length: combined.length,
      max: limits.titleSubtitleMaxChars,
    });
  }
  return violations;
}

export function checkDescription(book, limits) {
  const violations = [];
  if (book.blurb.length > limits.descriptionMaxChars) {
    violations.push({
      type: 'descriptionTooLong',
      length: book.blurb.length,
      max: limits.descriptionMaxChars,
    });
  }
  return violations;
}

export function checkBook(book, limits) {
  return [
    ...checkKeywords(book, limits),
    ...checkTitleSubtitle(book, limits),
    ...checkDescription(book, limits),
  ];
}

export function markdownKeywordCheck({ series, books, limits }) {
  const lines = [];
  lines.push('# Keyword & Metadata Length Check');
  lines.push('');
  lines.push('Limits: ' + limits.maxKeywords + ' keywords per book, up to ' +
    limits.keywordMaxChars + ' chars per keyword, ' + limits.keywordsCombinedMaxChars +
    ' combined chars, title + subtitle under ' + limits.titleSubtitleMaxChars +
    ' chars, description under ' + limits.descriptionMaxChars + ' chars.');
  lines.push('');

  let totalViolations = 0;
  for (const book of books) {
    const violations = checkBook(book, limits);
    totalViolations += violations.length;
    lines.push(`## Book ${book.number} — ${book.title}`);
    lines.push('');
    if (violations.length === 0) {
      lines.push('All checks passed.');
    } else {
      for (const v of violations) {
        switch (v.type) {
          case 'keywordTooLong':
            lines.push(`- Keyword too long: "${v.keyword}" (${v.length} chars, max ${v.max})`);
            break;
          case 'tooManyKeywords':
            lines.push(`- Too many keywords: ${v.count} (max ${v.max})`);
            break;
          case 'keywordsCombinedTooLong':
            lines.push(`- Keywords combined too long: ${v.length} chars (max ${v.max})`);
            break;
          case 'titleSubtitleTooLong':
            lines.push(`- Title + subtitle too long: ${v.length} chars (max ${v.max})`);
            break;
          case 'descriptionTooLong':
            lines.push(`- Description too long: ${v.length} chars (max ${v.max})`);
            break;
          default:
            lines.push(`- ${v.type}`);
        }
      }
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  lines.push('Books checked: ' + books.length);
  lines.push('Violations: ' + totalViolations);
  lines.push('');

  return lines.join('\n').trimEnd() + '\n';
}
