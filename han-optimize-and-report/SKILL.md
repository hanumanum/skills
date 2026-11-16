---
name: han-optimize-and-report
description: >-
  Builds a browser-like load-test runner in a hosted codebase, then fixes one
  performance question at a time: branch, commit, pull request, merge, wait
  for every CI check, pull, measure, and append a comparison row. Use when
  the user invokes /han-optimize-and-report or asks to optimize a hosted site
  and report before-and-after measurements. The first run asks where
  comparison rows and credentials are stored and reuses those answers. Never
  merges to main or master. Stops when a comparable document p95 is still
  20% slower, or the error share is still 1 percentage point worse, after
  one re-run.
disable-model-invocation: true
---

# Optimize and report

Measure one hosted site, change one thing, measure again, append one row. The questions are in [questions.md](questions.md). The row shape is in [comparison.md](comparison.md). Do not go back to the article that these were taken from.

## Never

- Merge, push, or open a pull request into `main` or `master`.
- Measure a hostname listed in `productionHosts`.
- Commit `.cursor/skills/.env`, credentials, or `tests/load-tests/results/` except `.gitkeep`.
- Print `LOAD_AUTHORIZATION`, `LOAD_COOKIE`, or `OBSERVABILITY_API_KEY`.
- Edit an old comparison row.
- Put two questions in one commit.
- Start the next question before this one is pulled into the baseline.
- Force-push, `git reset --hard`, `git clean`, skip hooks, or an empty commit. Do not update git config.
- Install a package before the user agrees.
- Invent a cause when the logs are empty.
- Revert a slow change before the user chooses that.

## Baseline

The baseline is the branch checked out when this skill starts in the chat. Record the git root and that branch in the current agent's store file `han-optimize-and-report/baseline.txt`:

```text
repo=<absolute git root>
branch=<name>
```

On a later turn, when `repo` matches, use `branch`. Detached HEAD, or a baseline of `main` or `master`: stop and ask. Dirty tree, or commits on the baseline that are not on `origin/<baseline>`: stop and show `git status --short`. No `origin`, or the baseline is not on `origin`: stop.

Read `~/.cursor/skills/han-fast-iterate-git-ops/SKILL.md` for commit prefixes, branch names, and the git commands in steps 0–8. The rules in this file win. A behavior-preserving speed change uses `chore`. Do not invent a ClickUp id. Do not use `hotfix`.

## Resume or first run

Read `tests/load-tests/.han-optimize.json` when it exists.

It exists, and `tests/load-tests/run.mjs` contains the marker `han-optimize-and-report`: reuse the URL, pages, profile, store, and auth. Do not ask again. Continue from the first question in [questions.md](questions.md) whose `progress.md` status is not `done` or `skipped`.

It is missing: do the interview below before copying files. `tests/load-tests/` already exists and the marker is absent: stop and ask. Do not overwrite it.

## First-run interview

Ask once, in one message:

1. Dev or staging base URL. Every later page must use that origin.
2. Production hostnames to refuse. The base URL's host must not be one of them.
3. Full page URLs. At least the homepage and the inner pages people open. Do not invent a path.
4. Profile: `lightest`, `light`, `normal`, `heavy`, `superheavy`, or `disaster`. `heavy` and above put real load on that host.
5. `Accept-Language`.
6. Auth: none, an Authorization value, a Cookie, or both.
7. Comparison store: `markdown`, `notion`, `clickup`, `excel`, or `gsheet`, and the file path, database, Doc, or sheet URL.
8. A tracing or log tool, its URL, and an API key — or an explicit skip.

Write secrets only in `.cursor/skills/.env`, from [templates/env.example](templates/env.example). Create the file if needed. Append missing keys to `.cursor/skills/.env.example` with empty values. Gitignore `.cursor/skills/.env` when the repo does not already.

Write `tests/load-tests/.han-optimize.json` from [templates/han-optimize.json](templates/han-optimize.json). `auth` is `none`, `header`, `cookie`, or `header+cookie`. No secret goes in that file. `observability.tool` is the tool name or `none`.

## Install the runner

