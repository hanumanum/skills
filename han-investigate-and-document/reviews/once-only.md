# Once Only

Write `docs/quality-security/once-only.md`. Link it from `docs/00-start-here.md` and from the root README. Companion page: `docs/data/own-and-register-data.md`.

The system loads a person, and that person's companies, from the registers with the SSN. It does not ask the user for a fact a register returns. It does not keep that fact in its own tables. An id may be stored. Anything else from a register may not.

## Registers

Cite the call that returns each group. Do not invent a field the call does not read.

| Source | What it returns | Typical call |
|--------|-----------------|--------------|
| National ID | Given name, family name, PSN, document number. Email when the weak profile reads it. Sign-in subject (`sub`). | Profile parser on the token |
| Civil register, by SSN | Name, patronymic, document, registration address, and the other keys on the person object | Search-by-PSN / `person_info` |
| Business register, by SSN | Company name, registration number, address, tax id | Companies-by-PSN / `ebr_data` |
| Other registers the code calls by SSN or tax id | Cadastre, permits, and the keys that call returns | The client method. If the body is not in the repo, the field list is `unknown` |

Own data is created here: case status, wizard page, tracking id, holder, deadline, payment pin, uploaded file, a phone the form requires and no register returns, and the request itself (volumes, choices, appointment, the place this application is about).

## Ids that may be stored

Only these register values may be written locally:

- PSN and SSN, including a field whose name or label is that number
- Tax id (TIN)
- Company registration number
- Sign-in subject (`sub` / account identity)

A name, patronymic, address, email, document number, or passport is not an id. Storing it is a violation.

## The table

One row is one data point. Inventory:

- Columns on the account, the application, files, payments, the sign-in session, and the task row that receives the submission
- Keys inside JSON columns (`accounts.data`, `applications.data`, `applications.applicant`, `tasks.data`)
- Every form input. Skip hint text, info blocks, and buttons

Do not inventory staff tables that are not the case (meetings, roles, workflow definitions).

| Model | field | is from register | is asked to user | is stored | stored JSON snippet | notes | links to evidence files | status |
|-------|-------|------------------|------------------|-----------|---------------------|-------|-------------------------|--------|

- **is from register** — `yes` or `no`. `confirmed` when a register call reads that key. `inferred` when only the label matches a name, PSN, passport, tax id, or patronymic.
- **is asked to user** — `yes`, `no`, or `yes (n/m)` when n of m forms show it as an editable input. Readonly and hidden are `no`.
- **is stored** — `yes` when a column or a JSON write persists it.
- **stored JSON snippet** — the key as written, for example `` `{"ssn":""}` ``. `—` for a scalar column.
- **links** — relative links. Link text is `file:line` and the target ends in `#Lline` when one line holds the field. Otherwise link the file.
- **status** — `confirmed` | `inferred` | `unknown`.

A form value stored as `applications.data` and copied into `tasks.data` on submit is stored. Say that once above the table, not on every row.

## Violations

A row is a violation when either of these is true:

1. **Asked.** `is from register` is `yes` and `is asked to user` starts with `yes`.
2. **Stored.** `is from register` is `yes`, `is stored` is `yes`, and the field is not an id from the list above.

A row can be both. Count it in each category.

Mark violation rows so a preview shows them. Inline `style` on a `<tr>` is stripped. Use `class="violation"` and a red marker in the row. Add `docs/quality-security/once-only-preview.css` and point `markdown.styles` at it from the workspace settings:

```css
tr.violation td {
  background-color: #fee2e2 !important;
  color: #9f1239 !important;
}
```

## Report at the start of the page

Put this immediately under the title, before the table. Fill the numbers from the rows. Do not leave the counts as placeholders.

```markdown
## Violations

| Category | Data points |
|----------|-------------|
| Asked from the user | <n> |
| Stored, and not an id | <m> |

<k> data points are in both categories. <n + m − k> rows are violations.
```

## README

One "What is wrong" bullet states the two counts and links `docs/quality-security/once-only.md`. The verdict does not reproduce register facts in the next system's tables, and does not ask the user for them. Ids may be stored.
