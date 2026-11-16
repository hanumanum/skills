# Comparison rows

Append one row per measured page. Do not edit a previous row. A failed run is still a row.

The deciding comparison for a change is the last row for that page whose commit is not this change. A re-run is judged against that row, not against the cold run that triggered the re-run. Append the cold run too.

## Columns

| Column | Source |
| --- | --- |
| Date | `startedAt` from the run JSON |
| Branch | Baseline branch after the pull |
| Work branch | The branch that was merged |
| Commit | Merge commit SHA on the baseline, and the pull request URL when there is one |
| Same deploy | `yes` when this SHA already has a row; include the run id |
| Run id | `id` |
| Profile | `config.profile` |
| Page URL | `config.pages[0].url` |
| Page loads started | Document count, the count the profile wanted (`pageLoadCount`), and `skipped` |
| Page loads/s | `summary.pageRps` |
| Requests/s | `summary.rps` |
| Errors | `summary.errors` and `summary.errorRate` |
| Document p95 | `summary.pages[0].document.totalMs.p95` |
| Document TTFB p95 | `summary.pages[0].document.ttfbMs.p95` |
| Asset p95 | `summary.pages[0].assets.totalMs.p95` |
| Image p95 | `summary.pages[0].assets.byKind.image.totalMs.p95` when present |
| Assets downloaded | `summary.pages[0].assets.bytes` |
| Document bytes | `summary.pages[0].document.bytes` |
| Note | One cause, `unknown`, or `baseline` |

## Where the row goes

Read `comparison.kind` and `comparison.location` from `tests/load-tests/.han-optimize.json`.

| Kind | Write |
| --- | --- |
| `markdown` | Append a table row to the markdown file at `location`. Default `tests/load-tests/comparison.md`. |
| `excel` | Append a CSV row to `location`. Default `tests/load-tests/comparison.csv`. Quote fields. Header row once. |
| `notion` | Append a page or database row with these columns. Create the database under the page the user named when they did not give a database. |
| `clickup` | Append a markdown table row to the Doc the user named. When they named a List, create one task whose name is the commit and whose body is the row. |
| `gsheet` | Append a row when a Google Sheets writer is available. When it is not, append the CSV fallback at `tests/load-tests/comparison.csv` and say the sheet was not written. |

A remote write that fails still gets the local markdown or CSV row. Say that the remote was not updated.

In-repo table files wait in the work tree. They ride along in the next code pull request. When the loop stops, ship the waiting rows as one `doc` pull request and do not measure that pull request.

## Stop rule

For each page, after the first run of this commit:

- Document p95 is at least 20% above the last accepted row for that page, or
- The error share (`summary.errorRate`) is at least 1 percentage point higher.

Run that page once more. Compare the second run with the same last accepted row.

Stop and ask when the second run is still past either line. Report the page, both numbers, the run ids, and whether the HTML size changed. Ask which of these to do: revert this merge as its own pull request, keep it and continue, or stop the job. Do not revert until the user says so.

A second run inside both lines continues. Mention a cold process or a deploy overlap in the note when the first run was the one outside the lines.

Asset p95 and TTFB p95 are columns. They do not stop the loop on their own.
