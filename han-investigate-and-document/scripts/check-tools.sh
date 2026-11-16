#!/usr/bin/env bash
# check-tools.sh — verify tools for han-investigate-and-document
set -euo pipefail

STACK="auto"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack) STACK="${2:-auto}"; shift 2 ;;
    -h|--help)
      echo "Usage: check-tools.sh [--stack auto|dotnet|node|python|go|java]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

have() { command -v "$1" >/dev/null 2>&1; }

ok=()
missing_req=()
missing_opt=()
install_hints=()

check_req() {
  local bin="$1" hint="${2:-}"
  if have "$bin"; then
    ok+=("$bin")
  else
    missing_req+=("$bin")
    [[ -n "$hint" ]] && install_hints+=("$bin: $hint")
  fi
}

check_opt() {
  local bin="$1" hint="${2:-}"
  if have "$bin"; then
    ok+=("$bin (optional)")
  else
    missing_opt+=("$bin")
    [[ -n "$hint" ]] && install_hints+=("$bin (optional): $hint")
  fi
}

# Detect stack from cwd if auto
detect_stack() {
  if compgen -G "*.sln" > /dev/null || compgen -G "*.csproj" > /dev/null \
    || find . -maxdepth 4 \( -name '*.sln' -o -name '*.csproj' \) 2>/dev/null | head -1 | grep -q .; then
    echo "dotnet"
  elif [[ -f package.json ]]; then
    echo "node"
  elif [[ -f go.mod ]]; then
    echo "go"
  elif [[ -f pom.xml ]] || compgen -G "build.gradle*" > /dev/null; then
    echo "java"
  elif [[ -f pyproject.toml || -f requirements.txt || -f setup.py ]]; then
    echo "python"
  else
    echo "unknown"
  fi
}

if [[ "$STACK" == "auto" ]]; then
  STACK="$(detect_stack)"
fi

echo "=== han-investigate-and-document tool check ==="
echo "Stack hint: $STACK"
echo

# Baseline required
check_req git "sudo apt install git   # or your package manager"
if have rg; then
  ok+=("rg")
elif have grep; then
  ok+=("grep (rg preferred)")
  install_hints+=("rg (optional upgrade): sudo apt install ripgrep")
else
  missing_req+=("grep/rg")
  install_hints+=("grep/rg: sudo apt install ripgrep")
fi

# Stack-specific required
case "$STACK" in
  dotnet)
    check_req dotnet "Install .NET SDK: https://dot.net"
    ;;
  node)
    check_req node "Install Node.js LTS"
    check_req npm "Comes with Node.js"
    ;;
  python)
    check_req python3 "sudo apt install python3"
    ;;
  go)
    check_req go "Install Go toolchain"
    ;;
  java)
    if have mvn || have gradle || have ./gradlew; then
      ok+=("maven/gradle")
    else
      missing_req+=("mvn|gradle")
      install_hints+=("mvn|gradle: install Maven or use project gradlew")
    fi
    ;;
  *)
    echo "Note: stack unknown — ensure the repo language toolchain is installed."
    ;;
esac

# Optionals
check_opt jq "sudo apt install jq"
check_opt dot "sudo apt install graphviz"
check_opt gh "https://cli.github.com/"
check_opt docker "https://docs.docker.com/engine/install/"
check_opt syft "curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b \"\$HOME/.local/bin\""
if have cdxgen || have npx; then
  ok+=("cdxgen or npx (SBOM fallback)")
else
  missing_opt+=("cdxgen|npx")
  install_hints+=("cdxgen (optional): npm i -g @cyclonedx/cdxgen")
fi
check_opt lizard "pipx install lizard   # maintainability; see ensure-maintainability-tools.sh"

echo "Present:"
for x in "${ok[@]:-}"; do echo "  OK  $x"; done
echo
if ((${#missing_req[@]})); then
  echo "Missing REQUIRED:"
  for x in "${missing_req[@]}"; do echo "  MISSING  $x"; done
  echo
fi
if ((${#missing_opt[@]})); then
  echo "Missing OPTIONAL:"
  for x in "${missing_opt[@]}"; do echo "  missing  $x"; done
  echo
fi
if ((${#install_hints[@]})); then
  echo "Install hints:"
  for x in "${install_hints[@]}"; do echo "  - $x"; done
  echo
fi

if ((${#missing_req[@]})) || ((${#missing_opt[@]})); then
  echo "ACTION: STOP. Do not install yet. Ask the user whether to install the missing tools (name, required or optional, why, command). Install only what they approve, then re-run. If they decline an optional tool, continue without it."
fi
if ((${#missing_req[@]})); then
  echo "RESULT: FAIL (required tools missing)"
  exit 1
fi
if ((${#missing_opt[@]})); then
  echo "RESULT: OK_WITH_GAPS (optionals missing)"
  exit 2
fi
echo "RESULT: OK"
exit 0
