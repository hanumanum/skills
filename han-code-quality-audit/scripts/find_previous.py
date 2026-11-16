#!/usr/bin/env python3
"""Print the newest earlier report for one property."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import PROPERTIES, resolve_properties

REPORT_RE = re.compile(r"^(\d{2})\.(.+)\.(\d{4}-\d{2}-\d{2}T\d{6}(?:-\d+)?)\.md$")


def find_previous(repo: Path, property_id: str, exclude_run: str) -> Path | None:
    root = repo / "han-code-quality-audit"
    if not root.is_dir():
        return None
    name = next(str(prop["name"]) for prop in PROPERTIES if str(prop["id"]) == property_id)
    matches: list[tuple[str, Path]] = []
    for path in root.glob(f"*/*{name}*.md"):
        match = REPORT_RE.match(path.name)
        if not match or match.group(1) != property_id or match.group(2) != name:
            continue
        if path.parent.name == exclude_run:
            continue
        matches.append((match.group(3), path))
    if not matches:
        return None
    matches.sort(key=lambda item: item[0])
    return matches[-1][1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--property", required=True)
    parser.add_argument("--exclude-run", required=True)
    args = parser.parse_args()
    prop = resolve_properties(args.property)
    if len(prop) != 1:
        raise SystemExit("Pass one property id or name")
    found = find_previous(Path(args.repo).resolve(), str(prop[0]["id"]), args.exclude_run)
    print("NONE" if found is None else found)


if __name__ == "__main__":
    main()
