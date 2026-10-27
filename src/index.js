import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSeries } from './parser.js';
import { markdownMetadata, csvMetadata } from './metadata.js';
import { markdownKeywordCheck, checkBook } from './keywords.js';
import { markdownCalendar, csvCalendar } from './calendar.js';

export function buildOutput({ series, books, limits }) {
  return {
    md: markdownMetadata({ series, books }),
    csv: csvMetadata({ series, books }),
    keywordCheck: markdownKeywordCheck({ series, books, limits }),
    calendarMd: markdownCalendar({ series, books }),
    calendarCsv: csvCalendar({ series, books }),
  };
}

export function collectViolations(books, limits) {
  const violations = [];
  for (const book of books) {
    for (const v of checkBook(book, limits)) {
      violations.push({ book, ...v });
    }
  }
  return violations;
}

export function writeSelected(outputDir, outputs, wantsMd, wantsCsv) {
  mkdirSync(outputDir, { recursive: true });
  const written = [];
  const write = (name, content) => {
    const path = join(outputDir, name);
    writeFileSync(path, content, 'utf8');
    written.push(path);
  };
  if (wantsMd) {
    for (const [name, content] of [
      ['metadata.md', outputs.md],
      ['keyword-check.md', outputs.keywordCheck],
      ['release-calendar.md', outputs.calendarMd],
    ]) {
      write(name, content);
    }
  }
  if (wantsCsv) {
    for (const [name, content] of [
      ['metadata.csv', outputs.csv],
      ['release-calendar.csv', outputs.calendarCsv],
    ]) {
      write(name, content);
    }
  }
  if (!wantsMd && !wantsCsv) {
    for (const [name, content] of [
      ['metadata.md', outputs.md],
      ['metadata.csv', outputs.csv],
      ['keyword-check.md', outputs.keywordCheck],
      ['release-calendar.md', outputs.calendarMd],
      ['release-calendar.csv', outputs.calendarCsv],
    ]) {
      write(name, content);
    }
  }
  return written;
}

export async function run(argv) {
  const { program } = await import('commander');

  program
    .name('kdp-planner')
    .description('Turn a YAML book series file into KDP-ready metadata sheets, keyword-length checks, and a release calendar (Markdown/CSV).')
    .argument('<input>', 'Path to the series YAML file')
    .option('-o, --out <dir>', 'Output directory', './kdp-output')
    .option('--format <formats>', 'Comma-separated outputs: md, csv, all', 'all')
    .option('--max-keywords <n>', 'Maximum keywords per book', String(7))
    .option('--keyword-max <n>', 'Maximum characters per keyword', String(100))
    .option('--keywords-combined-max <n>', 'Maximum combined keyword characters', String(500))
    .option('--title-subtitle-max <n>', 'Maximum title + subtitle characters', String(200))
    .option('--description-max <n>', 'Maximum description characters', String(4000))
    .parse(argv);

  const input = program.args[0];
  if (!input) {
    console.error('Error: missing input YAML file. Usage: kdp-planner <input.yaml>');
    return 1;
  }
  const options = program.opts();
  const formats = new Set(options.format.split(',').map((f) => f.trim()).filter(Boolean));
  const wantsMd = formats.has('all') || formats.has('md');
  const wantsCsv = formats.has('all') || formats.has('csv');

  const limits = {
    maxKeywords: Number(options.maxKeywords),
    keywordMaxChars: Number(options.keywordMax),
    keywordsCombinedMaxChars: Number(options.keywordsCombinedMax),
    titleSubtitleMaxChars: Number(options.titleSubtitleMax),
    descriptionMaxChars: Number(options.descriptionMax),
  };

  let seriesData;
  try {
    seriesData = loadSeries(input, limits);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 1;
  }

  const outputs = buildOutput(seriesData);
  const violations = collectViolations(seriesData.books, seriesData.limits);

  const written = writeSelected(options.out, outputs, wantsMd, wantsCsv);
  console.log(`KDP planner: ${seriesData.books.length} book(s) from "${seriesData.series.name}"`);
  console.log(`  Wrote: ${written.join(', ')}`);
  console.log(`  Output dir: ${options.out}`);
  console.log(`  Keyword/metadata violations: ${violations.length}`);
  for (const v of violations) {
    console.log(`    - Book ${v.book.number} "${v.book.title}": ${v.type}`);
  }

  return violations.length > 0 ? 1 : 0;
}
