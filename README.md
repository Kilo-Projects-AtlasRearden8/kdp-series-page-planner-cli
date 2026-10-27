# kdp-series-page-planner

A local-first Node CLI that turns a YAML file of a book series (titles, subtitles, keywords, blurbs, release dates) into consistent KDP-ready metadata sheets, keyword-length checks, and a release calendar — in Markdown and CSV.

Built by **Asdale Dynamics, LLC** — the publishing arm of Dylan Asdale, a registered nurse turned AI author. His book *The Massive AI Manual* and the hub site dylanasdale.github.io explain AI "like a friend would": plain English, step by step, never condescending. This tool is one of the practical publishing tools the LLC publishes and sells.

## Why this exists

Publishing a series is fiddly. You write the same metadata for every book, then you wonder: are the keywords too long for Amazon? Is the description under 4,000 characters? Did I miss a release date? This CLI turns one YAML file into everything you need to upload to KDP — and it checks the rules before you do.

## Install

```bash
npm install
```

Then run it directly:

```bash
node bin/kdp-planner <series.yaml>
```

Or install globally:

```bash
npm install -g .
kdp-planner series.yaml
```

## Input

The CLI reads a YAML file like this:

```yaml
series:
  name: "AI Made Simple"
  author: "Dylan Asdale"
  publisher: "Asdale Dynamics, LLC"
  blurb: "Plain-English AI guides written like a friend would explain them."
  categories:
    - "Computers & Technology"
    - "Self-Help"
books:
  - number: 1
    title: "The Massive AI Manual"
    subtitle: "AI explained like a friend would"
    keywords:
      - "ai for beginners"
      - "artificial intelligence guide"
    blurb: "New to AI? This manual walks you through what artificial intelligence is, which tools to try first, and how to use them safely."
    release_date: "2026-11-15"
    formats:
      - ebook
      - paperback
    price_usd: 4.99
    isbn: ""
    categories:
      - "Computers & Technology"
```

A full worked example lives in `examples/series.example.yaml` — five books in the "AI Made Simple" series.

Required: `series.name` and a non-empty `books` list where every book has a `title`. `release_date` must be `YYYY-MM-DD`.

## Output

```bash
node bin/kdp-planner examples/series.example.yaml -o ./kdp-output
```

Files written to the output directory:

| File | Contents |
| --- | --- |
| `metadata.md` | Markdown KDP field checklist per book (title, subtitle, series, author, publisher, description, keywords, release date, formats, price, ISBN, categories) plus blurb and keyword lists |
| `metadata.csv` | One row per book, spreadsheet-ready, with proper quoting for commas and quotes |
| `keyword-check.md` | Per-book keyword/metadata length check results |
| `consistency-check.md` | Cross-book consistency check (unique/sequential book numbers, release-date ordering, every book has a description and categories) |
| `release-calendar.md` | Release calendar table sorted by date, with a "Days until release" column and Released / Upcoming / Unscheduled status |
| `release-calendar.csv` | Same calendar data as CSV |

Use `--format md` or `--format csv` to write only one family of files (default: `all`).

## Checks

The CLI validates each book against KDP-safe defaults (all configurable via flags):

- Up to 7 keywords per book (`--max-keywords`)
- Up to 100 characters per keyword (`--keyword-max`)
- Up to 500 combined keyword characters (`--keywords-combined-max`)
- Title + subtitle under 200 characters (`--title-subtitle-max`)
- Description under 4,000 characters (`--description-max`)

It also checks that every book has a description and at least one category, that book numbers are unique and sequential, and that release dates are in ascending order.

Violations are printed to the console and written to `keyword-check.md` and `consistency-check.md`. Hard validation errors (missing fields, bad dates, invalid YAML) abort with a clear message. Soft limit violations still write all files, are reported, and return exit code 1.

```bash
kdp-planner series.yaml --max-keywords 7 --keyword-max 100 --description-max 4000
```

## Example output

`release-calendar.md`:

```markdown
# Release Calendar — AI Made Simple

| # | Title | Release date | Formats | Days until release | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | The Massive AI Manual | 2026-11-15 | ebook, paperback | 19 | Upcoming |
| 2 | AI Agents & MCP Made Simple | 2027-01-10 | ebook | 66 | Upcoming |
```

`metadata.md`:

```markdown
# AI Made Simple

**Author:** Dylan Asdale
**Publisher:** Asdale Dynamics, LLC

---

## Book 1 — The Massive AI Manual

**KDP field checklist**

| Field | Value |
| --- | --- |
| Title | The Massive AI Manual |
| Subtitle | AI explained like a friend would |
| Series | AI Made Simple |
| Author | Dylan Asdale |
| Publisher | Asdale Dynamics, LLC |
| Description | New to AI? ... |
| Keywords | ai for beginners, artificial intelligence guide, how to use ai |
| Release date | 2026-11-15 |
| Formats | ebook, paperback |
| Price (USD) | $4.99 |
| ISBN | — |
| Categories | Computers & Technology |
```

## Test

```bash
npm test
```

Tests cover YAML parsing and validation, Markdown/CSV generation and escaping, keyword/title/description checks, cross-book consistency, calendar sorting and status, and end-to-end CLI behavior. All tests run locally with the built-in `node:test` runner — no network, no API keys, no personal data.

## License

MIT. Copyright (c) 2026 Asdale Dynamics, LLC. See `LICENSE`.