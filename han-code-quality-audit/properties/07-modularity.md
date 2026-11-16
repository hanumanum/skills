# Modularity

Slug: `modularity`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which change in one module breaks a module that did not need to know about it, and why that edge cannot be tested or moved on its own. **Excerpt** is the import. **How to improve** is the specific move: which edge to reverse, which export to stop re-exporting, or which file to split. Number the issues by the risk order in SKILL.md. An edge that is already wrong, or that the next edit in one module breaks another module through, comes before a large local split. The opening says what the folders suggest and what the import graph actually does.

Read the import graphs in `tooling/`. For JavaScript and TypeScript, prefer `madge.{run-id}.json` when it exists, and use `import-graph.{language}.{run-id}.json` for the other languages and as a check when madge is absent. Then confirm every cycle and every cross-module edge in source. A graph edge you cannot find in an import is not a finding.

Do not treat a folder as a boundary unless the imports respect it.

## What to measure

1. Package boundaries. Which packages exist, what each exports, and which applications depend on which packages. Manifests and import statements are source.
2. The import graph inside each application. Group files by folder (domain, then feature). Count cross-folder import sites. Record cycles. Record a shared or infrastructure folder that imports a product module.
3. Public surface. Barrels and package entry files that re-export internal modules, an internal schema, or the running server type, and callers that depend on that whole surface.
4. Hidden coupling. A shared client, database collection, or global type used directly from many features, including test fixtures exported from a production types package.
5. Cohesion. The largest source files, and which responsibilities each one mixes. A file that merely contains two jobs is a separation-of-concerns finding. Report it here only when the file's size and imports force callers in other modules to change with it.
6. Duplication across sibling packages is the dedup passes. Mention a cross-package copy here only when it is also an import-boundary problem.

## Kinds

- `cycle`
- `layering-break` — infrastructure or a shared folder imports a feature, or a feature reaches into another feature's internals
- `wide-surface` — a barrel re-exports internals and callers depend on the barrel
- `hidden-coupling` — many features import the same client, collection, or global type
- `low-cohesion` — one file mixes responsibilities and other modules import that mix

The symbol for a cycle is the first file in the cycle after sorting. List the whole cycle in the evidence. The symbol for a wide surface or a hidden coupling is the exported name, or `file` when the whole module is the problem.

Above the findings, in a few lines, name the boundaries that already hold. That note is not a list of healthy files.

**How to improve** is the specific move: which edge to reverse, which export to stop re-exporting, or which file to split. Number the findings by the risk order in SKILL.md. Do not propose a new architecture.
