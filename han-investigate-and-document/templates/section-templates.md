# Section templates

Copy structures into `docs/` files. Strip unused rows; keep confidence tags. Do not write `investigate`, `investigation`, or `investigated` into those files.

The repository-root `README.md` is not one of these section pages. Write it last from [root-readme.md](root-readme.md). It says what the repository is and what it does. It links `authentication.md`, `access-control.md`, `observability-guide.md`, and `ui.md`.

## vision-product-brief.md

```markdown
# Vision / product brief

| Field | Value | Confidence |
|-------|-------|------------|
| Problem | | |
| Audience | | |
| Why it exists | | |
| Non-goals | | |

## Evidence
- [public_html/app/Example.php](../../public_html/app/Example.php):40-55 — note. Default docs live in `docs/<section>/`, two levels below the repo root. If the user picked another docs root, change the number of `../`.
```

## glossary-domain-model.md

```markdown
# Glossary / domain model

| Term | Meaning | Code / table symbol | Confidence |
|------|---------|---------------------|------------|
| | | | |

## Relationships

\`\`\`mermaid
erDiagram
  ENTITY_A ||--o{ ENTITY_B : has
\`\`\`
```

## stakeholder-map.md

```markdown
# Stakeholder map

| Role | Who | Contact / team | Notes | Confidence |
|------|-----|----------------|-------|------------|
| Owner | | | | |
| Maintainer | | | | |
| Consumer | | | | |
| Ask about X | | | | |
```

## dependency-inventory.md

```markdown
# Dependency inventory

| Package | Version | License | Purpose | Criticality | Confidence |
|---------|---------|---------|---------|-------------|------------|
| | | | | critical/high/dev | |
```

## external-service-catalog.md

```markdown
# External service catalog

| Service | Purpose | Auth | Base URL / config key | SLA | Failure mode | Confidence |
|---------|---------|------|----------------------|-----|--------------|------------|
| | | | | unknown | | |
```

## business-rules-catalog.md

```markdown
# Business rules catalog

| ID | Rule | Where enforced | Edge cases | Why | Confidence |
|----|------|----------------|------------|-----|------------|
| BR-001 | | `path:line` | | | |
```

## api-reference.md

```markdown
# API reference

Source of truth: `path/to/openapi.json` | drafted from code (`inferred`)

| Method | Path | Auth | Request | Response | Errors | Confidence |
|--------|------|------|---------|----------|--------|------------|
| | | | | | | |
```

## configuration-reference.md

```markdown
# Configuration reference

| Name | Where set | Required | Default | Purpose | Secret? |
|------|-----------|----------|---------|---------|---------|
| | env / appsettings / flag | | | | yes/no |
```

## table-fill-sources.md

```markdown
# Database tables — fill sources

Code-inferred inventory of persistent tables/collections used by this system, with evidence for whether **this system** inserts/updates them or data comes from an **unknown source** (manual SQL / DBA / other system / ETL).

**Confidence:** code evidence only unless schema/SP bodies are in-repo.

## Summary

| Filled by this system? | Meaning | Approx. count |
|---|---|---|
| **Yes** | App issues INSERT/UPDATE/DELETE/MERGE or a named write SP/job | |
| **No** | Only SELECT / JOIN / query in app code | |
| **Likely** | Write path inferred; SP/job body or exact target not in repo | |

### How to read “Filled by system”

- **Yes** — this codebase issues DML or a write SP/job.
- **No** — only reads found; fill method unknown.
- **Likely** — parallel/variant tables or shared SP family; confirm when SP SQL is available.

### Evidence base

| Component | Path | Role |
|---|---|---|
| | | |

Stack / access style: (EF / ADO.NET / Prisma / …). Schema scripts in repo: yes/no.

---

## Full inventory

### \<Domain group\>

| Table / collection | Purpose | Insert / update evidence | Filled by system? | Confidence |
|---|---|---|---|---|
| | | `path:line` or SP name | Yes / No / Likely | High / Medium / Low |

### Reference (unknown source)

App only **reads** these. Fill method is **unknown**.

| Table / collection | Purpose | Insert / update evidence | Filled by system? | Confidence |
|---|---|---|---|---|
| | | SELECT-only `path:line` | No | |

---

## Write stored procedures / jobs (bodies not in repo)

| Procedure / job | Likely target table(s) | Call site |
|---|---|---|
| | | `path:line` |

---

## Views / read-models

(List separately; omit from base fill counts unless they materialize.)

---

## Limits

1.
2.

## Related

- [Data model / ERD](./data-model-erd.md)
- [Data dictionary](./data-dictionary.md)
- [Data flow](./data-flow.md)
```

