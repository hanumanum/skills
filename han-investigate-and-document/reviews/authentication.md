# Authentication

Write `docs/quality-security/authentication.md`. Template: [section-templates.md](../templates/section-templates.md). Link it from the threat model, from `docs/00-start-here.md`, and from the root README.

Sign-in is not authorization. Link [access-control.md](access-control.md) for who may do what after sign-in.

## What to establish

For every person or client that signs in, record the mechanism the code calls.

Search the tree for the auth library and the routes that use it. Record what the code actually calls: local password table, session, OAuth or OIDC, API key, platform auth, a database login, or no account. Name a provider only when the code names it, and cite that file.

| Result | Write this |
|--------|------------|
| A call is in the code and is reached | Implemented. Cite the file. Name who uses it. |
| The name appears only in a comment, a disabled registration, or an unused package | Not called. Cite the line. |
| No account | Say so. A SQL login or the machine itself is not an application account. |

Do not describe a provider's protocol from memory.
