"""Property order and external tools for han-code-quality-audit."""

from __future__ import annotations

PROPERTIES: list[dict[str, object]] = [
    {
        "id": "01",
        "name": "Architectural consistency",
        "slug": "architectural-consistency",
        "aliases": ("architecture", "architectural", "handlers", "architectural consistency"),
    },
    {
        "id": "02",
        "name": "Dedup exact copies",
        "slug": "dedup-exact-copies",
        "aliases": ("dedup exact", "exact copies", "exact dedup", "dedup exact copies"),
    },
    {
        "id": "03",
        "name": "Separation of concerns",
        "slug": "separation-of-concerns",
        "aliases": ("separation of concerns", "soc", "concerns"),
    },
    {
        "id": "04",
        "name": "Purify functions",
        "slug": "purify-functions",
        "aliases": ("purify", "pure functions", "purify functions"),
    },
    {
        "id": "05",
        "name": "Dedup near-duplicates",
        "slug": "dedup-near-duplicates",
        "aliases": ("dedup near", "near duplicates", "near-duplicates", "dedup near-duplicates"),
    },
    {
        "id": "06",
        "name": "Hardcoded domain literals",
        "slug": "hardcoded-domain-literals",
        "aliases": ("hardcoded", "literals", "domain literals", "hardcoded domain literals"),
    },
    {
        "id": "07",
        "name": "Modularity",
        "slug": "modularity",
        "aliases": ("modules", "dependencies", "modularity"),
    },
    {
        "id": "08",
        "name": "Complexity",
        "slug": "complexity",
        "aliases": ("cyclomatic", "cognitive", "complexity"),
    },
    {
        "id": "09",
        "name": "Observability",
        "slug": "observability",
        "aliases": ("observability", "logging", "tracing", "logs"),
    },
]

EXTERNAL_TOOLS: dict[str, dict[str, str]] = {
    "jscpd": {
        "bin": "jscpd",
        "install": "npm install -g jscpd",
        "why": "Finds duplicated source for the exact-copy and near-duplicate passes.",
    },
    "lizard": {
        "bin": "lizard",
        "install": "python3 -m pip install --user lizard",
        "why": "Cyclomatic complexity for JavaScript, TypeScript, Java, C#, C++, PHP, Rust, and as fallback for Python, Go, and Ruby.",
    },
    "radon": {
        "bin": "radon",
        "install": "python3 -m pip install --user radon",
        "why": "Cyclomatic complexity for Python.",
    },
    "gocyclo": {
        "bin": "gocyclo",
        "install": "go install github.com/fzipp/gocyclo/cmd/gocyclo@latest",
        "why": "Cyclomatic complexity for Go. The binary lands in ~/go/bin.",
    },
    "rubocop": {
        "bin": "rubocop",
        "install": "gem install rubocop --user-install",
        "why": "Cyclomatic complexity for Ruby.",
    },
    "madge": {
        "bin": "madge",
        "install": "npm install -g madge",
        "why": "Import cycles for JavaScript and TypeScript.",
    },
}

LIZARD_PRIMARY = frozenset({"javascript", "typescript", "java", "csharp", "cpp", "php", "rust"})
LIZARD_LANGS = LIZARD_PRIMARY | frozenset({"python", "go", "ruby"})
PREFERRED = {"python": "radon", "go": "gocyclo", "ruby": "rubocop"}


def resolve_properties(spec: str) -> list[dict[str, object]]:
    text = spec.strip()
    if text == "" or text.lower() == "all":
        return list(PROPERTIES)
    chosen: list[dict[str, object]] = []
    seen: set[str] = set()
    for part in text.split(","):
        key = part.strip().lower()
        if not key:
            continue
        match = None
        for prop in PROPERTIES:
            names = {str(prop["id"]), str(prop["slug"]), str(prop["name"]).lower()}
            names.update(str(alias).lower() for alias in prop["aliases"])  # type: ignore[union-attr]
            if key in names:
                match = prop
                break
        if match is None:
            known = ", ".join(str(prop["name"]) for prop in PROPERTIES)
            raise SystemExit(f"Unknown property: {part.strip()}\nKnown properties: {known}")
        prop_id = str(match["id"])
        if prop_id not in seen:
            seen.add(prop_id)
            chosen.append(match)
    order = {str(prop["id"]): index for index, prop in enumerate(PROPERTIES)}
    chosen.sort(key=lambda prop: order[str(prop["id"])])
    return chosen


def needed_tools(property_ids: list[str], languages: list[str]) -> list[str]:
    props = set(property_ids)
    langs = set(languages)
    tools: list[str] = []
    if props & {"02", "05"}:
        tools.append("jscpd")
    if "08" in props:
        if langs & LIZARD_PRIMARY:
            tools.append("lizard")
        for lang, tool in PREFERRED.items():
            if lang in langs:
                tools.append(tool)
    if "07" in props and langs & {"javascript", "typescript"}:
        tools.append("madge")
    return tools