## authentication.md

```markdown
# Authentication

How this repository signs people and clients in. The mechanism is the one the code calls. A provider is named only when the code names it.

| Surface | Who | Mechanism in this tree | Confidence |
|---------|-----|------------------------|------------|
| | | local password / session / OAuth or OIDC / API key / platform auth / database login / none | |

## Evidence

- 

## Related

- [Access control](access-control.md)
- [Threat model](threat-model.md)
```

Rules: [reviews/authentication.md](../reviews/authentication.md).

## access-control.md

```markdown
# Access control

Sign-in is [Authentication](authentication.md). This page is what that identity is allowed to do.

| Surface | Who is recognized | What allows the action | Confidence |
|---------|-------------------|------------------------|------------|
| | | | |

## Grade

The grade names the checks in this tree.

| Grade | Applies | Why |
|-------|---------|-----|
| None / Weak / RBAC / ABAC | | |

## Evidence

- 
```

Rules: [reviews/access-control.md](../reviews/access-control.md).

## ui.md

```markdown
# User interface

The UI stack this repository uses. A design system is named only when the code references it.

| Surface | Who uses it | UI stack in this tree | Design system named in code | Confidence |
|---------|-------------|----------------------|-----------------------------|------------|
| | end user / operator / desktop | | file, or none | |

## Evidence

- 
```

Rules: [reviews/ui.md](../reviews/ui.md).

## required-document-uploads.md

```markdown
# Required document uploads

Forms where the user must upload a file. Required and visible upload fields only. <n> forms, <n> files. Read on <date>. `confirmed`.

## <short name>

- **Form:** <title the user sees>
- **Flow:** `<workflow or route>`
- **Document:** <field label> (`<field name>`)
- **Intention:** <what the file is for, from the field, section, or page title>
```

Rules: [reviews/required-document-uploads.md](../reviews/required-document-uploads.md).

## observability-guide.md

```markdown
# Observability guide

| Mechanism | Where | What it records | Confidence |
|-----------|-------|-----------------|------------|
| Logs | | | |
| Metrics | | | |
| Traces | | | |
| Alerts | | | |
| Health | | | |

## Gaps

<Name each missing mechanism. A file log means logging exists. Say that, then name metrics, traces, alerts, and health when they are absent.>

## Where to look when it breaks

1.
```

## threat-model.md

```markdown
# Threat model

## Trust boundaries
## Authn / authz model

Sign-in detail: [Authentication](authentication.md). What each identity may do: [Access control](access-control.md).

## Attack surface
| Entry | Risk | Mitigations present | Gaps | Confidence |
|-------|------|---------------------|------|------------|
| | | | | |

## Sensitive data
```

## known-issues-tech-debt.md

```markdown
# Known issues / tech debt

| ID | Item | Location | Severity | Notes |
|----|------|----------|----------|-------|
| TD-001 | | | | |
```

## maintainability-analysis.md

```markdown
# Maintainability static analysis

Date:
Scope: (paths / languages)
Tools: (name + version)

## Risk

Risk: low | moderate | elevated | critical — rationale.

| Metric | Value | Notes |
|--------|------:|-------|
| Total NLOC | | |
| Functions | | |
| Avg CCN | | |
| Warning count | | thresholds: CCN>10, length>60 |

## Hotspots

| Priority | Symbol | CCN | Length | NLOC | File | Issue |
|----------|--------|----:|-------:|-----:|------|-------|
| P1 | | | | | | |

## Largest files

| NLOC | File | Comment |
|-----:|------|---------|

## Stack-specific findings

(roslynator / radon / gocyclo / clippy / none)

## Interpretation

| Dimension | Assessment | Confidence |
|-----------|------------|------------|
| Complexity (average) | | |
| Complexity (tail) | | |
| Modularity | | |
| Testability | | |
| Tooling / CI gates | | |

## Recommended next actions

1.
2.

## Re-run

\`\`\`bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/run-maintainability.sh "<REPO_ROOT>"
\`\`\`

Raw: `quality-security/static-analysis/`
```

## Document footer

Append to every section page. Omit on `00-start-here.md`. Replace the sibling list with the other markdown files in that page's directory, using index labels, in index order.

```markdown
---

[Index](../00-start-here.md) · [Sibling title](sibling.md)
```

## ADR entry

```markdown
## ADR-NNN: Title

- Status: proposed | accepted | inferred-candidate
- Date:
- Context:
- Decision:
- Consequences:
- Evidence:
```
