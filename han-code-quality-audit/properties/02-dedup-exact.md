# Dedup exact copies

Slug: `dedup-exact-copies`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which copy will be left stale on the next edit, or which copied path, key, or guard is already wrong. **How to improve** names the file that stays the only copy, and whether the other files import it or are deleted.

Use `tooling/byte-identical.{run-id}.json` and, when it exists, `tooling/jscpd.{run-id}.json`. Then open the files. This pass owns exact copies only. A near-duplicate, a role clone, or a domain twin belongs to the near-duplicate pass even when this pass is run alone. Do not put it in this report.

## Coverage

The whole repository: applications, packages, tools, scripts, and tests. Do not stop after the first clone cluster.

Sibling applications are part of this pass. Compare files that share a relative path. A Vue, Svelte, or Angular file the clone detector did not parse still counts: open the identically named files and compare them. Locale catalogs and config files (eslint, jest, nuxt, vite, Docker) that are the same text are exact copies. Public assets that share a relative path and the same bytes are one hash group.

## What counts

- Byte-identical files. One finding per hash group. The path in the id is the lexicographically first file. The symbol is the first 12 hex characters of the sha256.
- A jscpd clone whose two sides are the same text. Ignore clones below 100 percent.
- A copy that is exact and is wrong on its face: a path, a key, or a guard that still names the file it was copied from. Kind `copy-paste-defect`. Quote both sides.
- Code that already exists in a shared package and is pasted again into an application. The shared file is the copy that stays.

## What does not count

- Lockfiles and vendor trees.
- A generated dump or snapshot self-clone. If the detector reports one, it is a single `byte-identical` finding and the direction is to leave it. Do not hand-merge the JSON, and do not omit the cluster.
- Types or schemas that model different resources, even when the fields look alike. Those are not exact copies.
- A near-duplicate with a renamed field.

## Kinds

- `byte-identical`
- `exact-block`
- `copy-paste-defect`

For `exact-block`, the symbol is the function name, or `lines-{start}` when there is no function. Use the lexicographically first file in the id. Name the other files in the evidence.

**How to improve** says which file should be the only copy, and whether the other files should import it or be deleted. Do not propose a new abstraction for code that is not identical.
