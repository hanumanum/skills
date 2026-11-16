# Required document uploads

Write `docs/behavior/required-document-uploads.md`. Link it from `docs/00-start-here.md` under Behavior. This is an inventory of files the user must upload.

## When

The system has a form a person fills in: JSON form definitions, HTML forms, wizard steps, or an equivalent. If there is no such form, write `N/A — no user form evidenced` and stop.

## What to keep

A row is a file the user must upload.

1. Find upload fields. In this style of form that is `type: uploader`. Elsewhere it is `input type="file"`, a multipart attachment, or the project's upload component.
2. Keep the field when it is required and the user can see it.
3. Leave out optional uploads and hidden fields. A hidden field is in the definition and is not shown to the user.

## Each entry

One heading per form. A form with two required files lists both under that heading.

- **Form:** the title the user sees.
- **Flow:** the process that form submits to. Prefer the workflow name in that form's config. If there is no workflow, use the route or handler name and say so.
- **Document:** the label on the upload field, then the field name in parentheses.
- **Intention:** what the file is for, in the guide's language. Take it from the field label, the section title, or the page title. Do not invent a legal purpose the form does not state.

Open the page with the count of forms and the count of files, and the date the forms were read. Mark confidence.

## If none are required

Say that no visible required upload field was found, and cite the form set that was searched.