Copy `runner/` from this skill onto `tests/load-tests/` in the target repo. Keep `results/.gitkeep`. Do not copy `results` history.

Set `acceptLanguage` in `tests/load-tests/config.json` from the interview. Leave the compare limits at 20%, 20%, and 1.

Gitignore:

```text
tests/load-tests/results/*
!tests/load-tests/results/.gitkeep
```

If `package.json` exists, add `test:load` as `node tests/load-tests/run.mjs` and `test:load:unit` as `node --test tests/load-tests/suite.test.mjs`, unless those names already point somewhere else. Then stop and ask.

Run `node --input-type=module -e "import 'undici'"`. When that fails, ask once to add `undici` as a dev dependency and install it with the repo's package manager. A no skips the live runs and records the runner as not executable.

Run `node --test tests/load-tests/suite.test.mjs`. A failure pauses the loop.

Write `tests/load-tests/progress.md`:

```markdown
# Optimization progress

| Id | Question | Status | Commit | Date | Note |
| --- | --- | --- | --- | --- | --- |
| 00 | Measurement runner | pending | | | |
| 01 | Original picture | pending | | | |
```

Continue the ids through question 10 using the titles in [questions.md](questions.md).

## Baseline measurement

The runner is a client. Measure before its pull request, against the site that is already deployed.

For each saved page, one after another, not in parallel:

```bash
node tests/load-tests/run.mjs --profile <profile> --page <url>
```

Do not pass `--fail-on-regression`. Read `tests/load-tests/results/latest.json` before the next page. Append one baseline row per [comparison.md](comparison.md). Then ship the runner.

## One pass

```text
Optimize:
- [ ] 0. Fast-forward the baseline
- [ ] 1. Work branch from that baseline
- [ ] 2. One change, then the repo's test command
- [ ] 3. Commit on the work branch
- [ ] 4. Push the work branch
- [ ] 5. Pull request into the baseline
- [ ] 6. Merge
- [ ] 7. Every check on the merge commit is green
- [ ] 8. Checkout the baseline and pull
- [ ] 9. Measure every saved page and append rows
```

The runner's own pass is step 00 and uses `chore`. It contains the runner, gitignore, package scripts, `.han-optimize.json`, `progress.md`, and a comparison file when the store is in the repo. It does not contain `results/` or `.env`. Do not measure again after that merge. The runner is not in the server image.

A later pass starts at the next applicable question. Search the tree as that question says. Nothing matches: mark `skipped`, record why, and take the next question. Do not open an empty pull request.

No test command: say so and continue. A non-zero test pauses before the commit. A failed check on the merge SHA pauses. No CI config in the repo: say so and continue. CI config exists and no check appears for this SHA: pause.

After the pull, measure every saved page with the saved profile. Append the rows. In-repo table files stay uncommitted until the next code pull request. A remote store is updated now. When the loop stops, ship waiting in-repo rows as one `doc` pull request and do not measure it.

Apply the checks at the end of [questions.md](questions.md). Open the measured pages when a browser tool is available. When it is not, the note says the page was not opened.

## Stop

Use the rule in [comparison.md](comparison.md). A second run still at least 20% slower on document p95, or still at least 1 percentage point higher on error share, stops the loop. Ask whether to revert that merge as its own pull request, keep it and continue, or stop the job.

Also pause when tests fail, the baseline is not fast-forwardable, the push, pull request, or merge cannot be finished, or a check on the merge SHA fails. The question list is finished when every id is `done` or `skipped`. Say that and ship any waiting rows.

A revert the user asks for is `git revert -m 1 <merge sha>` on a new branch, then the same pass, including a measurement. Do not force-push.

## Reading a slow run

Follow "After the numbers" in [questions.md](questions.md). When `observability.tool` is `none`, the cause is unknown. When a tool was saved, query `OBSERVABILITY_URL` with `OBSERVABILITY_API_KEY` from `.cursor/skills/.env` for the run window. Do not print the key. One cause, then the next question.

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

Node is required. `undici` is required for a live run; the agent asks before installing it. GitHub pull requests use `gh`. A Notion or ClickUp comparison store uses that connector. A Google Sheet with no writer falls back to CSV.
