# Documentation outline (authoritative)

Produce this structure under `docs/` (or the user-specified root).
File names are fixed so the Start-here index can link consistently.
Do not create a `docs/investigate/` directory.

```
docs/
├── 00-start-here.md
├── context/
│   ├── vision-product-brief.md
│   ├── glossary-domain-model.md
│   └── stakeholder-map.md
├── architecture/
│   ├── c4-system-context.md          # C4 Level 1
│   ├── c4-containers.md              # C4 Level 2
│   ├── c4-components.md              # C4 Level 3
│   ├── architecture-decision-records.md
│   └── module-package-map.md
├── dependencies/
│   ├── dependency-inventory.md
│   ├── external-service-catalog.md
│   ├── internal-service-dependencies.md
│   └── sbom.cdx.json                 # or .xml; plus short sbom-summary.md
├── data/
│   ├── data-model-erd.md
│   ├── data-dictionary.md
│   ├── data-flow.md
│   ├── migration-history.md
│   └── table-fill-sources.md       # who/what fills each table
├── behavior/
│   ├── sequence-diagrams.md
│   ├── state-machines.md
│   ├── business-rules-catalog.md
│   ├── api-reference.md
│   ├── event-catalog.md
│   └── required-document-uploads.md  # forms that require a user file, and why
├── operations/
│   ├── deployment-infrastructure.md
│   ├── runbook.md
│   ├── configuration-reference.md
│   ├── observability-guide.md        # include a Gaps section
│   └── cicd-pipeline.md
├── quality-security/
│   ├── test-strategy-coverage.md
│   ├── maintainability-analysis.md
│   ├── static-analysis/              # lizard (+ stack) raw outputs
│   ├── threat-model.md
│   ├── sso.md                        # YesEm / ImID, called or not
│   ├── access-control.md             # ABAC / RBAC grade and strength
│   ├── design-system.md              # Henaket on each user surface
│   ├── once-only.md                  # register facts asked, or stored beyond an id
│   └── known-issues-tech-debt.md
└── onboarding/
    ├── local-setup.md
    └── contribution-guide.md
```

## Section intent (verbatim product brief)

### Context & purpose

- **Vision/product brief** — what problem it solves, for whom, why it exists
- **Glossary/domain model** — the ubiquitous language, core entities and their relationships
- **Stakeholder map** — who owns it, who consumes it, who to ask

### Architecture

- **System context diagram (C4 Level 1)** — the system as a black box among external actors and systems
- **Container diagram (C4 Level 2)** — deployable units, their responsibilities and tech stack
- **Component diagram (C4 Level 3)** — internal structure of each container
- **Architecture Decision Records (ADRs)** — why key choices were made (frameworks, patterns, tradeoffs)
- **Module/package map** — directory structure annotated with what each part does

### Dependencies

- **Dependency inventory** — libraries/frameworks with versions, license, purpose, and criticality
- **External service catalog** — third-party APIs, auth methods, SLAs, failure modes
- **Internal service dependencies** — what this depends on and what depends on it
- **Software Bill of Materials (SBOM)** — full transitive dependency tree for security/audit

### Data

- **Data model / ERD** — schema, tables, keys, constraints
- **Data dictionary** — field-level meaning, types, valid ranges
- **Data flow diagram** — how data moves, is transformed, and persisted (plus PII/sensitive-data handling)
- **Migration history** — schema evolution and current state
- **Table fill sources** — inventory of tables/collections with evidence for whether *this system* inserts/updates them, or data comes from an unknown/external source (manual SQL/DBA, seed scripts, other apps, ETL). Required whenever a database or persistent store is present.

### Behavior & logic

- **Sequence diagrams** — for the critical use cases / user journeys
- **State machine diagrams** — for entities with meaningful lifecycles
- **Business rules catalog** — the non-obvious logic, validations, edge cases, "why does it do that"
- **API reference** — endpoints, contracts, request/response shapes, error codes (OpenAPI/Swagger)
- **Event catalog** — if event-driven: events, producers, consumers, payloads
- **Required document uploads** — each form that requires a visible file from the user: form title, flow name, document label, and the intention stated on that form. Optional and hidden uploads stay out. Review: [reviews/required-document-uploads.md](reviews/required-document-uploads.md)

