# Tooling

## check-tools.sh

```bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/check-tools.sh
# optional: hint stack
bash ~/.cursor/skills/han-investigate-and-document/scripts/check-tools.sh --stack dotnet|node|python|go|java|auto
```

Exit codes: `0` baseline OK; `1` missing required; `2` only optionals missing (still usable).

## Install policy

Follow the missing-tool gate in [SKILL.md](SKILL.md#missing-tool-gate).

1. Run the check. If the result is `OK`, continue.
2. If anything is missing, **stop and ask** in one message: tool, required or optional, why, install command. Recommend the required baseline plus one SBOM tool.
3. Install **only after** the user agrees ("yes", "ok", "install", "go ahead", or a named subset). Prefer user-space: official installers, `npm i -g`, `pipx`, `~/.local/bin`.
4. Re-check. If they decline a tool, leave it uninstalled and record the gap.

`npx --yes`, `curl | sh`, and `sudo` are installs. Do not run them before the user agrees.

## Recommended tools

| Tool | Role | Install hint (Linux) |
|------|------|----------------------|
| `git` | history, ownership | distro package |
| `rg` (ripgrep) | fast search | distro / Cursor ships one |
| `jq` | JSON SBOM/API | distro package |
| `dot` (Graphviz) | optional diagrams | `graphviz` package |
| `syft` | SBOM | `curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh \| sh -s -- -b "$HOME/.local/bin"` |
| `cdxgen` | SBOM alt | `npm i -g @cyclonedx/cdxgen` or `npx` |
| `gh` | remote metadata, CODEOWNERS on GitHub | GitHub CLI |
| `docker` | compose-based local recon | Docker Engine |

Language CLIs as required by the repo: `dotnet`, `node`/`npm`, `python3`/`pip`/`uv`, `go`, `mvn`/`gradle`.

## Maintainability analyzers

Language-aware. Details: [maintainability.md](maintainability.md).

```bash
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>"
bash ~/.cursor/skills/han-investigate-and-document/scripts/ensure-maintainability-tools.sh "<REPO_ROOT>" --install
bash ~/.cursor/skills/han-investigate-and-document/scripts/run-maintainability.sh "<REPO_ROOT>"
```

| Tool | When | Install hint |
|------|------|----------------|
| `lizard` | **Always** (universal CCN/NLOC) | `pipx install lizard` |
| `roslynator` | C# / .NET detected | `dotnet tool install -g roslynator.dotnet.cli` |
| `radon`, `ruff` | Python | `pipx install radon ruff` |
| `gocyclo`, `staticcheck` | Go | `go install …` |
| `cargo clippy` | Rust | `rustup component add clippy` |
| ESLint | JS/TS only if already configured in repo | do not invent config |

`--install` only after the user agrees to those missing analyzers. Prefer user-space (`pipx`, `~/.dotnet/tools`, `~/go/bin`).

## SBOM

Prefer writing CycloneDX JSON:

```bash
REPO="<REPO_ROOT>"
OUT="$REPO/docs/dependencies"

if command -v syft >/dev/null; then
  syft "dir:$REPO" -o cyclonedx-json > "$OUT/sbom.cdx.json"
elif command -v cdxgen >/dev/null; then
  cdxgen -r -o "$OUT/sbom.cdx.json" "$REPO"
else
  # Ask first. Run this only after the user agrees to fetch cdxgen.
  npx --yes @cyclonedx/cdxgen -r -o "$OUT/sbom.cdx.json" "$REPO"
fi
```

Then write `sbom-summary.md`: component count, top direct deps, license oddities, known critical packages.

## Diagrams

Default: Mermaid in markdown (no install).

Optional PNG export (only if user wants images):

```bash
npx --yes @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png
# or Graphviz:
dot -Tpng diagram.dot -o diagram.png
```

## Stack detection cheat sheet

| Signal files | Stack |
|--------------|-------|
| `*.sln`, `*.csproj` | .NET |
| `package.json` | Node |
| `pyproject.toml`, `requirements.txt` | Python |
| `go.mod` | Go |
| `pom.xml`, `build.gradle*` | Java |
| `Cargo.toml` | Rust |
| `mix.exs` | Elixir |
