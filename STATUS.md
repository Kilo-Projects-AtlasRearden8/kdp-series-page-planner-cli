# STATUS

## What was built

`kdp-series-page-planner` — a local-first Node CLI (no API keys, no network calls, no secrets) that reads a YAML file describing a book series and produces KDP-ready publishing artifacts:

- **`metadata.md`** — per-book KDP field checklist (title, subtitle, series, author, publisher, description, keywords, release date, formats, price, ISBN, categories) plus blurb and keyword lists
- **`metadata.csv`** — one row per book, RFC-4180-style quoting for fields containing commas/quotes/newlines
- **`keyword-check.md`** — per-book keyword/metadata length checks with violations listed
- **`release-calendar.md` / `release-calendar.csv`** — release calendar sorted by date, with Released / Upcoming / Unscheduled status

Input schema (`series` + `books` list with titles, subtitles, keywords, blurbs, release dates, formats, price, ISBN, categories). Example data in `examples/series.example.yaml` (5 books of an "AI Made Simple" series in the voice of Dylan Asdale / Asdale Dynamics, LLC: plain English, beginner-friendly, never condescending).

Checks are KDP-grounded and configurable via flags:
- up to 7 keywords per book (`--max-keywords`)
- up to 100 chars per keyword (`--keyword-max`)
- up to 500 combined keyword chars (`--keywords-combined-max`)
- title + subtitle under 200 chars (`--title-subtitle-max`)
- description under 4000 chars (`--description-max`)

Defaults match Amazon KDP guidance (title+subtitle < 200 chars, description ≤ 4000 chars, up to 7 keywords). Hard validation errors (missing `series.name`, missing book title, bad `release_date`, invalid YAML) abort with a clear message. Soft limit violations still write all files, are printed to the console and `keyword-check.md`, and return exit code 1.

Built with: Node 20 (`node:test` for tests, no test framework dependency), `commander` (CLI), `js-yaml` (YAML). ESM throughout (`"type": "module"`). MIT licensed.

## How to run

```bash
# Install dependencies
npm install

# Run the example series
node bin/kdp-planner examples/series.example.yaml -o ./kdp-output

# Choose output family
node bin/kdp-planner series.yaml --format md      # Markdown only
node bin/kdp-planner series.yaml --format csv      # CSV only
node bin/kdp-planner series.yaml --format all      # Both (default)

# Adjust limits
node bin/kdp-planner series.yaml --max-keywords 7 --keyword-max 100 --description-max 4000

# Run tests
npm test
```

The bin is also registered in `package.json`, so `npm install -g .` makes `kdp-planner` available on PATH.

## Verification results

- `npm test`: 26/26 tests pass (parser validation, metadata Markdown/CSV generation and escaping, keyword/title/description checks, calendar sorting and Released/Upcoming status). 0 failures.
- CLI end-to-end on `examples/series.example.yaml`: writes all 5 files, exit code 0, 0 violations.
- Violation case (8 keywords on one book): detected, reported, exit code 1, files still written.
- `--format md` / `--format csv` write only the requested family; `--format all` (default) writes everything.
- No `.github/workflows` files added. No secrets, API keys, or personal data in any file.
- LICENSE: MIT, copyright line exactly `Copyright (c) 2026 Asdale Dynamics, LLC`. README credits Asdale Dynamics, LLC.
- Git initialized; commit pending with identity Dylan Asdale (no Co-authored-by trailers).

## Known gaps

- Keyword limits are defaults we chose around KDP guidance; Amazon may change its limits — flags are provided to adjust per-account.
- The title+subtitle length check concatenates with a single space; it does not scan for KDP-prohibited title content (HTML, "free", generic keyword repetition, trademark references).
- "Released" vs "Upcoming" status compares the release date against the system date at run time.
- No CI workflows (intentionally, per project rules); tests run locally with `npm test`.
- Output directory `kdp-output/` and `node_modules/` are gitignored.
