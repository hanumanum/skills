# han-code-quality-audit

Judge the code against nine quality properties. Leave the product tree unchanged.

Internal code quality audit. Evidence is the source and this run's tool output. The agent does not change product source, tests, config, or gitignore. Chat stays quiet: the first message is the progress URL, an install question only if a tool is missing, and a closing message with the run folder and report filenames. Findings stay in the report files.

A later run compares against the previous report in `han-code-quality-audit/`. The first run is a baseline. The next run is a delta: each finding is `new` or `still present`. Problems that are no longer in the tree are omitted. Creating tickets from a report is outside this skill.

Open the repository you want examined and invoke the skill by name. `disable-model-invocation: true`, so a casual mention does not start it. Type the slash command, or ask for this skill by name.

## Options

From the target repository, all nine properties, in the order below, in one run folder:

```text
/han-code-quality-audit
```

Name one or more properties to run only those. A single property is a complete run. It does not wait for the others.

```text
/han-code-quality-audit complexity
/han-code-quality-audit architectural consistency, modularity
```

Point at another path when the workspace is not the repository:

```text
/han-code-quality-audit on ~/src/some-repo
```

## What you see

1. A local progress page starts before detection. It shows queued, running, and done properties, tools still running, and the latest activity.
2. Language detection, then a tool check. If something is missing, the agent asks once and installs only what you accept.
3. One markdown report per property.

Reports live at:

```text
han-code-quality-audit/{run-id}/{id}.{Name}.{run-id}.md
```

Example: `han-code-quality-audit/2026-11-16T172400/01.Architectural consistency.2026-11-16T172400.md`.

Each report opens with what was read, then an index, then one section per problem: where, excerpt, why it is bad, how to improve, and how to check the source when the change is done. Order is the risk of the next edit. Hardness is Small, Moderate, or Large, and it does not change that order. Behavior is meant to stay the same.

## The nine properties

| Id | Name | Intention |
| --- | --- | --- |
| 01 | Architectural consistency | Compare the code to an architectural style or decision stated in the repo. When none is stated, name the nearest style already implied by folders, imports, and call paths, and report breaks from it: a use case in a handler, features importing each other, persistence called from a route file. |
| 02 | Dedup exact copies | Byte-identical files and 100% clones. The risk is a copy left stale, or a pasted path, key, or guard that still names the file it was copied from. |
| 03 | Separation of concerns | One unit with more than one reason to change: a handler that both parses and decides, a rule that also talks to storage or an upstream client, presentation mixed with workflow. |
| 04 | Purify functions | Logic still inline next to I/O — mapping, eligibility, totals, formatting — that should be a deterministic function the caller can test without a database, network, clock, or environment. |
| 05 | Dedup near-duplicates | The same shape with a small difference: renamed fields, role-cloned pages, repeated setup. The report says which difference a later edit will update on one side only, and which difference must stay. |
| 06 | Hardcoded domain literals | URLs, fees, deadlines, status words, provider sentences used as control flow, and user-facing copy that bypasses the translation catalog. A value written once as a named constant is not a finding. |
| 07 | Modularity | Import cycles, a shared folder importing a feature, barrels that re-export internals, and hidden coupling through one client or collection. A folder is a boundary only when the imports respect it. |
| 08 | Complexity | Cyclomatic score from the language tool, cognitive score from reading the source. Critical is cyclomatic ≥ 20 or cognitive ≥ 25. High is ≥ 15. Moderate is ≥ 10 and stays an index row. A high score is a finding when the next edit is unsafe. |
| 09 | Observability | Compare server logging, errors, and traces to the repo's logging or observability guide. When the repo has none, the fallback is `han-code-quality-audit/guides/03.logging-guide.md`. Example product names in that file are not findings. |

Properties 01, 03, 04, 06, and 09 are read from source. The others also use tools. Shipped scanners always run: `scripts/byte_identical.py` (exact copies) and `scripts/import_graph.py` (modularity). Optional tools, installed only after you agree:

| Tool | Used for |
| --- | --- |
| jscpd | Exact copies and near-duplicates |
| radon, gocyclo, rubocop, lizard | Complexity, by language |
| madge | JavaScript and TypeScript import graph |

Detection covers JavaScript, TypeScript, Python, Java, C#, C++, PHP, Go, Rust, and Ruby. Other source the scanner recognizes is still read. Dependency trees, build output, vendored code, lockfiles, and markdown are out of scope. Reports say "the repository" and do not name an organisation, product, or repo.

## Install

The agent reads this skill from `~/.cursor/skills/han-code-quality-audit/`. If this checkout is already `~/.cursor/skills`, it is installed.

Otherwise:

```bash
git clone https://github.com/hanumanum/skills.git
mkdir -p ~/.cursor/skills
cp -a skills/han-code-quality-audit ~/.cursor/skills/
```

To follow later pulls from a clone you keep, link the folder. `REPO` is the clone directory:

```bash
ln -sfn "$REPO/han-code-quality-audit" ~/.cursor/skills/han-code-quality-audit
```

Python 3 is required. Other tools are optional; the agent asks before installing any of them.
