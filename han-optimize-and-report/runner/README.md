# Load tests

Concurrent checks against one deployed site. Each virtual user behaves like a browser: it requests one page with Chrome headers, then loads the same-origin CSS, JS, and images found in that HTML. Every page load downloads those files again. The test stores no responses and sends `Cache-Control: no-cache` and `Pragma: no-cache` on the document and on each asset. Third-party fonts and tag-manager scripts are skipped.

A run takes a profile and one page URL. Assets are loaded unless you pass `--no-assets`.

## Profiles

`rps` is how many times per second the test starts a page load. Users cap how many of those loads can be in progress at once. If every user is still busy, that start is skipped. Think time keeps a user busy after a page.

| Profile | Users | Page loads/s | Duration | Think time | Timeout | Assets in parallel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `lightest` | 1 | 0.2 | 20s | 2000 ms | 30s | 4 |
| `light` | 2 | 0.5 | 30s | 1000 ms | 30s | 6 |
| `normal` | 5 | 1 | 30s | 500 ms | 30s | 12 |
| `heavy` | 10 | 2 | 45s | 200 ms | 45s | 16 |
| `superheavy` | 20 | 4 | 60s | 0 | 60s | 24 |
| `disaster` | 100 | 20 | 60s | 0 | 60s | 24 |

`heavy`, `superheavy`, and `disaster` put real load on the target. Point them at a development or staging host. The runner refuses a hostname listed in `.han-optimize.json` under `productionHosts`.

## Run

From the repository root, after `undici` is installed:

```bash
node tests/load-tests/run.mjs --profile normal --page https://dev.example.com/
node tests/load-tests/run.mjs --profile light --page https://dev.example.com/guide --no-assets
```

When the repo has a `test:load` script, that script is the same command.

Optional auth is read from `.cursor/skills/.env` (`LOAD_AUTHORIZATION`, `LOAD_COOKIE`). Those values are sent as headers and are not printed or written into the result JSON.

## Results

Each run is stored under `results/` (gitignored, except `.gitkeep`):

- `results/latest.html` — report to open in a browser
- `results/latest.json` — full samples and summary
- `results/runs/<id>.html` and `results/runs/<id>.json` — that run
- `results/index.json` — short history used for the trend

The report compares the run with the latest earlier run that matches all of these: profile, page URL, user agent, language, users, page-load rate, duration, think time, timeout, whether assets are loaded, and how many assets are fetched at once. It flags document and asset total p95, TTFB p95, and error rate. Default limits are +20% for both p95 figures and +1 percentage point of error rate. Any difference in the match list starts a new baseline.

The command exits 0 when the requests succeed, including when a limit is exceeded. Pass `--fail-on-regression` to exit 2 on a limit. Exit 1 means a request errored. A failed run is still saved.

## Unit checks

```bash
node --test tests/load-tests/suite.test.mjs
```

These cover asset parsing, percentiles, comparison, profiles, and saving a run. They do not call the site.
