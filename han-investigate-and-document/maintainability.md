# Maintainability analysis

Required deliverable: `docs/quality-security/maintainability-analysis.md`  
Raw outputs: `docs/quality-security/static-analysis/`

Language-agnostic by default. Detect languages → if a recommended analyzer is missing, **stop and ask** → install only after the user agrees → run → synthesize the markdown report.

## When (workflow step 8)

During Quality & security, after recon knows the stack(s):

```bash
# 1) Detect + list recommended tools (no install)
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>"

# 2) Only after the user agrees to install the missing tools:
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>" --install

# 3) Run analyzers → raw reports
bash ~/.cursor/skills/han-investigate-and-document/scripts/run-maintainability.sh "<REPO_ROOT>"
```

Then write `maintainability-analysis.md` from the raw outputs + code reading (hotspots). Use the template in [templates/section-templates.md](templates/section-templates.md).

## Universal baseline (always)

| Tool | Role | Install (user-space preferred) |
|------|------|--------------------------------|
| **lizard** | Cyclomatic complexity, NLOC, length, params — many languages | `pipx install lizard` (or venv + symlink to `~/.local/bin`) |

Exclude vendor/build dirs: `node_modules`, `vendor`, `bin`, `obj`, `dist`, `build`, `.git`, `wwwroot/lib`, target, `__pycache__`, `.venv`, etc.

Default warning thresholds (document if you change them):

| Metric | Warn when |
|--------|-----------|
| CCN (cyclomatic) | > 10 |
| Function length (lines) | > 60 |
| Parameters | > 4 |

## Language detection → analyzers

Scripts auto-detect from manifests + extensions. Agent may refine paths (monorepo packages).

| Detected | lizard `-l` | Extra analyzer (optional, after approval) | Notes |
|----------|-------------|---------------------------------------------|--------|
| C# / .NET | `csharp` | `roslynator` (`dotnet tool install -g roslynator.dotnet.cli`) | Prefer app projects; exclude `*.Designer.cs` noise in narrative |
| JavaScript / TypeScript | `javascript`, `typescript` | project ESLint if configured; else lizard only | Do not invent eslint config |
| Python | `python` | `radon` (cc/mi) and/or `ruff` check | `pipx install radon ruff` |
| Go | `go` | `gocyclo`, `staticcheck` | go install … |
| Java / Kotlin | `java`, `kotlin` | lizard primary; PMD/SpotBugs only if already in build | |
| C / C++ | `cpp` | lizard | |
| Rust | `rust` | `cargo clippy` if toolchain present | |
| PHP / Ruby / Swift / Scala / … | lizard language id if supported | lizard only unless tool already in repo | |
| Mixed / unknown | omit `-l` (all known) | lizard | |

**Rule:** If lizard or a stack analyzer is missing, ask before installing it. After the user agrees, install and run it. If they decline, skip that analyzer and say so in the report. Do not pass `--install` before that reply.

## Report must include

1. **Scope** — paths analyzed, languages, tools + versions, thresholds, date  
2. **Verdict** — low / moderate / elevated / critical maintainability risk (justify from metrics)  
3. **Summary table** — total NLOC, function count, avg CCN, warning count, warning rate  
4. **Hotspots** — top methods/files by CCN and length (exclude generated noise; say so)  
5. **Largest files** — by NLOC  
6. **Stack-specific findings** — e.g. Roslyn diagnostics, radon MI, clippy  
7. **Interpretation** — complexity average vs tail, modularity, duplication signals, testability, tooling gaps  
8. **Recommended next actions** — concrete refactors / add analyzers to CI  
9. **Re-run commands**  
10. Confidence tags on interpretive claims

Link raw files under `static-analysis/` (e.g. `lizard-warnings.txt`, `lizard-full.txt`, `languages.txt`, optional `roslynator.txt` / `radon.txt`).

## Synthesis rules

- Evidence over invention: cite file paths from lizard/roslynator output as relative markdown links (see [doc-outline.md](doc-outline.md#codebase-references)). Strip the absolute repository prefix from `static-analysis/` text before saving it.  
- Generated code (EF designers, protobuf stubs, `*.g.cs`, minified JS): list separately or exclude from P1 backlog.  
- Do not claim “Maintainability Index = N” unless a tool computed it (e.g. radon). Lizard CCN/NLOC is enough.  
- Feed clear hotspots into `known-issues-tech-debt.md` as TD items when they are product code.
