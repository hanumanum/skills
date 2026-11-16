#!/usr/bin/env bash
# ensure-maintainability-tools.sh — detect languages; list or install analyzers
# Usage:
#   ensure-maintainability-tools.sh [REPO_ROOT]
#   ensure-maintainability-tools.sh [REPO_ROOT] --install
set -euo pipefail

ROOT="."
INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --install) INSTALL=1 ;;
    -h|--help)
      echo "Usage: ensure-maintainability-tools.sh [REPO_ROOT] [--install]"
      exit 0
      ;;
    *)
      if [[ "$arg" != --* ]]; then ROOT="$arg"; fi
      ;;
  esac
done

ROOT="$(cd "$ROOT" && pwd)"
have() { command -v "$1" >/dev/null 2>&1; }

echo "=== maintainability tools ==="
echo "Repo: $ROOT"
echo

detect_langs() {
  (
    cd "$ROOT"
    find . -type f \
      \( -name '*.cs' -o -name '*.csproj' -o -name '*.sln' \
         -o -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' -o -name 'package.json' \
         -o -name '*.py' -o -name 'pyproject.toml' -o -name 'requirements.txt' \
         -o -name '*.go' -o -name 'go.mod' \
         -o -name '*.java' -o -name '*.kt' -o -name 'pom.xml' \
         -o -name 'build.gradle' -o -name 'build.gradle.kts' \
         -o -name '*.rs' -o -name 'Cargo.toml' \
         -o -name '*.c' -o -name '*.h' -o -name '*.cpp' -o -name '*.hpp' \
         -o -name '*.php' -o -name '*.rb' -o -name '*.swift' -o -name '*.scala' \) \
      ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/bin/*' ! -path '*/obj/*' \
      ! -path '*/vendor/*' ! -path '*/dist/*' ! -path '*/build/*' ! -path '*/target/*' \
      ! -path '*/.venv/*' ! -path '*/wwwroot/lib/*' \
      2>/dev/null | head -8000
  ) | while read -r f; do
    case "$f" in
      *.cs|*.csproj|*.sln) echo csharp ;;
      *.ts|*.tsx) echo typescript ;;
      *.js|*.jsx|*package.json) echo javascript ;;
      *.py|*pyproject.toml|*requirements.txt) echo python ;;
      *.go|*go.mod) echo go ;;
      *.java|*pom.xml|*build.gradle|*build.gradle.kts) echo java ;;
      *.kt) echo kotlin ;;
      *.rs|*Cargo.toml) echo rust ;;
      *.c|*.h|*.cpp|*.hpp) echo cpp ;;
      *.php) echo php ;;
      *.rb) echo ruby ;;
      *.swift) echo swift ;;
      *.scala) echo scala ;;
    esac
  done | sort -u
}

mapfile -t LANGS < <(detect_langs)
if ((${#LANGS[@]} == 0)); then
  LANGS=(unknown)
fi
echo "Detected languages: ${LANGS[*]}"
echo

needed=()
recommend() {
  local id="$1" bin="$2" hint="$3"
  for row in "${needed[@]:-}"; do
    [[ "${row%%|*}" == "$id" ]] && return 0
  done
  needed+=("$id|$bin|$hint")
}

recommend "lizard" "lizard" "pipx install lizard   # or venv: python3 -m venv ~/.venvs/lizard && ~/.venvs/lizard/bin/pip install lizard && ln -sf ~/.venvs/lizard/bin/lizard ~/.local/bin/lizard"

for lang in "${LANGS[@]}"; do
  case "$lang" in
    csharp)
      recommend "roslynator" "roslynator" "dotnet tool install -g roslynator.dotnet.cli && export PATH=\"\$PATH:\$HOME/.dotnet/tools\""
      ;;
    python)
      recommend "radon" "radon" "pipx install radon"
      recommend "ruff" "ruff" "pipx install ruff"
      ;;
    go)
      recommend "gocyclo" "gocyclo" "go install github.com/fzipp/gocyclo/cmd/gocyclo@latest"
      recommend "staticcheck" "staticcheck" "go install honnef.co/go/tools/cmd/staticcheck@latest"
      ;;
    rust)
      recommend "clippy" "cargo-clippy" "rustup component add clippy"
      ;;
  esac
done

missing=()
echo "Tool status:"
for row in "${needed[@]}"; do
  IFS='|' read -r id bin hint <<<"$row"
  ok=0
  if [[ "$bin" == "cargo-clippy" ]]; then
    if have cargo && cargo clippy -h >/dev/null 2>&1; then ok=1; fi
  elif have "$bin"; then
    ok=1
  fi
  if [[ "$ok" -eq 1 ]]; then
    echo "  OK  $id"
  else
    missing+=("$row")
    echo "  MISSING  $id"
  fi
done
echo

if ((${#missing[@]} == 0)); then
  echo "RESULT: OK — all recommended maintainability tools present."
  exit 0
fi

echo "Install hints:"
for row in "${missing[@]}"; do
  IFS='|' read -r id bin hint <<<"$row"
  echo "  - $id: $hint"
done
echo

if [[ "$INSTALL" -ne 1 ]]; then
  echo "ACTION: STOP. Do not pass --install yet. Ask the user whether to install the missing tools. Re-run with --install only after they agree."
  echo "RESULT: NEED_INSTALL"
  exit 2
fi

echo "Installing missing tools…"
export PATH="$HOME/.local/bin:$HOME/.dotnet/tools:$HOME/.dotnet:$HOME/go/bin:${PATH:-}"
mkdir -p "$HOME/.local/bin"

install_pipx_or_venv() {
  local pkg="$1"
  if have "$pkg"; then return 0; fi
  if have pipx; then
    pipx install "$pkg"
  else
    python3 -m venv "$HOME/.venvs/$pkg"
    "$HOME/.venvs/$pkg/bin/pip" install -q "$pkg"
    ln -sf "$HOME/.venvs/$pkg/bin/$pkg" "$HOME/.local/bin/$pkg"
  fi
}

for row in "${missing[@]}"; do
  IFS='|' read -r id bin hint <<<"$row"
  case "$id" in
    lizard) install_pipx_or_venv lizard ;;
    radon) install_pipx_or_venv radon ;;
    ruff) install_pipx_or_venv ruff ;;
    roslynator)
      if have dotnet; then
        dotnet tool install -g roslynator.dotnet.cli 2>/dev/null || dotnet tool update -g roslynator.dotnet.cli || true
      else
        echo "skip roslynator: no dotnet"
      fi
      ;;
    gocyclo)
      if have go; then go install github.com/fzipp/gocyclo/cmd/gocyclo@latest; else echo "skip gocyclo"; fi
      ;;
    staticcheck)
      if have go; then go install honnef.co/go/tools/cmd/staticcheck@latest; else echo "skip staticcheck"; fi
      ;;
    clippy)
      if have rustup; then rustup component add clippy; else echo "skip clippy"; fi
      ;;
    *)
      echo "No auto-installer for $id — run: $hint"
      ;;
  esac
done

echo
exec bash "$0" "$ROOT"
