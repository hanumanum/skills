---
name: han-investigate-and-document
description: >-
  Investigate an unfamiliar codebase and produce a system guide under docs/
  plus a root README (what the repo is and what it does). Covers vision, C4,
  dependencies/SBOM, data and table-fill sources, behavior (including
  required document uploads), operations, authentication, access control,
  the UI the code uses, observability, security, maintainability, and local
  setup. Use when the user invokes /han-investigate-and-document, or asks to
  reverse-engineer, map, document, or onboard onto an unknown repository.
disable-model-invocation: true
---

# Investigate and document

Produce a complete system guide for an unfamiliar codebase from evidence —
not speculation. Prefer code, configs, CI, schemas, and runtime artifacts.
Mark unknowns explicitly.

## When invoked

User says `/han-investigate-and-document`, or asks to investigate/document/map an
unfamiliar codebase for onboarding.

## Hard rules

1. **Evidence over invention.** Every claim cites source paths (files, configs, tickets). If unknown, write `UNKNOWN` + what would resolve it. When the citation is a file or folder in the codebase, use a relative markdown link as in [doc-outline.md](doc-outline.md#codebase-references). Never write an absolute filesystem path.
2. **Do not invent ADRs, owners, SLAs, or business rules.** Infer candidates; label confidence: `confirmed` | `inferred` | `unknown`.
3. **Never commit secrets.** Redact credentials; document secret *names* and where they live, not values.
4. **Write docs into the target repo** under `docs/` unless the user names another path. Section files live in `docs/<section>/`, and the index is `docs/00-start-here.md`. Do not create `docs/investigate/`. Do not put output only in chat.
5. **Missing tool gate.** If a tool is not installed, stop and ask. Install it only after the user agrees. A decline means skip that tool. Never install, and never fetch a package on the fly, before that reply.
6. **Scope control.** Default = full outline. If the user names sections, only produce those. If the repo is huge, deliver a thin-slice pass first (context + containers + start-here), then deepen.
7. **Wording in generated files.** Text written under `docs/` and in the root `README.md` must not contain `investigate`, `investigation`, or `investigated`. Call the set a **system guide**. The slash command is internal and must not appear in those files.
8. **Domain-independent.** Describe the mechanisms this repository uses. Name an identity provider, a design system, or an external data source only when the code names it. Do not measure the tree against a standard the repository does not reference. Do not write a verdict, and do not recommend rewrite, replace, or keep.

## Prerequisites (run first)

```bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/check-tools.sh
```

Baseline required: `git`, `rg`/`grep`, language package manager for the repo (`npm`/`dotnet`/`pip`/`go`/`mvn`/`gradle`/…).
Optional: SBOM (`syft` or `@cyclonedx/cdxgen`), `jq`, Graphviz `dot`, `gh`, container tools.
Maintainability (after language detection): **lizard** (universal) + stack enhancers — see [maintainability.md](maintainability.md).

### Missing tool gate

Run this whenever `check-tools.sh` or `ensure-maintainability-tools.sh` reports a missing tool, and whenever a later step needs a CLI that is not on `PATH`.

1. **Stop.** Do not install, and do not continue that step, until the user replies.
2. **Ask in one message.** For each missing tool, name it, say whether it is required or optional, say what it is for, and give the install command from the script. Ask whether to install them. Recommend the required baseline plus one SBOM tool (`syft` or `cdxgen`).
3. **On approval, install only what they approved.** "Yes", "ok", "install", or "go ahead" approves the set you asked about. If they name a subset, install only that subset. Prefer the script (`ensure-maintainability-tools.sh --install`) or the printed user-space command. Then re-run the check.
4. **On decline, do not install.** Skip that tool, write the gap as `UNKNOWN` or a tooling note, and continue with what is already installed. A required tool they decline blocks only the steps that need it.
5. **These count as installing** and need the same yes first: `sudo`, `apt`/`dnf`/`brew`, `pipx`, `npm i -g`, `dotnet tool install`, `go install`, `rustup component add`, `curl | sh`, and `npx --yes` (including `@cyclonedx/cdxgen` and mermaid-cli).

Do not treat a missing optional tool as permission to fetch it. Do not install "so the run can finish."

Read [tooling.md](tooling.md) for ecosystem-specific commands.

## Output layout

```bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/scaffold-docs.sh "<REPO_ROOT>"
```

Creates `docs/` matching [doc-outline.md](doc-outline.md). Fill files in place; keep the Start-here README as the index.

Default root: workspace / git root of the codebase being documented.

## Workflow

Copy and track:

```
Documentation progress:
- [ ] 0. Scope & tooling
- [ ] 1. Recon (stack, entrypoints, existing docs)
- [ ] 2. Context & purpose
- [ ] 3. Architecture (C4 L1–L3, ADRs, module map)
- [ ] 4. Dependencies (inventory, external/internal, SBOM)
- [ ] 5. Data (model, dictionary, flows, migrations, **table-fill sources**)
- [ ] 6. Behavior & logic (sequences, states, rules, API, events, **required document uploads**)
- [ ] 7. Operations (deploy, runbook, config, observability, CI/CD)
- [ ] 8. Quality & security (tests, threat model, authentication, access control, UI, debt, **maintainability**)
- [ ] 9. Onboarding (local setup, contribution, start-here index)
- [ ] 10. Gap review & confidence pass
- [ ] 11. Root README
```

### 0. Scope & tooling

1. Confirm target path and output path (`docs/` default).
2. Ask which sections to prioritize if the user did not say "full".
3. Run `check-tools.sh`. If anything is missing, follow the missing-tool gate, then re-run the check.
4. Scaffold the doc tree.
5. After recon knows languages: run `ensure-maintainability-tools.sh` with no `--install`. If it reports `NEED_INSTALL`, follow the missing-tool gate. Only after approval, re-run with `--install`, then `run-maintainability.sh` during step 8.

### 1. Recon

Do this before writing narrative docs:

- Tree top-level dirs; detect languages/frameworks from manifests (`package.json`, `*.csproj`, `go.mod`, `pom.xml`, `Cargo.toml`, `pyproject.toml`, `Gemfile`, Dockerfiles, etc.).
- Find entrypoints: `main`, `Program.cs`, `Startup`, routers, `cmd/`, serverless handlers.
- Inventory existing docs (`README*`, `docs/`, ADRs, OpenAPI, wikis linked from README).
- Map CI (`.github/workflows`, Azure Pipelines, Jenkinsfile, GitLab CI).
- Note deploy artifacts (Docker Compose, K8s, Terraform, pubxml, Helm).

Use explore subagents for broad scans when the tree is large; keep synthesis in the main thread.

Detailed techniques: [analysis-playbook.md](analysis-playbook.md).

### 2–9. Produce documentation

For each section in [doc-outline.md](doc-outline.md):

1. Gather evidence (playbook commands + code reads).
2. Write/update the corresponding file under `docs/`.
3. Use Mermaid for diagrams (default). Use Graphviz only if already helpful and `dot` is available.
4. Apply templates from [templates/](templates/) where they fit.
5. Leave `UNKNOWN` stubs rather than skipping files — empty sections must say what is missing.
6. End every section markdown file with the [document footer](doc-outline.md#document-footers): a link to `00-start-here.md` and a link to every other markdown file in the same directory. Do this again in gap review, after the file set for that folder is final.

**Diagrams:** prefer fenced `mermaid` blocks inside the markdown files so docs render in GitHub/GitLab without a build step.

**API reference:** if OpenAPI/Swagger exists, link and summarize; if not, generate a draft from routes/controllers and mark `inferred`.

**SBOM:** use a generator that is already installed (`syft`, then `cdxgen`). If neither is installed, ask (missing-tool gate) before `npx --yes @cyclonedx/cdxgen` or any other install. After approval:

```bash
syft dir:"<REPO_ROOT>" -o cyclonedx-json > docs/dependencies/sbom.cdx.json
# or, only if cdxgen is installed or the user just approved fetching it:
npx --yes @cyclonedx/cdxgen -r -o docs/dependencies/sbom.cdx.json
```

Do not commit huge SBOM binaries to chat; write the file and summarize criticality in the inventory markdown.

**Authentication, access control, UI, and observability (required in steps 7 and 8):** write the pages below from the code, then link each from `docs/00-start-here.md`. Link authentication and access control from the threat model. Rules live in [reviews/](reviews/).

| Page | Write | Review |
|------|-------|--------|
| How sign-in works in this tree | `docs/quality-security/authentication.md` | [reviews/authentication.md](reviews/authentication.md) |
| Who may do what, and the grade the checks match | `docs/quality-security/access-control.md` | [reviews/access-control.md](reviews/access-control.md) |
| Logs, metrics, traces, alerts, health | Gaps section in `docs/operations/observability-guide.md` | [reviews/observability.md](reviews/observability.md) |
| UI stack on each user surface | `docs/quality-security/ui.md` | [reviews/ui.md](reviews/ui.md) |

**Maintainability (required in step 8):** detect languages, ask before any install, then run and write the report:

```bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>"
# only after the user agrees to install the missing analyzers:
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>" --install
bash ~/.cursor/skills/han-investigate-and-document/scripts/run-maintainability.sh "<REPO_ROOT>"
```

Synthesize `docs/quality-security/maintainability-analysis.md` from `static-analysis/` outputs. Full rules: [maintainability.md](maintainability.md).

**Table fill sources (required in step 5 when a DB/store exists):** write `docs/data/table-fill-sources.md` — inventory every table/collection referenced in code; classify whether **this system** writes it (**Yes** / **No** / **Likely**) with file:line or SP call-site evidence; summarize counts; list write SPs/jobs whose bodies are out of repo; note limits. See [analysis-playbook.md](analysis-playbook.md) § Data and [templates/section-templates.md](templates/section-templates.md). If no durable store: `N/A` stub with confidence.

**Required document uploads (required in step 6 when a user form exists):** write `docs/behavior/required-document-uploads.md`. One entry per form that has a required, visible upload. Each entry names the form, the flow, the document label, and the intention taken from that form. Skip optional and hidden uploads. If there is no user form, write `N/A`. Rules: [reviews/required-document-uploads.md](reviews/required-document-uploads.md).

### 10. Gap review

1. Walk every file in the outline; ensure none are blank.
2. Add a `docs/00-start-here.md` index linking all artifacts + confidence legend. The index calls the set a system guide and does not use the slash-command name.
3. Refresh document footers on every section page: Index, then all sibling markdown files in that directory. `00-start-here.md` has no sibling pages, so it gets no footer.
4. List top 10 remaining unknowns as questions for stakeholders.

### 11. Root README

Write `README.md` at the repository root after the guide is linked. Shape: [templates/root-readme.md](templates/root-readme.md). The file says what the repository is and what it does. It does not contain a verdict.

Then tell the user what was produced (path tree, including `README.md`) and the suggested next deepen pass.

## Confidence legend (use everywhere)

| Tag | Meaning |
|-----|---------|
| `confirmed` | Directly evidenced in repo/config/runtime |
| `inferred` | Reasonable deduction; may be wrong |
| `unknown` | No evidence; needs a human or external system |

## Style

- Concise, scannable markdown; tables for inventories.
- Codebase files and folders are relative markdown links. Link text is the path from the repository root. The target is the path from the document. See [doc-outline.md](doc-outline.md#codebase-references).
- No filler; no motivational prose.
- Match project language for domain terms once the glossary exists.
- In every file under `docs/`, write **system guide**. Do not write `investigate`, `investigation`, or `investigated`.
- Never write a machine home directory, drive letter, or `file://` URL into a doc, footer, diagram, or generated report that is saved with the docs. Rewrite tool output (lizard, syft, and similar) to repo-relative paths before saving it.

## Additional resources

- [doc-outline.md](doc-outline.md) — required documentation structure (authoritative)
- [analysis-playbook.md](analysis-playbook.md) — how to read each area
- [reviews/authentication.md](reviews/authentication.md) — how sign-in works in this tree
- [reviews/access-control.md](reviews/access-control.md) — who may do what, and the grade the checks match
- [reviews/observability.md](reviews/observability.md) — logs, metrics, traces, alerts, health
- [reviews/ui.md](reviews/ui.md) — UI stack on each user surface
- [reviews/required-document-uploads.md](reviews/required-document-uploads.md) — forms that require the user to upload a file, with the document and its intention
- [maintainability.md](maintainability.md) — language-aware static maintainability analysis
- [tooling.md](tooling.md) — tool install matrix and SBOM/diagram commands
- [templates/](templates/) — section templates
- [templates/root-readme.md](templates/root-readme.md) — root `README.md`, written last
