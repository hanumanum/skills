# han-optimize-and-report

Measure a hosted site, change one thing, measure again, and keep the row.

The first run on a repository builds a browser-like load test under `tests/load-tests/`, asks where the comparison rows go, and asks for any auth the site needs. Later runs reuse those answers. Secrets stay in a gitignored `.cursor/skills/.env`. The non-secret choices stay in `tests/load-tests/.han-optimize.json`.

Open the repository and invoke the skill by name. `disable-model-invocation: true`, so a casual mention does not start it. Type the slash command, or ask for this skill by name.

## Options

From the target repository:

```text
/han-optimize-and-report
```

The branch checked out at the start is the baseline. A baseline of `main` or `master` stops the skill. Pull requests merge into the baseline only.

The first run asks for:

- a development or staging URL, and the production hostnames to refuse
- the pages to measure, the profile, and `Accept-Language`
- auth, if the site needs it
- where rows are stored: markdown or CSV in the repo, Notion, ClickUp, Excel (CSV), or a Google Sheet
- an optional tracing or log tool

`heavy`, `superheavy`, and `disaster` put real load on that host.

## What one pass does

The runner is measured once, as a baseline, before its own pull request. That pull request does not change the running site.

Each later pass takes the next question that applies to this codebase:

1. Cut a branch from the baseline and make one change.
2. Run the repo's tests, commit, push, open a pull request into the baseline, and merge it.
3. Wait until every check on the merge commit is green, then pull.
4. Run the same profile against every saved page and append a row. The row has the date, branch, commit, and the load-test numbers.
5. When document p95 is 20% worse, or the error share is up by 1 percentage point, run that page once more. The loop stops when the second run is still that bad, and asks what to do.

A question that does not apply is skipped. The loop ends when the questions are finished, CI fails, or the merge cannot be done.

## Install

The agent reads this skill from `~/.cursor/skills/han-optimize-and-report/`. If this checkout is already `~/.cursor/skills`, it is installed.

Otherwise:

```bash
git clone https://github.com/hanumanum/skills.git
mkdir -p ~/.cursor/skills
cp -a skills/han-optimize-and-report ~/.cursor/skills/
```

To follow later pulls from a clone you keep, link the folder. `REPO` is the clone directory:

```bash
ln -sfn "$REPO/han-optimize-and-report" ~/.cursor/skills/han-optimize-and-report
```

Node is required. The live run needs the `undici` package; the agent asks before installing it.
