# kdp-series-page-planner

A local-first Node CLI that turns a YAML file of a book series (titles, subtitles, keywords, blurbs, release dates) into consistent KDP-ready metadata sheets, keyword-length checks, and a release calendar in Markdown and CSV.

Built by **Asdale Dynamics, LLC** — beginner-friendly AI education, books, and practical publishing tools.

## Install

```bash
npm install
```

Run directly from the repo:

```bash
node bin/kdp-planner <series.yaml>
```

or install globally:

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
  blurb: "Plain-English AI guides."
  categories:
    - "Computers & Technology"
books:
  - number: 1
    title: "The Massive AI Manual"
    subtitle: "AI explained like a friend would"
    keywords:
      - "ai for beginners"
      - "artificial intelligence guide"
    blurb: "A plain-English beginner's manual."
    release_date: "2026-11-15"
    formats:
      - ebook
      - paperback
    price_usd: 4.99
    isbn: ""
    categories:
      - "Computers & Technology"
```

See `examples/series.example.yaml` for a full worked example.

Required: `series.name` and a non-empty `books` list where every book has a `title`. `release_date` must be `YYYY-MM-DD`.

## Output

Run:

```bash
node bin/kdp-planner examples/series.example.yaml -o ./kdp-output
```

Files written to the output directory:

| File | Contents |
| --- | --- |
| `metadata.md` | Markdown KDP metadata sheet per book (title, subtitle, series, description, keywords, release date, formats, price, ISBN, categories) |
| `metadata.csv` | One row per book, spreadsheet-ready |
| `keyword-check.md` | Per-book keyword/metadata length check results |
| `release-calendar.md` | Release calendar table sorted by date |
| `release-calendar.csv` | Same calendar data as CSV |

Use `--format md` or `--format csv` to write only one family of files (default: `all`).

## Checks

The CLI validates each book against KDP-safe defaults (all configurable):

- Up to 7 keywords per book
- Up to 100 characters per keyword
- Up to 500 combined keyword characters
- Title + subtitle under 200 characters
- Description under 4000 characters

Violations are printed to the console and written to `keyword-check.md`. Override limits with flags:

```bash
kdp-planner series.yaml --max-keywords 7 --keyword-max 100 --description-max 4000
```

## Test

```bash
npm test
```

## License

MIT. Copyright (c) 2026 Asdale Dynamics, LLC. See `LICENSE`.
