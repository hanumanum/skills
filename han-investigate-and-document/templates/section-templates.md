# Section templates

Copy structures into `docs/` files. Strip unused rows; keep confidence tags. Do not write `investigate`, `investigation`, or `investigated` into those files.

The repository-root `README.md` is not one of these section pages. Write it last from [root-readme.md](root-readme.md). It links `sso.md`, `access-control.md`, `observability-guide.md`, `design-system.md`, and `once-only.md`.

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

## sso.md

```markdown
# Single sign-on

YesEm and ImID are the staff and voter sign-in this guide measures against. A citizen already on a national ID provider stays on that provider.

| Surface | Who | Mechanism in this tree | YesEm or ImID called? | Confidence |
|---------|-----|------------------------|-----------------------|------------|
| | | local password / session / national ID / SQL login / none | yes — cite file / no | |

## Evidence

- 

## Related

- [Access control](access-control.md)
- [Threat model](threat-model.md)
```

## access-control.md

```markdown
# Access control

Sign-in is [Single sign-on](sso.md). This page is what that identity is allowed to do.

Bar for a replacement: attributes of the person, the resource, and the action (ABAC). A role checked on every state-changing action (RBAC) is the minimum.

| Surface | Who is recognized | What allows the action | Confidence |
|---------|-------------------|------------------------|------------|
| | | | |

## Grade

| Grade | Applies | Why |
|-------|---------|-----|
| None / Weak / RBAC / ABAC | | |

## Evidence

- 
```

## design-system.md

```markdown
# Design system

Henaket is the design system these screens are measured against. No match in the tree means this repository does not reference it.

| Surface | Who uses it | UI stack in this tree | Henaket referenced? | Confidence |
|---------|-------------|----------------------|---------------------|------------|
| | citizen / staff / desktop | | yes — cite file / no | |

## Evidence

- 
```

## once-only.md

```markdown
# Once Only

## Violations

| Category | Data points |
|----------|-------------|
| Asked from the user | |
| Stored, and not an id | |

<data points in both>. <unique violation rows> rows are violations.

A register id may be stored: PSN, SSN, tax id, company registration number, and the sign-in subject.

| Model | field | is from register | is asked to user | is stored | stored JSON snippet | notes | links to evidence files | status |
|-------|-------|------------------|------------------|-----------|---------------------|-------|-------------------------|--------|
```

Rules: [reviews/once-only.md](../reviews/once-only.md).

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

Sign-in detail: [Single sign-on](sso.md). What each identity may do: [Access control](access-control.md).

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

## Executive verdict

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
