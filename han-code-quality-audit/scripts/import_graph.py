#!/usr/bin/env python3
"""Build a file-to-file import graph and list cycles for one language."""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scope import LANG_EXTENSIONS, iter_files, language_of, rel

MAX_FILE_BYTES = 1_000_000
MAX_CYCLES = 30

JS_SPEC = re.compile(
    r"""(?:\bimport\s+(?:[^'";]+?\s+from\s*)?|\bexport\s+[^'";]+?\s+from\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['\"]([^'\"]+)['\"]""",
    re.M,
)
GO_QUOTED = re.compile(r'^\s*(?:import\s+)?"([^"]+)"', re.M)
CPP_INCLUDE = re.compile(r'^\s*#\s*include\s+"([^"]+)"', re.M)
JAVA_PACKAGE = re.compile(r"^\s*package\s+([\w.]+)\s*;", re.M)
JAVA_IMPORT = re.compile(r"^\s*import\s+(?:static\s+)?([\w.]+)(?:\.\*)?\s*;", re.M)
CS_NAMESPACE = re.compile(r"^\s*namespace\s+([\w.]+)", re.M)
CS_USING = re.compile(r"^\s*using\s+(?!static\b)(?:[\w.]+\s*=\s*)?([\w.]+)\s*;", re.M)
PHP_NAMESPACE = re.compile(r"^\s*namespace\s+([\w\\]+)\s*;", re.M)
PHP_USE = re.compile(r"^\s*use\s+([\w\\]+)", re.M)
RUBY_REL = re.compile(r"""require_relative\s+['\"]([^'\"]+)['\"]""")
RUBY_ABS = re.compile(r"""^\s*require\s+['\"]([^'\"]+)['\"]""", re.M)
RUST_MOD = re.compile(r"^\s*(?:pub\s+)?mod\s+([A-Za-z_][A-Za-z0-9_]*)\s*;", re.M)
RUST_USE = re.compile(r"^\s*(?:pub\s+)?use\s+([^;]+);", re.M)


