# Skills

Cursor agent skills in this folder. Git tracks only folders whose names start with `han-`.

Install them under `~/.cursor/skills/` as described below. In a Cursor chat, open the repository you want examined and invoke the skill by name. Each skill has `disable-model-invocation: true`, so a casual mention does not start it. Type the slash command, or ask for that skill by name.

The agent reads `SKILL.md` and the files next to it. You do not run the property files or the review files yourself. You answer when the agent asks whether to install a missing tool. A refusal skips that tool and the run continues with what is already installed.

## Contents

- [How to install](#how-to-install)
- [han-code-quality-audit](#han-code-quality-audit)
  - [How to run it](#how-to-run-it)
  - [What you see](#what-you-see)
  - [The nine properties](#the-nine-properties)
- [han-investigate-and-document](#han-investigate-and-document)
  - [How to run it](#how-to-run-it-1)
  - [What it writes](#what-it-writes)
  - [Required reviews](#required-reviews)
  - [Verdict](#verdict)

| Skill | Invoke | Intention | Writes |
| --- | --- | --- | --- |
| [han-code-quality-audit](#han-code-quality-audit) | `/han-code-quality-audit` | Judge the code against nine quality properties. Leave the product tree unchanged. | `han-code-quality-audit/{run-id}/` in the target repo, plus a local progress page |
| [han-investigate-and-document](#han-investigate-and-document) | `/han-investigate-and-document` | Explain an unfamiliar codebase as a system guide, then say what is wrong with it. | `docs/` and a root `README.md` in the target repo |

---

## How to install

Each skill is a folder with a `SKILL.md` plus the scripts and notes the agent reads. The agent runs those scripts from `~/.cursor/skills/<skill-name>/`, so that is the install location. They are personal skills: available in every project once the folders are there.

Source: [github.com/hanumanum/skills](https://github.com/hanumanum/skills).

If this checkout is already `~/.cursor/skills`, the two folders are installed. Otherwise clone and copy them:

```bash
git clone https://github.com/hanumanum/skills.git
mkdir -p ~/.cursor/skills
cp -a skills/han-code-quality-audit ~/.cursor/skills/
cp -a skills/han-investigate-and-document ~/.cursor/skills/
```

To follow later pulls from a clone you keep, link the folders instead of copying. `REPO` is the clone directory:

```bash
REPO="$PWD/skills"
ln -sfn "$REPO/han-code-quality-audit" ~/.cursor/skills/han-code-quality-audit
ln -sfn "$REPO/han-investigate-and-document" ~/.cursor/skills/han-investigate-and-document
```

Check that both entry files resolve:

```bash
test -f ~/.cursor/skills/han-code-quality-audit/SKILL.md && echo audit ok
test -f ~/.cursor/skills/han-investigate-and-document/SKILL.md && echo investigate ok
```

Open a new Cursor chat in the repository you want examined. The commands `/han-code-quality-audit` and `/han-investigate-and-document` should appear. Python 3 is required for the audit scripts. `git` and `rg` are required for the system guide. Other tools are optional; the agent asks before installing any of them.

---

## han-code-quality-audit

Internal code quality audit. Evidence is the source and this run's tool output. The agent does not change product source, tests, config, or gitignore. Chat stays quiet: the first message is the progress URL, an install question only if a tool is missing, and a closing message with the run folder and report filenames. Findings stay in the report files.

A later run compares against the previous report in `han-code-quality-audit/`. The first run is a baseline. The next run is a delta: each finding is `new` or `still present`. Problems that are no longer in the tree are omitted. Creating tickets from a report is outside this skill.

### How to run it

From the target repository:

```text
/han-code-quality-audit
```

That runs all nine properties, in the order below, in one run folder.

Name one or more properties to run only those. A single property is a complete run. It does not wait for the others.

```text
/han-code-quality-audit complexity
/han-code-quality-audit architectural consistency, modularity
```

Point at another path when the workspace is not the repository:

```text
/han-code-quality-audit on ~/src/some-repo
```

### What you see

1. A local progress page starts before detection. It shows queued, running, and done properties, tools still running, and the latest activity.
2. Language detection, then a tool check. If something is missing, the agent asks once and installs only what you accept.
3. One markdown report per property.

Reports live at:

```text
han-code-quality-audit/{run-id}/{id}.{Name}.{run-id}.md
```

Example: `han-code-quality-audit/2026-11-16T172400/01.Architectural consistency.2026-11-16T172400.md`.

Each report opens with what was read, then an index, then one section per problem: where, excerpt, why it is bad, how to improve, and how to check the source when the change is done. Order is the risk of the next edit. Hardness is Small, Moderate, or Large, and it does not change that order. Behavior is meant to stay the same.

### The nine properties

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

---

## han-investigate-and-document

System guide for a codebase you do not know yet. The agent prefers code, configs, CI, schemas, and runtime artifacts. A claim cites a repo-relative path. What the tree does not show is marked `UNKNOWN`, with what would resolve it. Confidence on each inference is `confirmed`, `inferred`, or `unknown`.

The guide is written into the target repo under `docs/`. The index is `docs/00-start-here.md`. Generated pages say **system guide**. They do not contain the slash command, and they do not use the words investigate, investigation, or investigated. Secrets are named, not copied. Absolute filesystem paths are not written into the docs.

After the guide is linked, the agent writes the repository root `README.md`. That file says what the repo is, what it does, and what is wrong with it, then a verdict: rewrite, replace, or keep, and which job the next system still does. The five reviews below each appear in "What is wrong".

### How to run it

From the target repository:

```text
/han-investigate-and-document
```

Full outline is the default. Name sections when you want a slice:

```text
/han-investigate-and-document only architecture and data
```

On a large tree the agent delivers a thin pass first (context, containers, start-here), then deepens.

You will be asked before any install. Required baseline is `git`, `rg` or `grep`, and the language package manager. Recommended extras are one SBOM tool (`syft` or `cdxgen`) and, after languages are known, maintainability analyzers (lizard plus stack tools). A decline skips that tool. The gap is written as `UNKNOWN`.

### What it writes

```text
docs/
├── 00-start-here.md
├── context/            vision, glossary, stakeholders
├── architecture/       C4 L1–L3, ADRs, module map
├── dependencies/       inventory, external and internal services, SBOM
├── data/               model, dictionary, flows, migrations, table-fill sources
├── behavior/           sequences, states, rules, API, events, required uploads
├── operations/         deploy, runbook, config, observability, CI/CD
├── quality-security/   tests, threat model, the five reviews, maintainability, debt
└── onboarding/         local setup, contribution
README.md               written last
```

Empty sections stay as files and say what is missing. Diagrams are Mermaid in the markdown. An OpenAPI file is linked and summarized. When none exists, a draft API reference is inferred from routes.

Two inventories are required when the tree has the thing they describe:

- **Table fill sources** (`docs/data/table-fill-sources.md`) when a database or store exists. Every table or collection is Yes, No, or Likely for "this system writes it", with a file and line.
- **Required document uploads** (`docs/behavior/required-document-uploads.md`) when a user form exists. One entry per required, visible upload: form, flow, document label, and the intention stated on that form. Optional and hidden uploads stay out.

### Required reviews

These five are the point of the quality pass. Each is linked from the start-here index and from the root README. Rules live under `han-investigate-and-document/reviews/`.

| Page | Intention |
| --- | --- |
| `docs/quality-security/sso.md` | Whether the code calls **YesEm** or **ImID**. A comment or an unused package is not an implementation. Staff, operators, and invented voter passwords are called out for YesEm or ImID. A citizen already on a national ID provider stays on that provider. |
| `docs/quality-security/access-control.md` | Grade the whole system **None**, **Weak**, **RBAC**, or **ABAC**, and say which surfaces fall below it. The bar is ABAC: the person, the resource, and the action. RBAC checked on every state-changing action is the minimum. A hidden button or a shared password is not a check. |
| `docs/operations/observability-guide.md` | Logs, metrics, traces, alerts, and health, plus a Gaps section. A file log means logging exists. Metrics, traces, alerts, and health are recorded as present or absent. Audit of who changed a record stays a separate finding. |
| `docs/quality-security/design-system.md` | Every user surface and whether it references **Henaket**. A similar color or a Bootstrap theme is not Henaket. Desktop staff tools get a row too. |
| `docs/quality-security/once-only.md` | One row per data point. A register fact the user is asked to type is a violation. A register fact stored locally is a violation, except an id: PSN, SSN, tax id, company registration number, or sign-in subject. The page opens with those two counts. |

Maintainability is a separate required page, `docs/quality-security/maintainability-analysis.md`, from lizard and the stack analyzers. It is a hotspot report, not one of the five verdict reviews.

### Verdict

The root README does not ask the reader to choose. The conclusion follows from the five reviews and any other confirmed defect. A replacement is expected to sign staff and operators in with YesEm or ImID, decide each action from person, resource, and action, use Henaket on screens a person uses, and expose a health check, metrics, and alerts.
