# Access control

Write `docs/quality-security/access-control.md`. Template: [section-templates.md](../templates/section-templates.md). Link it from the threat model, from `docs/00-start-here.md`, and from the root README. Sign-in is [authentication.md](authentication.md).

Describe how this tree decides who may do what.

## What to establish

Inventory every surface (page, API, desktop command, job, file upload). For each, cite who is recognized and what allows the action.

Give the implementation one grade, and say which surfaces differ from it.

| Grade | Evidence |
|-------|----------|
| **None** | No user, one shared session value for every account, or only a database login / shared password |
| **Weak** | Roles or permission names exist, and a state-changing action skips them: the check is only in HTML, the matcher is a substring, an admin flag bypasses the list, or a route requires login only |
| **RBAC** | A role grants a fixed list of actions, and every state-changing action checks that list |
| **ABAC** | The allow decision uses attributes of the person, the resource (the record, its owner, a tenant, a device), and the action. A menu hide or a read filter is not this grade by itself |

A filter on some queries is an attribute on those queries. It is ABAC only when the write path uses the same attributes and refuses a mismatch. Record the filter and the grade separately.

## Strength

When a grade is Weak or RBAC, say whether the check is strong:

- The server or the handler checks before the write.
- The check names the action, not a prefix of a permission string.
- A hidden button is not the only control.
- One shared secret (a code, a password in config, a session word) does not stand in for a person.

A read the code already treats as public stays described as public.
