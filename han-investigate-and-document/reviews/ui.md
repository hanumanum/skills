# User interface

Write `docs/quality-security/ui.md`. Template: [section-templates.md](../templates/section-templates.md). Link it from `docs/00-start-here.md` and from the root README.

## What to establish

List every user surface and the UI stack the code uses. Name a design system or component library only when a file in the tree references it.

| Surface | Record |
|---------|--------|
| End-user pages | Host, template, and the libraries the code imports |
| Operator or admin screens | Same |
| Desktop windows | Same. A program with no end-user page still gets a row. Say that. |

A similar color is not a reference. Do not infer a design system from a screenshot or an organisation name.