### Operations

- **Deployment/infrastructure diagram** — environments, hosting, network topology
- **Runbook** — how to deploy, roll back, restart, common incidents
- **Configuration reference** — env vars, feature flags, secrets management
- **Observability guide** — logs, metrics, traces, alerts, health, and a Gaps section for what is missing. Review: [reviews/observability.md](reviews/observability.md)
- **CI/CD pipeline description** — build, test, release stages

### Quality & security

- **Test strategy & coverage map** — what's tested, how, and the gaps
- **Maintainability static analysis** — language-detected analyzers (lizard + stack tools); complexity/size hotspots; verdict and refactor priorities
- **Threat model** — attack surface, auth/authorization model, known risks. Link `sso.md` and `access-control.md` from the auth section.
- **Single sign-on** — whether YesEm or ImID is called, and the mechanism the code uses instead. Review: [reviews/sso.md](reviews/sso.md)
- **Access control** — grade None / Weak / RBAC / ABAC, and whether every state-changing action is checked. Review: [reviews/access-control.md](reviews/access-control.md)
- **Design system** — each user surface and whether it uses Henaket. Review: [reviews/design-system.md](reviews/design-system.md)
- **Once Only** — one row per data point. A register fact the user is asked to type is a violation. A register fact stored locally is a violation, except an id (PSN, SSN, tax id, company registration number, sign-in subject). The page opens with those two counts. Review: [reviews/once-only.md](reviews/once-only.md)
- **Known issues / tech debt register** — landmines, TODOs, deprecated paths

### Onboarding

- **Local setup guide** — clone-to-running in your own environment
- **Contribution guide** — branching, code style, review process
- **"Start here" README** — `docs/00-start-here.md`, the entry point that indexes everything above
- **Root README** — `README.md` at the repository root, written last, in the executive shape (what it is, what it does, what is wrong, verdict). Template: [templates/root-readme.md](templates/root-readme.md). It links the SSO, access-control, observability, Henaket, and Once Only pages.

## Codebase references

When a document mentions a file or folder in the repository being documented, make it a relative markdown link.

1. **Link text** is the path from the repository root, with `:line` or `:start-end` when a line matters. Example: `public_html/routes/web.php:20-64`.
2. **Link target** is the path from the markdown file to that file or folder. Count `../` from the document's real location. Do not hard-code a depth.
3. Apply this in prose, tables, evidence lists, and diagram captions.
4. Do not leave a bare absolute path, and do not leave a repo-root path as plain code when the file exists in the tree. Plain code is only for symbols that are not paths (a class name, an env var, a permission slug).
5. External URLs (an API host, a git remote) stay URLs. They are not codebase paths.
6. Analyzer and SBOM output often prints absolute paths. Before saving `static-analysis/` or `sbom.cdx.json`, replace the repository-root prefix so stored paths start at the repo root.

From `docs/behavior/api-reference.md` (the default, two levels below the repo root), a route file is:

```markdown
[public_html/routes/web.php](../../public_html/routes/web.php):20-64
```

If the user names a deeper docs root, add one `../` per extra directory. Do not hard-code a depth.

A folder uses the same shape: `[public_html/app/Services](../../public_html/app/Services)`.

## Document footers

Every markdown file inside a section directory ends with a navigation line. The index does not.

Rules:

1. First link is the index: `[Index](../00-start-here.md)`.
2. Then one link for every other `*.md` file in the **same directory** (siblings). Do not link the current file.
3. Link text is the same label the index uses for that file.
4. Order matches the index order for that section.
5. One line, separated with ` · `.
6. Do not add previous/next links that walk the whole documentation set.
7. Do not link non-markdown artifacts (`sbom.cdx.json`, `static-analysis/`, raw analyzer output).
8. `00-start-here.md` sits alone in the docs root, so it has no sibling line.
9. Rewrite the line at the end of the pass so a file added later appears on every sibling.

Example, at the bottom of `dependencies/dependency-inventory.md`:

```markdown
---

[Index](../00-start-here.md) · [External service catalog](external-service-catalog.md) · [Internal service dependencies](internal-service-dependencies.md) · [SBOM summary](sbom-summary.md)
```
