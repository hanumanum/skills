---
name: han-code-quality-audit
description: >-
  Runs an internal code quality audit from source code and language tools,
  writes timestamped reports, and serves a live progress page. Use when the
  user invokes /han-code-quality-audit, asks for a han code quality audit, or
  names one of its properties: architectural consistency, exact-copy dedup,
  separation of concerns, purify functions, near-duplicate dedup, hardcoded
  domain literals, modularity, complexity, or observability.
disable-model-invocation: true
---

# Internal code quality audit

Audit a repository from source code and tools. Write reports. Do not change the repository. Show the run on a local progress page, not as a chat transcript.

## Commands

The user invokes this skill by name. The repository is the current workspace unless they give another path.

- No property named: run all nine properties, in the order below.
- One or more properties named: run only those, still in this order, in one run folder.

A single property is a complete run. It does not require the other properties to have been run first, and it does not wait for them.

1. Architectural consistency — [properties/01-architectural-consistency.md](properties/01-architectural-consistency.md)
2. Dedup exact copies — [properties/02-dedup-exact.md](properties/02-dedup-exact.md)
3. Separation of concerns — [properties/03-separation-of-concerns.md](properties/03-separation-of-concerns.md)
4. Purify functions — [properties/04-purify-functions.md](properties/04-purify-functions.md)
5. Dedup near-duplicates — [properties/05-dedup-near.md](properties/05-dedup-near.md)
6. Hardcoded domain literals — [properties/06-hardcoded-domain-literals.md](properties/06-hardcoded-domain-literals.md)
7. Modularity — [properties/07-modularity.md](properties/07-modularity.md)
8. Complexity — [properties/08-complexity.md](properties/08-complexity.md)
9. Observability — [properties/09-observability.md](properties/09-observability.md)

Creating tasks from a report is not part of this skill. If asked, say so and stop. Do not invent the command.

## Hard rules

- Evidence is source code and this run's tool output. Do not read documentation: README, docs, ADRs, markdown, rst, comments or docstrings used as a specification, agent instruction files, or an earlier review note. A comment that disagrees with the code is ignored. Previous reports inside `han-code-quality-audit/` are the delta baseline, not documentation of the product. Two properties read a guide, and the property file says how. Architectural consistency reads in-repository files that state an architectural style or an architectural decision, and compares the code to them. Observability reads an in-repository logging or observability guide when one exists, and otherwise the fallback guide shipped with this skill. Other properties still do not read those files.
- Do not modify product source, tests, config, or gitignore. The only writes are under `han-code-quality-audit/{run-id}/`.
- Do not name an organisation, a product, or a repository in a report. Say "the repository".
- Write each report in the shape under Reports. No assignees, estimates, trackers, or pull-request steps.
- Do not install a tool until the user agrees. If they refuse, read the source for that signal.
- Chat is quiet. The first message is the progress URL. The next message, if any, is the install question. The last message is the run folder, the URL, and the report filenames. Do not paste findings.

## Progress page

Start it before detection and leave it up for the whole run. Update it when the phase changes, not once per line.

Phases, passed to `progress.py activity --phase`:

- `detecting` — language detection
- `waiting` — blocked on an install answer
- `running-tool` — owned by `run_tools.py` while it executes; do not write status during that command
- `reading` — opening source
- `analyzing` — deciding findings
- `writing` — writing the report file
- `done` — every selected property is written

```bash
SKILL=~/.cursor/skills/han-code-quality-audit
python3 "$SKILL/scripts/progress.py" init --repo "$REPO" --properties all
python3 "$SKILL/scripts/progress.py" serve --run-dir "$RUN_DIR"
```

`init` prints `RUN_ID` and `RUN_DIR`. `properties` is `all` or a comma-separated list of ids or names. `serve` prints `PROGRESS_URL`. Run `serve` in the background. Confirm the URL responds once. If it does not, say so once and continue; still update `status.json`.

Then, before each phase:

```bash
python3 "$SKILL/scripts/progress.py" activity --run-dir "$RUN_DIR" --phase reading --detail "relative/path"
```

Detail is a repo-relative path or a short phrase. After a property is written:

```bash
python3 "$SKILL/scripts/progress.py" property --run-dir "$RUN_DIR" --id 01 --state done --mode baseline --findings 4 --report "01.Architectural consistency.$RUN_ID.md"
```

Set `--state running` when a property starts. The page is the session: queued, running, and done properties, tools still running, tools finished, and the latest activity.

## Workflow

1. Resolve the repository. Create the run with `init`. Start `serve`. Send the URL.
2. Set phase `detecting`. Run `detect_languages.py --repo "$REPO"`.
3. Run `check_tools.py --repo "$REPO" --properties …`. Read [tooling.md](tooling.md). If `missing` is non-empty, set phase `waiting`, ask once, then install only what was accepted and check again. Pass refused or still-missing names as `--skip tool,tool`.
4. Run `run_tools.py --repo "$REPO" --run-dir "$RUN_DIR" --properties … --skip …`. Wait for it. It writes `tooling/` and updates the page.
5. For each selected property, in order:
   - Set the property `running`.
   - `find_previous.py --repo "$REPO" --property 01 --exclude-run "$RUN_ID"` prints a path or `NONE`.
   - Read that property's instruction file and no other property file.
   - Read source and this run's tool output. Obey the scope in [tooling.md](tooling.md) and the coverage rule in that property file. Do not stop after the first cluster, the first application, or the longest file. On architectural consistency, also read in-repository architecture documents, as that property file describes. On observability, also read the logging or observability guide, as that property file describes.
   - Write the report. Set the property `done` with the finding count and filename.
