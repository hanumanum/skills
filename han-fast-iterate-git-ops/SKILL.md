---
name: han-fast-iterate-git-ops
description: >-
  Ship one task per loop on a fixed baseline branch: update that branch,
  cut a work branch, run tests, commit with chore, doc, feat, hotfix, or
  bugfix, push only the work branch, open and merge a pull request into the
  baseline, wait for CI on the merge commit, pull the baseline, then take the
  next task the user names. Use when the user invokes
  /han-fast-iterate-git-ops or asks to fast-iterate git operations. The
  baseline is the branch checked out when the skill starts, and it stays that
  branch until the chat ends or the user says the fast-iterate job is done.
disable-model-invocation: true
---

# Fast iterate git ops

Ship one task at a time onto a fixed baseline branch. Do the task's code change on the work branch, then finish the loop. Do not start the next task until this one is pulled into the baseline, or the loop has paused.

## Never

- Push the baseline, force-push, or add a remote.
- `git reset --hard`, `git clean`, or any checkout that throws away uncommitted work.
- Skip hooks, `--no-verify`, or an empty commit. Do not update git config.
- Commit secrets (`.env`, credentials, keys) or paths the user did not include.
- Rewrite the baseline to tidy local commits. If it is ahead of `origin/<baseline>`, stop and ask.
- Merge with an admin override.
- Change a ClickUp status.
- Follow the rest of the Notion release process: no pull request to `develop` unless that is the baseline, no second merge of a hotfix, no promotion to `uat`, no review quorum.

## Baseline

The baseline is the branch checked out the first time this skill runs in the chat. A work branch, a moved HEAD, or a later turn does not change it.

On that first run, record `git rev-parse --show-toplevel` and `git branch --show-current`. Detached HEAD: stop and ask.

Write the current agent's session store file `han-fast-iterate-git-ops/baseline.txt`:

```text
repo=<absolute git root>
branch=<name>
```

The store is the current agent's store `files` path from the session. Also say `Baseline: <branch>` in the first status line.

On every later turn, read the file. When `repo` matches this git root, use `branch`. Do not record the current branch again.

If the file is missing and this chat already stated a baseline for this repo, write the file back from that statement. Do not use the current HEAD. If neither the file nor a prior statement exists, this is a new chat: record the current branch. If it is unclear which of those is true, stop and ask.

Delete the file only when the user ends the job ("the fast iterate job is done", or the same meaning). A failed step pauses. It keeps the file. A pause that is only "there is no next task" also keeps the file.

When the job ends, checkout the baseline if the working tree is clean. If it is dirty, stay put and say so.

## Names

Commit subjects start with one of `feat`, `bugfix`, `hotfix`, `doc`, `chore`, then a colon, then why.

| Prefix | Use |
| --- | --- |
| `feat` | New behavior |
| `bugfix` | A defect fix |
| `hotfix` | An urgent production fix |
| `doc` | Documentation only |
| `chore` | Setup, dependencies, config, tests, tooling, or a behavior-preserving restructure |

Choose one branch type from the task before creating the branch. That type is the branch name, including when the pass also has a `doc` or `chore` commit beside it. A `hotfix` commit is not mixed into another type: stop and ask, and ship it as its own pass.

| Task type | Branch prefix |
| --- | --- |
| `feat` | `feat/` |
| `bugfix` | `fix/` |
| `hotfix` | `hotfix/` |
| `doc` | `docs/` |
| `chore` | `chore/` |

