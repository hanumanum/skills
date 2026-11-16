# Root README

Write this file last, after gap review, at the repository root as `README.md`. It indexes the system guide. It does not replace `docs/00-start-here.md`.

The reader should understand what the repository is and what it does. Describe the tree. Do not write a verdict, and do not recommend rewrite, replace, or keep.

Do not write `investigate`, `investigation`, or `investigated` in this file. Cite the system guide. Use relative links. Keep secrets out; link the placeholder inventory when one exists.

## Shape

```markdown
# <Product name>

<One sentence: what it is for whom.>

<Two or three sentences: the pieces, the host name if the code names one, the database name if the code names one.>

The full write-up is in [docs/00-start-here.md](docs/00-start-here.md). Facts below are taken from that system guide (<YYYY-MM-DD>). Where the code does not say something, the linked page marks it unknown.

## What this repository is

<What the tree is. Name the runtime and the version the project pins. Say what this repository does not contain when a neighbor system owns that job, and link that repository when the URL is known.>

## What it does

- <Job 1>
- <Job 2>

Further reading: [what the product is](docs/context/vision-product-brief.md), [who is involved](docs/context/stakeholder-map.md), [how the pieces connect](docs/architecture/c4-system-context.md).

## For developers and operators

| Piece | Role |
|-------|------|
| | |

Start here:

- Run it locally: [docs/onboarding/local-setup.md](docs/onboarding/local-setup.md)
- Who signs in: [docs/quality-security/authentication.md](docs/quality-security/authentication.md)
- Who may do what: [docs/quality-security/access-control.md](docs/quality-security/access-control.md)
- Logs and health: [docs/operations/observability-guide.md](docs/operations/observability-guide.md)
- Screens: [docs/quality-security/ui.md](docs/quality-security/ui.md)

All documents: [docs/00-start-here.md](docs/00-start-here.md).
```

Add the developer links this repository needs (configuration, runbook, data model, contribution).

If `README.md` already exists and is a product guide in this shape, update it in place. If it is a vendor or framework readme, replace the product content and leave a single line pointing at that file when the upstream text is still useful.