6. Set phase `done`. Send the closing message.

## Reports

Folder: `han-code-quality-audit/{run-id}/`

File: `{id}.{Name}.{run-id}.md`, for example `01.Architectural consistency.2026-11-16T172400.md`. The name is the property name, including spaces.

A report is a document a person can read from the top. It is not a form. Write in complete sentences. Name files, functions, and line ranges in the prose. Quote the source.

The reader is the person who will change the code. They need the reason before the instruction. **Why it is bad** is the part they use to decide. **How to improve** only says where the code goes, and it has to follow from that reason. A finding that says what to move and not why is unfinished. Behavior stays as it is.

```markdown
# {Property name}

- Run: {run-id}
- Kind: baseline | delta
- Previous: {repo-relative path, or none}
- Evidence: source code and tool output only

{One or two paragraphs. Which trees were read. Source only. The shape already in the code, or the rule this pass applies. If one unit already matches, name the file and the function and quote the handler or the function. If a tool ran, name the file under this run's tooling/ and the counts that change what a reader should believe.}

## Index

| | Where | Hardness | Problem |
| --- | --- | --- | --- |
| 1 | `{path}` `{symbol}` | Small | {one line} |

## 1. {Sentence that states the problem}

- Id: `{slug} | {relative-path} | {symbol} | {kind}`
- Status: new | still present
- Hardness: Small

**Where.** `{relative-path}` `{symbol}` lines {start}–{end}. Name every other file that has the same problem.

**Excerpt.**

```
// {relative-path} lines {start}-{end}
{the lines that show the problem, not a whole file}
```

`{relative-path}`

**Why it is bad.** Two or three sentences a later editor can use without re-doing the audit. Name the caller, the next edit, or the outcome that goes wrong, and tie it to the lines in the excerpt. Say what a careless fix would break: merging two lists that differ, deleting a branch the other path still needs, or moving a check and changing a status code. Do not restate the kind name ("this is a cross-feature import") and stop.

**How to improve.** Which job stays in this unit. Which job moves, and the file and function that receive it. The move is the one the reason above calls for. Same status codes, same writes, same returned values. When two blocks look alike and are not, name the difference and say not to merge them.

**Done when.** One or two checks a reader can make in the source.
```

Open with the index so the reader can see the set before the detail. Number the issues by the risk of the next edit, highest first. The index follows that same order. The first issue is the one to change first. When many call sites are one problem, keep them as one issue and put the sites in a table under **Where.** Do not write a second essay per row.

Risk, from highest to lowest:

1. The code is already wrong. A copied path, key, or guard still names the place it was copied from. A branch falls through. Two different failures take the same path. Skipping the route changes a status, a write, or a payload.
2. The next ordinary edit breaks a second place that did not need to change. A rule copied in two files, a module that imports another feature, a literal that decides behavior in more than one call site.
3. A later issue is unsafe until an earlier one lands. That dependency outranks size. Number the blocker first, and say so in one sentence on the later issue.
4. The same shape copied many times. One issue for the set, placed by the risk of the set.
5. Large and local. The edit is costly, and a change stays inside the unit. These go last.

When two issues have the same risk, put the smaller change first. Do not order by how hard the rewrite looks, and do not order by file path.

**Hardness** is a label for how much code the change touches. It does not change the order. Use one of these words and no other:

- **Small** — one function or one file. Callers stay, or only an import path changes.
- **Moderate** — a few files. Callers switch to the new function.
- **Large** — many call sites, more than one module, or a set of copies that move together.

Put the same word on the issue and in the index. A moderate index row that has no full section still carries the word.

**Why it is bad** is required on every issue, including a row that is only an index line for a moderate case. The index line can be short. The issue body cannot. If you cannot name a failure from the current source, do not file the issue.

**How to improve** names the destination. It does not list a sequence of edits, owners, or reviews. It does not introduce a reason that **Why it is bad** did not already state. **Done when** is a check in the source, not a command to run. The check should show that the failure in **Why it is bad** can no longer happen.

End with **Not in this report** when something was opened and left: a lookalike that is a different rule, a copy that must stay, or a problem another property owns. One sentence each. Omit the section when there is nothing to leave out.

Id fields are separated by ` | `. The slug is the one in the property file. The symbol is the function, method, or type. Use `file` when the problem is the whole file. If the same four fields would collide, append `#` and a stable noun from the code (a callee or a literal), not a counter you invented. The Id line stays even when the prose already names the file. A later run matches on that line.

Kind `baseline` when `find_previous.py` prints `NONE`. Kind `delta` otherwise. `Status: still present` when the id was in the previous report, `new` when it was not. A previous report with no Id lines is a baseline, and the report says the previous file had no ids.

Derive every finding from the current source and the current tool output. Write a full finding for every problem that is still in the tree, including ones the previous report already had. Do not copy the previous prose. Do not mention a problem that is no longer in the tree, and do not say it was fixed.

If the current tree has no problems, still write the file. Under the opening paragraphs, one sentence: `No problems found.` That file becomes the previous report for the next run.
