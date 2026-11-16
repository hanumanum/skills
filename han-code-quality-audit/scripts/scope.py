"""Which files an audit may read or scan."""

from __future__ import annotations

import os
from pathlib import Path

SKIP_DIRS = frozenset(
    {
        ".git",
        ".hg",
        ".svn",
        ".idea",
        ".vscode",
        "node_modules",
        "bower_components",
        "dist",
        "build",
        "target",
        "out",
        "bin",
        "obj",
        "coverage",
        ".next",
        ".nuxt",
        ".output",
        "vendor",
        "third_party",
        "third-party",
        "venv",
        ".venv",
        "__pycache__",
        "han-code-quality-audit",
        "site-packages",
    }
)

GENERATED_DIR_NAMES = frozenset({"generated", "__generated__"})

LOCKFILE_NAMES = frozenset(
    {
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "cargo.lock",
        "gemfile.lock",
        "composer.lock",
        "poetry.lock",
        "packages.lock.json",
        "go.sum",
        "bun.lock",
        "bun.lockb",
        "shrinkwrap.json",
    }
)

DOC_EXTENSIONS = frozenset(
    {".md", ".mdx", ".rst", ".adoc", ".asciidoc", ".txt", ".pdf", ".doc", ".docx"}
)

LANG_EXTENSIONS: dict[str, frozenset[str]] = {
    "javascript": frozenset({".js", ".jsx", ".mjs", ".cjs"}),
    "typescript": frozenset({".ts", ".tsx"}),
    "python": frozenset({".py"}),
    "java": frozenset({".java"}),
    "csharp": frozenset({".cs"}),
    "cpp": frozenset({".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp", ".hxx"}),
    "php": frozenset({".php"}),
    "go": frozenset({".go"}),
    "rust": frozenset({".rs"}),
    "ruby": frozenset({".rb"}),
}

OTHER_EXTENSIONS = {
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".swift": "swift",
    ".ex": "elixir",
    ".exs": "elixir",
    ".hs": "haskell",
    ".ml": "ocaml",
    ".vue": "vue",
    ".svelte": "svelte",
    ".dart": "dart",
    ".lua": "lua",
    ".sql": "sql",
    ".sh": "shell",
    ".bash": "shell",
    ".zig": "zig",
    ".elm": "elm",
}

EXTENSION_LANG = {
    ext: lang for lang, exts in LANG_EXTENSIONS.items() for ext in exts
}

GENERATED_SUFFIXES = (
    ".generated.ts",
    ".generated.js",
    ".generated.cs",
    ".designer.cs",
    ".g.cs",
    ".pb.go",
    "_pb2.py",
    ".min.js",
    ".bundle.js",
)


def enrich_path() -> None:
    home = Path.home()
    extra = [home / ".local" / "bin", home / "go" / "bin", home / ".dotnet" / "tools"]
    prefix = [str(path) for path in extra if path.is_dir()]
    if prefix:
        os.environ["PATH"] = ":".join(prefix + [os.environ.get("PATH", "")])


def is_generated(path: Path) -> bool:
    name = path.name.lower()
    if any(name.endswith(suffix) for suffix in GENERATED_SUFFIXES):
        return True
    return any(part.lower() in GENERATED_DIR_NAMES for part in path.parts)


def is_lockfile(path: Path) -> bool:
    return path.name.lower() in LOCKFILE_NAMES


def is_documentation(path: Path) -> bool:
    return path.suffix.lower() in DOC_EXTENSIONS


def language_of(path: Path) -> str | None:
    if is_generated(path) or is_lockfile(path) or is_documentation(path):
        return None
    ext = path.suffix.lower()
    if ext in EXTENSION_LANG:
        return EXTENSION_LANG[ext]
    return OTHER_EXTENSIONS.get(ext)


def iter_files(repo: Path):
    repo = repo.resolve()
    for dirpath, dirnames, filenames in os.walk(repo):
        dirnames[:] = sorted(
            name
            for name in dirnames
            if name not in SKIP_DIRS and not name.startswith(".") and name.lower() not in GENERATED_DIR_NAMES
        )
        for name in filenames:
            path = Path(dirpath) / name
            if path.is_symlink():
                continue
            if is_generated(path) or is_lockfile(path) or is_documentation(path):
                continue
            yield path


def rel(repo: Path, path: Path) -> str:
    return path.resolve().relative_to(repo.resolve()).as_posix()
