# han-investigate-and-document

Explain an unfamiliar codebase as a system guide.

The agent prefers code, configs, CI, schemas, and runtime artifacts. A claim cites a repo-relative path. What the tree does not show is marked `UNKNOWN`, with what would resolve it. Confidence on each inference is `confirmed`, `inferred`, or `unknown`.

The guide is written into the target repo under `docs/`. The index is `docs/00-start-here.md`. Generated pages say **system guide**. They do not contain the slash command, and they do not use the words investigate, investigation, or investigated. Secrets are named, not copied. Absolute filesystem paths are not written into the docs.

After the guide is linked, the agent writes the repository root `README.md`. That file says what the repo is and what it does, and links the guide. It does not contain a verdict.

Open the repository you want examined and invoke the skill by name. `disable-model-invocation: true`, so a casual mention does not start it. Type the slash command, or ask for this skill by name.

## Options

From the target repository, the full outline:

```text
/han-investigate-and-document
```

Name sections when you want a slice:

```text
/han-investigate-and-document only architecture and data
```

Point at another path when the workspace is not the repository:

```text
/han-investigate-and-document on ~/src/some-repo
```

On a large tree the agent delivers a thin pass first (context, containers, start-here), then deepens.

You will be asked before any install. Required baseline is `git`, `rg` or `grep`, and the language package manager. Recommended extras are one SBOM tool (`syft` or `cdxgen`) and, after languages are known, maintainability analyzers (lizard plus stack tools). A decline skips that tool. The gap is written as `UNKNOWN`.

## What it writes

```text
docs/
├── 00-start-here.md
├── context/            vision, glossary, stakeholders
├── architecture/       C4 L1–L3, ADRs, module map
├── dependencies/       inventory, external and internal services, SBOM
├── data/               model, dictionary, flows, migrations, table-fill sources
├── behavior/           sequences, states, rules, API, events, required uploads
├── operations/         deploy, runbook, config, observability, CI/CD
├── quality-security/   tests, threat model, authentication, access control, UI, maintainability, debt
└── onboarding/         local setup, contribution
README.md               written last
```

Empty sections stay as files and say what is missing. Diagrams are Mermaid in the markdown. An OpenAPI file is linked and summarized. When none exists, a draft API reference is inferred from routes.

Two inventories are required when the tree has the thing they describe:

- **Table fill sources** (`docs/data/table-fill-sources.md`) when a database or store exists. Every table or collection is Yes, No, or Likely for "this system writes it", with a file and line.
- **Required document uploads** (`docs/behavior/required-document-uploads.md`) when a user form exists. One entry per required, visible upload: form, flow, document label, and the intention stated on that form. Optional and hidden uploads stay out.

### What the quality pages record

These pages describe the tree. Each is linked from the start-here index.

| Page | Intention |
| --- | --- |
| `docs/quality-security/authentication.md` | The sign-in mechanism the code calls. A comment or an unused package is not an implementation. A provider is named only when the code names it. |
| `docs/quality-security/access-control.md` | Who may do what. The grade is **None**, **Weak**, **RBAC**, or **ABAC**, from the checks in this tree, and which surfaces differ. A hidden button or a shared password is not a check. |
| `docs/operations/observability-guide.md` | Logs, metrics, traces, alerts, and health, plus a Gaps section for what the tree does not show. A file log means logging exists. |
| `docs/quality-security/ui.md` | Every user surface and the UI stack the code uses. A design system is named only when the code references it. Desktop tools get a row too. |

Maintainability is a separate page, `docs/quality-security/maintainability-analysis.md`, from lizard and the stack analyzers. It is a hotspot report.

## Install

The agent reads this skill from `~/.cursor/skills/han-investigate-and-document/`. If this checkout is already `~/.cursor/skills`, it is installed.

Otherwise:

```bash
git clone https://github.com/hanumanum/skills.git
mkdir -p ~/.cursor/skills
cp -a skills/han-investigate-and-document ~/.cursor/skills/
```

To follow later pulls from a clone you keep, link the folder. `REPO` is the clone directory:

```bash
ln -sfn "$REPO/han-investigate-and-document" ~/.cursor/skills/han-investigate-and-document
```

`git` and `rg` are required. Other tools are optional; the agent asks before installing any of them.
