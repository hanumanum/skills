# Access control (ABAC / RBAC)

Write `docs/quality-security/access-control.md`. Template: [section-templates.md](../templates/section-templates.md). Link it from the threat model, from `docs/00-start-here.md`, and from the root README. Sign-in is [sso.md](sso.md).

The bar for a replacement: each action is decided from attributes of the person, the resource, and the action (ABAC). A role that grants a fixed list of actions, checked on every state-changing action (RBAC), is the minimum.

## What to establish

Inventory every surface (page, API, desktop command, job, file upload). For each, cite who is recognized and what allows the action.

Grade the implementation. Use one grade for the system, and say which surfaces fall below it.

| Grade | Evidence |
|-------|----------|
| **None** | No user, one shared session value for every account, or only a database login / shared password |
| **Weak** | Roles or permission names exist, and a state-changing action skips them: the check is only in HTML, the matcher is a substring, an admin flag bypasses the list, or a route requires login only |
| **RBAC** | A role grants a fixed list of actions, and every state-changing action checks that list |
| **ABAC** | The allow decision uses attributes of the person, the resource (record, district, constituency, election, device), and the action. A menu hide or a read filter is not this grade by itself |

A district or constituency filter on some queries is an attribute on those queries. It becomes ABAC only when the write path uses the same attributes and refuses a mismatch. Record the filter and the grade separately.

## Strength

When a grade is Weak or RBAC, say whether the check is strong:

- The server or the handler checks before the write.
- The check names the action, not a prefix of a permission string.
- A hidden button is not the only control.
- One shared secret (a code, a password in config, a session word) does not stand in for a person.

## README and verdict

One "What is wrong" bullet states the grade, the strongest mechanism found, and the surfaces that skip it. Link `docs/quality-security/access-control.md`.

The verdict states the bar: ABAC, with RBAC checked on every action as the minimum. A menu, a shared code, or a SQL login does not meet it. Public read of an already published result can stay open when the code already treats it as public.