Name: `type/CLICKUP-ID-kebab-description` when the task has a ClickUp id. Otherwise `type/kebab-description`. Do not invent an id. The work branch is always cut from the session baseline. Branch shape comes from [Engineering: Branching Strategy & Workflow Standards](https://app.notion.com/p/30ad4f5c147780fcbb1ce5e1ae79d36c). Re-read it when Notion is available. The "Never" list wins over that page.

## Before the loop

No task and a clean tree: ask for the task. Do not create a branch yet.

Dirty tree, or any commit on the baseline that is not on `origin/<baseline>`: stop. Show `git status --short` and `git log --oneline origin/<baseline>..<baseline>`. Continue only after the user says which paths, or which of those commits, are this task. Do not stash. Do not take the rest.

No `origin` remote, or the baseline branch is not on `origin`: stop. Do not create it by pushing.

## Loop

```text
Fast iterate:
- [ ] 0. Fast-forward the baseline
- [ ] 1. Work branch
- [ ] 2. Change, then tests
- [ ] 3. Commits on the work branch
- [ ] 4. Push the work branch
- [ ] 5. Open PR into the baseline
- [ ] 6. Merge
- [ ] 7. CI for the merge commit
- [ ] 8. Checkout baseline and pull
- [ ] 9. Next task
```

A failed step pauses the loop.

### 0. Fast-forward the baseline

Working tree must be clean. Then:

```bash
git fetch origin
git checkout <baseline>
git merge --ff-only "origin/<baseline>"
```

Anything other than a fast-forward pauses the loop. Remember the baseline SHA (`git rev-parse <baseline>`). It must be the same at the end of step 3.

### 1. Work branch

From that SHA:

```bash
git checkout -b <type/id-or-description>
```

Confirm `git branch --show-current` is the new branch and is not the baseline. Code changes for the task happen only after this.

If the user confirmed existing local commits are the task, point the work branch at that HEAD, push it in step 4, and only then move the baseline pointer. Do that with `git switch <baseline>` and `git reset --keep "origin/<baseline>"`, and only when all of these are true: the working tree is clean, the work branch is pushed, `git rev-parse <work>` equals `git rev-parse origin/<work>`, and `git rev-parse <baseline>` equals `git rev-parse <work>` before the reset. If any check fails, pause. Do not use `--hard`.

### 2. Tests

After the change, run the repo's one test command (`npm test`, `pytest`, `go test`, `dotnet test`, `cargo test`, `mvn test`, `composer test`, or the Makefile test target).

No test command: say so and continue. A non-zero exit pauses the loop before any commit. Do not install missing dependencies before the user agrees.

### 3. Commits

Stay on the work branch. One commit per concern. Every subject uses a prefix from the table. Match recent message style otherwise.

Before each commit, in parallel: `git status`, `git diff` (staged and unstaged), `git log -8 --oneline`. Stage only paths that belong to this task. Pass the message as a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat: short why

EOF
)"
```

After the last commit, `git rev-parse <baseline>` must still be the SHA from step 0. If it moved, pause. Do not push.

Nothing to commit: continue only when the task's commits are already on this work branch and the baseline SHA did not move.

### 4. Push

Refuse when the current branch equals the baseline.

```bash
git push -u origin "$(git branch --show-current)"
```

Confirm the upstream is `origin/<work branch>`, not `origin/<baseline>`.

### 5. Open the pull request

Base is the session baseline. Head is the work branch. GitHub: `gh pr create --base <baseline> --head <work>`. Cursor Origin: the origin pull-request tools, with that same base and head. Title is the task. Body is a short summary and a test plan. A ClickUp task is `[task name](https://app.clickup.com/t/<id>)`.

### 6. Merge

Merge the work branch into the baseline. Use a merge commit when the host allows it; otherwise the method the repo allows. Do not force it.

If protection waits on the pull request's own checks, watch those checks for the work-branch head SHA, then merge.

### 7. CI

Fetch. The commit that matters is the new `origin/<baseline>` SHA. Watch workflow runs for that SHA only. GitHub: `gh run list --branch <baseline> --commit <sha>`, then `gh run watch` on those runs. Origin: the origin checks for that SHA.

Runs for any other SHA do not count. A failed run for this SHA pauses the loop. Report the run URL and the failing job.

No CI config in the repo: say so and continue. CI config exists and no run appears for this SHA: pause and report that.

### 8. Baseline pull

```bash
git checkout <baseline>
git pull --ff-only
```

A pull that is not fast-forward pauses the loop. Do not reset to make it succeed.

### 9. Next task

Ask the user. Read a ClickUp task only when they give its id, URL, or title in this message. Do not choose one from a list, and do not reuse the task just merged.

No next task: pause. Stay on the baseline. Keep `baseline.txt`.

The next task starts again at step 0. Same baseline.

## Pause

Pause, say why, and do not start another task when tests fail, the baseline is not fast-forwardable, the push or the pull request or the merge cannot be completed, CI for the merge SHA fails, or there is no next task.

Checkout the baseline only when the work branch has been pushed and the working tree is clean. Otherwise stay on the current branch.
