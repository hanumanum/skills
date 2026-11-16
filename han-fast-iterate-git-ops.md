# han-fast-iterate-git-ops

Ship one task at a time onto a fixed baseline branch.

The baseline is the branch checked out when the skill starts. It stays that branch until the chat ends or you say the fast-iterate job is done. Each task is committed, pushed on its own branch, merged back through a pull request, and pulled into the baseline before the next task starts.

Open the repository and invoke the skill by name. `disable-model-invocation: true`, so a casual mention does not start it. Type the slash command, or ask for this skill by name.

Commit subjects use one prefix: `chore`, `doc`, `feat`, `hotfix`, `bugfix`. Branch names follow the Notion guide [Engineering: Branching Strategy & Workflow Standards](https://app.notion.com/p/30ad4f5c147780fcbb1ce5e1ae79d36c): `type/CLICKUP-ID-description` when the task has a ClickUp id.

## Options

Start the loop. With no task and a clean tree, the agent asks for the first task.

```text
/han-fast-iterate-git-ops
```

Name the task in the same message:

```text
/han-fast-iterate-git-ops UXUI-5187
/han-fast-iterate-git-ops https://app.clickup.com/t/UXUI-5187
```

The next task can be the one you type, or the one you tell it to read from ClickUp. Say when the loop should stop:

```text
the fast iterate job is done
```

## What one pass does

0. Fast-forward the baseline from its remote. If that is not possible, or the tree has other local changes, the agent stops and asks.
1. Cut a work branch from that baseline. The code change happens on the work branch.
2. Run the repo's tests when it has a test command.
3. Commit there. One commit per concern. Every subject starts with `chore:`, `doc:`, `feat:`, `hotfix:`, or `bugfix:`.
4. Push that work branch. The baseline is not pushed.
5. Open a pull request into the baseline.
6. Merge that pull request.
7. Wait for CI on the merge commit only.
8. Check out the baseline and pull.
9. Take the next task from you. A ClickUp task is read only when you name it.

A failed test, a refused merge, a failed CI run, or a pull that is not fast-forward pauses the loop. The baseline branch recorded at the start stays the baseline. The agent does not force-push, hard-reset, or take unrelated local files into the pull request.

## Install

The agent reads this skill from `~/.cursor/skills/han-fast-iterate-git-ops/`. If this checkout is already `~/.cursor/skills`, it is installed.

Otherwise:

```bash
git clone https://github.com/hanumanum/skills.git
mkdir -p ~/.cursor/skills
cp -a skills/han-fast-iterate-git-ops ~/.cursor/skills/
```

To follow later pulls from a clone you keep, link the folder. `REPO` is the clone directory:

```bash
ln -sfn "$REPO/han-fast-iterate-git-ops" ~/.cursor/skills/han-fast-iterate-git-ops
```

`git` is required. GitHub pull requests use `gh`. A ClickUp task is read with the ClickUp connector when you point at one.
