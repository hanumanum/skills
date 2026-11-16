# Root README

Write this file last, after gap review, at the repository root as `README.md`. It indexes the system guide. It does not replace `docs/00-start-here.md`.

The reader should understand what the repository is, what it does, and what is wrong with it. The verdict states the conclusion. Do not ask the reader to decide, and do not offer a menu of options.

Do not write `investigate`, `investigation`, or `investigated` in this file. Cite the system guide. Use relative links. Keep secrets out; link the placeholder inventory when one exists.

## Required links

Each of these has already been written. The README points at them from "What is wrong" and from the verdict:

| Topic | Page in the target repo | How the skill reviews it |
|-------|--------------------------|--------------------------|
| YesEm / ImID | `docs/quality-security/sso.md` | [reviews/sso.md](../reviews/sso.md) |
| ABAC / RBAC | `docs/quality-security/access-control.md` | [reviews/access-control.md](../reviews/access-control.md) |
| Observability | `docs/operations/observability-guide.md` | [reviews/observability.md](../reviews/observability.md) |
| Henaket | `docs/quality-security/design-system.md` | [reviews/design-system.md](../reviews/design-system.md) |
| Once Only | `docs/quality-security/once-only.md` | [reviews/once-only.md](../reviews/once-only.md) |

Those five links in the target repo are relative to `README.md` (`docs/...`).

## Shape

```markdown
# <Product name>

<One sentence: what it is for whom.>

<Two or three sentences: the pieces, the host name if the code names one, the database name if the code names one.>

The full write-up is in [docs/00-start-here.md](docs/00-start-here.md). Facts below are taken from that system guide (<YYYY-MM-DD>). Where the code does not say something, the linked page marks it unknown.

## Executive summary

### What this repository is

<What the tree is. Name the runtime and the version the project pins. Say what this repository does not contain when a neighbor system owns that job, and link that repository when the URL is known.>

### What it does

- <Job 1>
- <Job 2>

### What is wrong with it

- <SSO. Name YesEm or ImID only as the replacement, unless this tree calls one of them. Link docs/quality-security/sso.md.>
- <Access control. State the grade from the access-control page: None, Weak, RBAC, or ABAC. State the bar: ABAC, with RBAC checked on every action as the minimum. Link docs/quality-security/access-control.md.>
- <Observability. Name the log that exists, then metrics, traces, alerts, and health that are absent. Link docs/operations/observability-guide.md.>
- <Henaket. Name each user surface and the UI stack. Link docs/quality-security/design-system.md.>
- <Once Only. State how many register facts are asked from the user, and how many are stored beyond an id. Link docs/quality-security/once-only.md.>
- <Other confirmed defects, each with a link to the page that holds the evidence: secrets, audit of who did what, maintainability, threat-model findings.>

Further reading: [what the product is](docs/context/vision-product-brief.md), [who is involved](docs/context/stakeholder-map.md), [how the pieces connect](docs/architecture/c4-system-context.md).

## Verdict

<One short conclusion: rewrite, replace, or keep, and what job the next system still does. The conclusion follows from the evidence above.>

That is the conclusion of this guide. Each reason cites what this tree shows.

### <Proving subsection>

<Two to six sentences. File links. Include a subsection when SSO, access control, observability, or Henaket is part of why the conclusion holds.>

### What the new system keeps

<Rules worth carrying, from the business-rules catalog, each as a bullet.>

<Closing sentences: what must not be reproduced. Staff, operators, and invented voter passwords sign in with YesEm or ImID. A citizen already on a national ID provider stays there. Each action is allowed from the person, the resource, and the action (ABAC). A role checked on every action (RBAC) is the minimum. Screens a person uses follow the Henaket design system. The system records who did what and exposes a health check, metrics, and alerts.>

## For developers and operators

| Piece | Role |
|-------|------|
| | |

Start here:

- Run it locally: [docs/onboarding/local-setup.md](docs/onboarding/local-setup.md)
- Who signs in: [docs/quality-security/sso.md](docs/quality-security/sso.md)
- Who may do what: [docs/quality-security/access-control.md](docs/quality-security/access-control.md)
- Logs and health: [docs/operations/observability-guide.md](docs/operations/observability-guide.md)
- Screens: [docs/quality-security/design-system.md](docs/quality-security/design-system.md)
- Register facts: [docs/quality-security/once-only.md](docs/quality-security/once-only.md)

All documents: [docs/00-start-here.md](docs/00-start-here.md).
```

Add the developer links this repository needs (configuration, runbook, data model, contribution). Keep the four review links.

If `README.md` already exists and is a product guide in this shape, update it in place. If it is a vendor or framework readme, replace the product content and leave a single line pointing at that file when the upstream text is still useful.
