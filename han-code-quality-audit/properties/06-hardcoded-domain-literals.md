# Hardcoded domain literals

Slug: `hardcoded-domain-literals`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which behavior changes in one place and stays wrong in the other, or which decision the literal is making. When one rule is copied in many places, one issue holds a table of literal, file, and symbol. **How to improve** names the single constant or enum, and the module that already owns the rule. If no module owns it yet, name the function that implements the rule.

No tool. Read application and shared-package source that runs in production. Read tests and migrations only when they lock the same literal the runtime uses. You may read config the program loads (yaml, toml, json that is not a lockfile), locale catalogs, and notification or document templates. Read a catalog to see whether pages use it, not as a specification. Do not read documentation.

Skip generated snapshots, lockfiles, and vendored code. Skip design tokens, color scales, SVG namespaces, and localhost log lines. Skip a machine-facing error string that is not shown to a person and is not used for branching. Skip a value that is already read from the environment, a config file, or a CMS, unless a hardcoded fallback overrides it.

One issue can hold many call sites. For user-facing copy, summarize by surface and give representative files. Do not file one issue per string.

## What to find

1. External links and third-party identifiers. URLs, hostnames, service ids, widget script URLs, support phones, and legal-document links in pages, clients, emails, or notifications. The same destination copied with different URLs. A link that omits an id the route requires. A fallback to a production host when config is missing.
2. A duration, deadline, limit, fee, threshold, status string, or format (phone, plate, currency, locale) written in more than one place. Record every copy. A rule that exists once as a named constant is lower priority than the same value written twice, and a single named constant is not a finding.
3. A branch that infers a type or a flow from an amount, a status word, or a stringly-typed function name, instead of an explicit flag or a shared enum.
4. Upstream or provider text used as control flow. Success, denial, and error handling that matches a sentence or a substring from an external API. Group repeated phrases. One wording change that would change a user-visible outcome is the finding.
5. User-facing copy that bypasses the translation system. If a catalog exists, check whether it is used. Pages and templates that embed copy directly. Separate interface strings from legal or contract text. Note parallel copies that have already diverged.
6. Notification and document labels. Email subjects, message bodies, display names, signing prompts, role labels, and document titles that live in service code rather than next to their templates.

## Kinds

- `external-link` — the symbol is the function or the page that embeds the literal. The path is the lexicographically first file.
- `copied-literal` — the symbol is the literal as it appears in source. The path is the lexicographically first file. Name every other file in the evidence.
- `magic-branch` — the symbol is the function that contains the branch.
- `provider-text` — the symbol is the function that matches the sentence. Name every other call site in the evidence.
- `untranslated-copy` — the symbol is the page or the template. One issue per surface, not per sentence.
- `notification-label` — the symbol is the function that builds the subject, body, or title.

**How to improve** names the single constant, enum, catalog, or template the value moves next to, and the module that already owns the rule. If no module owns it yet, name the function that implements the rule. Keep the current behavior. Do not propose rewriting the text of a message or a legal clause. A phrase map keeps the current sentences and moves the match off the raw string. A catalog keeps the current user-visible text.
