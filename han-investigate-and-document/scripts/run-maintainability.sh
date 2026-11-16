#!/usr/bin/env bash
# run-maintainability.sh — run lizard (+ stack enhancers) into docs/
# Usage: run-maintainability.sh [REPO_ROOT] [OUT_DIR]
set -euo pipefail

ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"
OUT="${2:-$ROOT/docs/quality-security/static-analysis}"
mkdir -p "$OUT"

export PATH="$HOME/.local/bin:$HOME/.dotnet/tools:$HOME/.dotnet:$HOME/go/bin:${PATH:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
have() { command -v "$1" >/dev/null 2>&1; }

echo "=== run maintainability ==="
echo "Repo: $ROOT"
echo "Out:  $OUT"

# Detect languages via ensure script
DET_OUT="$(bash "$SCRIPT_DIR/ensure-maintainability-tools.sh" "$ROOT" 2>&1 || true)"
echo "$DET_OUT" | sed -n 's/^Detected languages: //p' | tr ' ' '\n' | sed '/^$/d' | sort -u > "$OUT/languages.txt"
if [[ ! -s "$OUT/languages.txt" ]]; then
  echo "unknown" > "$OUT/languages.txt"
fi
echo "Languages: $(tr '\n' ' ' < "$OUT/languages.txt")"

if ! have lizard; then
  echo "ERROR: lizard not installed. Run ensure-maintainability-tools.sh --install first." >&2
  exit 1
fi

LIZARD_LANG_ARGS=()
while read -r lang; do
  case "$lang" in
    csharp) LIZARD_LANG_ARGS+=(-l csharp) ;;
    javascript) LIZARD_LANG_ARGS+=(-l javascript) ;;
    typescript) LIZARD_LANG_ARGS+=(-l typescript) ;;
    python) LIZARD_LANG_ARGS+=(-l python) ;;
    go) LIZARD_LANG_ARGS+=(-l go) ;;
    java) LIZARD_LANG_ARGS+=(-l java) ;;
    kotlin) LIZARD_LANG_ARGS+=(-l kotlin) ;;
    rust) LIZARD_LANG_ARGS+=(-l rust) ;;
    cpp) LIZARD_LANG_ARGS+=(-l cpp) ;;
    php) LIZARD_LANG_ARGS+=(-l php) ;;
    ruby) LIZARD_LANG_ARGS+=(-l ruby) ;;
    swift) LIZARD_LANG_ARGS+=(-l swift) ;;
    scala) LIZARD_LANG_ARGS+=(-l scala) ;;
  esac
done < "$OUT/languages.txt"

EXCLUDES=(
  -x "*/node_modules/*" -x "*/.git/*" -x "*/bin/*" -x "*/obj/*"
  -x "*/vendor/*" -x "*/dist/*" -x "*/build/*" -x "*/target/*"
  -x "*/.venv/*" -x "*/wwwroot/lib/*" -x "*Resources.Designer.cs"
  -x "*/__pycache__/*" -x "*.min.js" -x "*/.next/*" -x "*/coverage/*"
)
THRESH=(-C 10 -L 60 -a 4)

{
  echo "# lizard $(lizard --version 2>/dev/null || true)"
  echo "# root ."
  echo "# date $(date -Iseconds)"
  echo "# languages $(tr '\n' ',' < "$OUT/languages.txt")"
  echo
} > "$OUT/lizard-full.txt"

set +e
# shellcheck disable=SC2086
lizard "$ROOT" "${LIZARD_LANG_ARGS[@]}" "${EXCLUDES[@]}" "${THRESH[@]}" \
  >> "$OUT/lizard-full.txt" 2>"$OUT/lizard.err"
LIZARD_EC=$?
lizard "$ROOT" "${LIZARD_LANG_ARGS[@]}" "${EXCLUDES[@]}" "${THRESH[@]}" -w \
  > "$OUT/lizard-warnings.txt" 2>&1
set -e

echo "lizard exit=$LIZARD_EC (nonzero often means warnings)"
wc -l "$OUT/lizard-full.txt" "$OUT/lizard-warnings.txt" || true

# Stack enhancers
if have roslynator && grep -qx csharp "$OUT/languages.txt"; then
  SLN="$(find "$ROOT" -maxdepth 4 -name '*.sln' 2>/dev/null | head -1 || true)"
  if [[ -n "$SLN" ]]; then
    echo "Running roslynator on $SLN"
    (cd "$(dirname "$SLN")" && roslynator analyze "$(basename "$SLN")" --ignore-analyzer-references) \
      > "$OUT/roslynator.txt" 2>&1 || true
  fi
fi

if have radon && grep -qx python "$OUT/languages.txt"; then
  echo "Running radon"
  (cd "$ROOT" && radon cc -s -a -n B . -e "*/.venv/*,*/node_modules/*") > "$OUT/radon-cc.txt" 2>&1 || true
  (cd "$ROOT" && radon mi -s . -e "*/.venv/*,*/node_modules/*") > "$OUT/radon-mi.txt" 2>&1 || true
fi

if have ruff && grep -qx python "$OUT/languages.txt"; then
  (cd "$ROOT" && ruff check . --statistics) > "$OUT/ruff.txt" 2>&1 || true
fi

if have gocyclo && grep -qx go "$OUT/languages.txt"; then
  (cd "$ROOT" && gocyclo -over 10 .) > "$OUT/gocyclo.txt" 2>&1 || true
fi

if have staticcheck && grep -qx go "$OUT/languages.txt"; then
  (cd "$ROOT" && staticcheck ./...) > "$OUT/staticcheck.txt" 2>&1 || true
fi

if have cargo && grep -qx rust "$OUT/languages.txt"; then
  (cd "$ROOT" && cargo clippy --message-format=short 2>&1) > "$OUT/clippy.txt" || true
fi

# Stored reports must not keep the machine path of the repo.
python3 - "$ROOT" "$OUT" <<'PY'
import sys
from pathlib import Path
root = str(Path(sys.argv[1]).resolve())
out = Path(sys.argv[2])
for path in out.rglob("*"):
    if not path.is_file():
        continue
    text = path.read_text(errors="replace")
    text = text.replace(root + "/", "").replace(root, ".")
    path.write_text(text)
PY

{
  echo "languages=$(paste -sd, "$OUT/languages.txt")"
  echo "lizard_full=docs/quality-security/static-analysis/lizard-full.txt"
  echo "lizard_warnings=docs/quality-security/static-analysis/lizard-warnings.txt"
  echo "tools_run=$(ls -1 "$OUT" | tr '\n' ' ')"
} > "$OUT/manifest.txt"

echo "RESULT: OK — synthesize docs/quality-security/maintainability-analysis.md"
echo "Manifest: docs/quality-security/static-analysis/manifest.txt"
ls -la "$OUT"
