# Dedup near-duplicates

Slug: `dedup-near-duplicates`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which difference a later edit will update on one side only, and which difference must survive. **Excerpt** shows both sides, including the field that differs. **How to improve** either parameterizes that difference or names a factory whose arguments are the path and the callee. Name the destination file. If both fields are real, the direction keeps both.

Use `tooling/jscpd.{run-id}.json` when it exists. Ignore clones whose two sides are the same text; those belong to the exact-copy pass. Then read the remaining near-duplicates and the patterns the detector missed.

This pass owns code that is the same shape with small differences. It does not own byte-identical files. If this pass is run alone, do not report exact copies.

## Coverage

After the exact pairs are set aside, keep going through the rest of the repository. Do not stop after the first cluster. Sibling applications, tests cloned with the production file, overlapping locale catalogs, and config twins (eslint, jest, nuxt, vite, Docker) are in this pass. A Vue, Svelte, or Angular file the detector did not parse still counts: compare identically named files that share a relative path.

## What counts

- The same function with different names, fields, or constants
- Role-cloned pages or handlers that differ by a path and a callee
- A repeated setup: the same middleware, bootstrap, route factory, or test copied with a different label
- A block the clone detector reported below 100 percent
- Locale catalogs that overlap, and config files that are the same shape with a small difference
- A shared package that already contains the helper, with a near-copy still living in an application

Quote both sides. The id uses the lexicographically first file. The symbol is the function name, or `lines-{start}` when there is no function. Name the other files in the evidence.

## What does not count

- Types or schemas that model different resources, even when the fields look similar. Say so only if you almost reported them, in one sentence at the end, not as a finding.
- Generated dumps, lockfiles, and vendor code.
- An exact copy.

## Kinds

- `near-block`
- `role-clone`
- `repeated-setup`

**How to improve** is one of: parameterize the difference, or introduce a factory whose arguments are the path and the callee. Name the destination file. If the copies differ by a field and both fields are real, the direction keeps both fields.

Do not recommend a shared framework. Do not merge two behaviors that only look similar.