def read_text(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_FILE_BYTES:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def files_for(repo: Path, lang: str) -> list[Path]:
    found = []
    for path in iter_files(repo):
        if language_of(path) == lang:
            found.append(path)
    return found


def index_by_rel(repo: Path, paths: list[Path]) -> dict[str, Path]:
    return {rel(repo, path): path for path in paths}


def resolve_relative(spec: str, source: Path, repo: Path, exts: frozenset[str], index: dict[str, Path]) -> str | None:
    base = (source.parent / spec).resolve()
    candidates = [base]
    if base.suffix == "":
        candidates.extend(base.with_suffix(ext) for ext in sorted(exts))
        candidates.extend(base / f"index{ext}" for ext in sorted(exts))
    else:
        candidates.append(base)
    for candidate in candidates:
        try:
            key = candidate.resolve().relative_to(repo.resolve()).as_posix()
        except ValueError:
            continue
        if key in index:
            return key
    return None


def add_edge(edges: dict[str, set[str]], src: str, dst: str) -> None:
    if src != dst and dst:
        edges.setdefault(src, set()).add(dst)


def graph_js(repo: Path, lang: str, paths: list[Path]) -> dict[str, set[str]]:
    index = index_by_rel(repo, paths)
    exts = LANG_EXTENSIONS[lang]
    edges: dict[str, set[str]] = {}
    for path in paths:
        source = rel(repo, path)
        for spec in JS_SPEC.findall(read_text(path)):
            if not spec.startswith("."):
                continue
            dest = resolve_relative(spec, path, repo, exts, index)
            if dest:
                add_edge(edges, source, dest)
    return edges


def py_key(path: Path, repo: Path) -> str:
    relative = Path(rel(repo, path))
    parts = list(relative.with_suffix("").parts)
    if parts and parts[-1] == "__init__":
        parts = parts[:-1]
    return ".".join(parts)


def graph_python(repo: Path, paths: list[Path]) -> dict[str, set[str]]:
    keys = {py_key(path, repo): rel(repo, path) for path in paths}
    edges: dict[str, set[str]] = {}

    def lookup(name: str) -> str | None:
        parts = name.split(".")
        for size in range(len(parts), 0, -1):
            found = keys.get(".".join(parts[:size]))
            if found:
                return found
        return None

    for path in paths:
        source = rel(repo, path)
        text = read_text(path)
        if not text:
            continue
        try:
            tree = ast.parse(text)
        except SyntaxError:
            continue
        package = list(Path(source).parent.parts)
        for node in ast.walk(tree):
            targets: list[str] = []
            if isinstance(node, ast.Import):
                targets.extend(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                level = node.level or 0
                if level == 0:
                    base = node.module or ""
                else:
                    parts = package[: len(package) - (level - 1)] if level else package
                    if node.module:
                        parts = parts + node.module.split(".")
                    base = ".".join(parts)
                if base:
                    targets.append(base)
                for alias in node.names:
                    if alias.name != "*":
                        targets.append(f"{base}.{alias.name}" if base else alias.name)
            for target in targets:
                dest = lookup(target)
                if dest:
                    add_edge(edges, source, dest)
    return edges


def graph_package(repo: Path, paths: list[Path], package_re: re.Pattern[str], import_re: re.Pattern[str], sep: str) -> dict[str, set[str]]:
    packages: dict[str, list[str]] = {}
    own: dict[str, str] = {}
    for path in paths:
        text = read_text(path)
        match = package_re.search(text)
        if not match:
            continue
        name = match.group(1).replace(sep, ".")
        source = rel(repo, path)
        own[source] = name
        packages.setdefault(name, []).append(source)
    edges: dict[str, set[str]] = {}

    def lookup(name: str) -> list[str]:
        parts = name.split(".")
        for size in range(len(parts), 0, -1):
            found = packages.get(".".join(parts[:size]))
            if found:
                return found
        return []

    for path in paths:
        source = rel(repo, path)
        for match in import_re.finditer(read_text(path)):
            imported = match.group(1).replace(sep, ".")
            for dest in lookup(imported):
                add_edge(edges, source, dest)
    return edges


def graph_cpp(repo: Path, paths: list[Path]) -> dict[str, set[str]]:
    index = index_by_rel(repo, paths)
    by_name: dict[str, list[str]] = {}
    for key in index:
        by_name.setdefault(Path(key).name, []).append(key)
    edges: dict[str, set[str]] = {}
    exts = LANG_EXTENSIONS["cpp"]
    for path in paths:
        source = rel(repo, path)
        for spec in CPP_INCLUDE.findall(read_text(path)):
            dest = resolve_relative(spec, path, repo, exts, index)
            if dest is None and len(by_name.get(Path(spec).name, [])) == 1:
                dest = by_name[Path(spec).name][0]
            if dest:
                add_edge(edges, source, dest)
    return edges


def graph_go(repo: Path, paths: list[Path]) -> dict[str, set[str]]:
    module = ""
    gomod = repo / "go.mod"
    if gomod.exists():
        for line in read_text(gomod).splitlines():
            if line.startswith("module "):
                module = line.split(None, 1)[1].strip()
                break
    dirs: dict[str, list[str]] = {}
    for path in paths:
        source = rel(repo, path)
        if source.endswith("_test.go"):
            continue
        directory = str(Path(source).parent)
        import_path = module if directory == "." else f"{module}/{directory}" if module else directory
        dirs.setdefault(import_path, []).append(source)
    edges: dict[str, set[str]] = {}
    for path in paths:
        source = rel(repo, path)
        for spec in GO_QUOTED.findall(read_text(path)):
            for dest in dirs.get(spec, []):
                add_edge(edges, source, dest)
    return edges


def graph_ruby(repo: Path, paths: list[Path]) -> dict[str, set[str]]:
    index = index_by_rel(repo, paths)
    by_suffix: dict[str, list[str]] = {}
    for key in index:
        by_suffix.setdefault(key, []).append(key)
        if key.endswith(".rb"):
            by_suffix.setdefault(key[: -3], []).append(key)
    edges: dict[str, set[str]] = {}
    for path in paths:
        source = rel(repo, path)
        text = read_text(path)
        for spec in RUBY_REL.findall(text):
            dest = resolve_relative(spec, path, repo, frozenset({".rb"}), index)
            if dest:
                add_edge(edges, source, dest)
        for spec in RUBY_ABS.findall(text):
            matches = by_suffix.get(spec) or by_suffix.get(spec + ".rb") or []
            if len(matches) == 1:
                add_edge(edges, source, matches[0])
    return edges


def graph_rust(repo: Path, paths: list[Path]) -> dict[str, set[str]]:
    index = index_by_rel(repo, paths)
    edges: dict[str, set[str]] = {}
    for path in paths:
        source = rel(repo, path)
        text = read_text(path)
        for name in RUST_MOD.findall(text):
            for candidate in (path.parent / f"{name}.rs", path.parent / name / "mod.rs"):
                key = None
                try:
                    key = candidate.resolve().relative_to(repo.resolve()).as_posix()
                except ValueError:
                    continue
                if key in index:
                    add_edge(edges, source, key)
        for clause in RUST_USE.findall(text):
            clause = clause.split(" as ", 1)[0].strip()
            if clause.startswith("crate::"):
                parts = clause.split("::")[1:]
            elif clause.startswith("super::"):
                parts = list(Path(source).parent.parent.parts) + clause.split("::")[1:]
            else:
                continue
            parts = [part for part in parts if part and part != "{" and not part.startswith("{")]
            if not parts:
                continue
            stem = Path(*parts)
            for candidate in (repo / "src" / stem).with_suffix(".rs"), repo / "src" / stem / "mod.rs":
                try:
                    key = candidate.resolve().relative_to(repo.resolve()).as_posix()
                except ValueError:
                    continue
                if key in index:
                    add_edge(edges, source, key)
                    break
    return edges


def cycles(edges: dict[str, set[str]]) -> list[list[str]]:
    found: list[list[str]] = []
    visiting: set[str] = set()
    visited: set[str] = set()
    stack: list[str] = []

    def walk(node: str) -> None:
        if len(found) >= MAX_CYCLES or node in visited:
            return
        if node in visiting:
            if node in stack:
                start = stack.index(node)
                found.append(stack[start:] + [node])
            return
        visiting.add(node)
        stack.append(node)
        for dest in sorted(edges.get(node, ())):
            walk(dest)
            if len(found) >= MAX_CYCLES:
                break
        stack.pop()
        visiting.remove(node)
        visited.add(node)

    for node in sorted(edges):
        walk(node)
        if len(found) >= MAX_CYCLES:
            break
    return found


BUILDERS = {
    "javascript": lambda repo, paths: graph_js(repo, "javascript", paths),
    "typescript": lambda repo, paths: graph_js(repo, "typescript", paths),
    "python": lambda repo, paths: graph_python(repo, paths),
    "java": lambda repo, paths: graph_package(repo, paths, JAVA_PACKAGE, JAVA_IMPORT, "."),
    "csharp": lambda repo, paths: graph_package(repo, paths, CS_NAMESPACE, CS_USING, "."),
    "cpp": lambda repo, paths: graph_cpp(repo, paths),
    "php": lambda repo, paths: graph_package(repo, paths, PHP_NAMESPACE, PHP_USE, "\\"),
    "go": lambda repo, paths: graph_go(repo, paths),
    "rust": lambda repo, paths: graph_rust(repo, paths),
    "ruby": lambda repo, paths: graph_ruby(repo, paths),
}


def scan_language(repo: Path, lang: str) -> dict:
    paths = files_for(repo, lang)
    edges = BUILDERS[lang](repo, paths) if lang in BUILDERS else {}
    edge_count = sum(len(dests) for dests in edges.values())
    found = cycles(edges)
    return {
        "language": lang,
        "files": len(paths),
        "edges": edge_count,
        "cycles": found,
        "truncated": len(found) >= MAX_CYCLES,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--languages", required=True, help="Comma-separated language ids")
    parser.add_argument("--timestamp", required=True)
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for lang in [part.strip() for part in args.languages.split(",") if part.strip()]:
        if lang not in BUILDERS:
            continue
        payload = scan_language(repo, lang)
        out = out_dir / f"import-graph.{lang}.{args.timestamp}.json"
        out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        written.append(str(out))
    print("\n".join(written))


if __name__ == "__main__":
    main()
