# Single sign-on (YesEm, ImID)

Write `docs/quality-security/sso.md`. Template: [section-templates.md](../templates/section-templates.md). The root README cites this file. See [root-readme.md](../templates/root-readme.md).

Sign-in is not authorization. Link [access-control.md](access-control.md) for who may do what after sign-in.

## What to establish

For every person who signs in, record whether the code calls **YesEm** or **ImID**.

Search the tree for `YesEm`, `YesEM`, `ImID`, `ImId`, `imid`, and the hosts those products use. Also record the mechanism the code actually calls: local password table, session word, OAuth/OIDC, national ID (`nid.e-gov.am` or another IdP), Windows auth, a database login, or no account.

| Result | Write this |
|--------|------------|
| A call to YesEm or ImID is in the code and is reached | Implemented. Cite the file. Name who uses it (staff, operator, voter, citizen). |
| The name appears only in a comment, a disabled registration, or an unused package | Not implemented. Cite the line and say it is not called. |
| No match | Not implemented. Name the mechanism that is called. |

Do not write that a system uses YesEm or ImID unless a live call exists. Do not describe a provider's protocol from memory.

## Who stays where

- Staff, operators, and desktop users on a local username and password: the replacement signs them in with YesEm or ImID.
- A voter who invents a login and password: the replacement signs them in with YesEm or ImID.
- A citizen who already returns from a national ID provider (for example `nid.e-gov.am`): they stay on that provider. Do not move that citizen login onto YesEm or ImID.
- A program with no account, where the only gate is a SQL login or the PC: there is no SSO. Say so.

## README and verdict

One "What is wrong" bullet when SSO is absent or only commented out. Name the real mechanism and link `docs/quality-security/sso.md`.

The verdict's "what the new system keeps" names YesEm or ImID for the people in the table above, and leaves a national-ID citizen login on that provider.
